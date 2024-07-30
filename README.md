# iPGPT: Y-Combinator Interview Simulator

iPGPT is an enhanced Y-Combinator interview simulator that asks general questions about you and your company, similar to what you might be asked in a real Y-Combinator, or any incubator/investor, interview. This updated version includes audio recording and AI-generated feedback in the style of Paul Graham.

## Features

- Simulates YC interview questions
- Audio recording of your responses
- Real-time transcription of your answers
- AI-generated feedback in Paul Graham's style using GPT-4o
- Timer to keep your answers concise

## Setup and Installation

1. Clone this repository:
   ```
   git clone https://github.com/personjerry/ipgpt.git
   cd ipgpt
   ```

2. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```

3. Set up your OpenAI API key as an environment variable:
   ```
   export OPENAI_API_KEY=your_api_key_here
   ```

   Note: Make sure to replace `your_api_key_here` with your actual OpenAI API key.

## Running the Simulator

1. Start the Python server:
   ```
   python server.py
   ```

2. Open a web browser and navigate to:
   ```
   http://localhost:5000
   ```

3. Click "Start Interview" to begin your answer. Press Enter to progress to process your response and get feedback or to go to the next answer.

4. After each answer, you'll receive AI-generated feedback in the style of Paul Graham.

## Usage Tips

- Try to keep your answers concise and to the point.
- The timer will help you stay within a reasonable time frame for each answer.
- Pay attention to the AI-generated feedback to improve your responses.

## Technologies Used

- HTML/CSS/JavaScript for the frontend
- Flask for the backend server
- OpenAI's Whisper API for speech-to-text transcription
- OpenAI's GPT-4o for generating Paul Graham-style feedback

## Original Authors

iPG was originally created by James Cunningham and Colin Hayhurst

iPGPT is made by Jerry Liu

## Disclaimer

This simulator is for educational and preparation purposes only. It is not affiliated with Y Combinator or Paul Graham.