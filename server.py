from flask import Flask, request, jsonify, send_from_directory
from openai import OpenAI
import os
import logging
import tempfile

app = Flask(__name__, static_folder='.')

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/transcribe_and_feedback', methods=['POST'])
def transcribe_and_feedback():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    question = request.form.get('question', 'Unknown question')
    
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp_file:
            audio_file.save(tmp_file)
            tmp_file_path = tmp_file.name

        # Transcribe audio
        with open(tmp_file_path, 'rb') as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        
        logging.info(f"Transcription result: {transcript}")

        # Generate feedback using GPT-4o
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are Paul Graham, the founder of Y Combinator. Provide brief, direct feedback on the interviewee's response in your characteristic style. Be concise, insightful, and if necessary, critical."},
                {"role": "user", "content": f"The interview question was: {question}\n\nThe interviewee's response was: {transcript.text}"}
            ]
        )

        logging.info(f"GPT-4o response: {completion}")

        feedback = completion.choices[0].message.content

        # Clean up the temporary file
        os.unlink(tmp_file_path)

        return jsonify({'transcript': transcript.text, 'feedback': feedback})

    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        return jsonify({'error': 'An error occurred processing your request'}), 500

if __name__ == '__main__':
    app.run(debug=True)