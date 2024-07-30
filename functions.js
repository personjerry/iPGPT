let mediaRecorder;
let audioChunks = [];
let timer;
let timerInterval;
let isRecording = false;
let audioContext;
let analyser;
let dataArray;
let canvas, canvasCtx;
let currentState = 'between_rounds'; // 'in_round', 'between_rounds', 'processing'

// Ensure q is defined (assuming it's coming from data.js)
if (typeof q === 'undefined') {
    console.error('q is not defined. Make sure data.js is loaded before functions.js');
    q = []; // Initialize as empty array to prevent errors
}

function setupAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    canvas = document.getElementById('visualizer');
    canvasCtx = canvas.getContext('2d');
}

function visualize() {
    if (currentState !== 'in_round') return;

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    requestAnimationFrame(visualize);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    let sliceWidth = WIDTH * 1.0 / analyser.frequencyBinCount;
    let x = 0;

    for(let i = 0; i < analyser.frequencyBinCount; i++) {
        let v = dataArray[i] / 128.0;
        let y = v * HEIGHT/2;

        if(i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();
}

async function startRecording() {
    if (isRecording) return;
    
    if (!audioContext) {
        setupAudioContext();
    }

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(mediaStream);

        const source = audioContext.createMediaStreamSource(mediaStream);
        source.connect(analyser);

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = sendAudioToServer;

        mediaRecorder.start();
        isRecording = true;
        
        visualize();
        
        // Start the timer after successfully starting the recording
        timer_restart();
    } catch (error) {
        console.error('Error starting recording:', error);
        // If there's an error, still start the timer
        timer_restart();
    }
}

function stopRecording() {
    if (!isRecording) return;
    
    mediaRecorder.stop();
    isRecording = false;
    clearInterval(timerInterval);

    // Stop all tracks in the media stream
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
}

function sendAudioToServer() {
    currentState = 'processing';
    updateUI();

    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('question', currentQuestion); // Add the current question

    fetch('/transcribe_and_feedback', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        displayTranscriptAndFeedback(data.transcript, data.feedback);
        currentState = 'between_rounds';
        updateUI();
    })
    .catch(error => {
        console.error('Error:', error);
        currentState = 'between_rounds';
        updateUI();
    });

    audioChunks = [];
}


function displayTranscriptAndFeedback(transcript, feedback) {
    document.getElementById('transcription-text').textContent = transcript;
    document.getElementById('feedback-text').textContent = feedback;
    document.getElementById('response').classList.remove('hide');
    document.getElementById('feedback').classList.remove('hide');
}

function timer_restart() {
    clearInterval(timerInterval);
    timer = 15; // Set to 15 seconds
    $('#timer').removeClass('warning fail hide').text(timer + ' s');
    timerInterval = setInterval(timer_tick, 1000);
}

function timer_tick() {
    timer--;
    $('#timer').text(timer + ' s');

    if (timer < 10) {
        $('#timer').addClass('warning');
    }
    if (timer < 5) {
        $('#timer').removeClass('warning').addClass('fail');
    }
    if (timer <= 0) {
        endRound();
    }
}

function endRound() {
    clearInterval(timerInterval);
    $('#timer').addClass('hide');
    stopRecording();
    currentState = 'processing';
    updateUI();
}

let currentQuestion = '';

function next_q() {
    if ($('#end').hasClass('hide')) {
        var question = q.shift();
        
        if (question !== 'done') {
            currentQuestion = question;
            $('#question').html(question);
            $('#response').addClass('hide');
            $('#feedback').addClass('hide');
            
            currentState = 'in_round';
            updateUI();
            
            startRecording();
        } else {
            currentState = 'end';
            updateUI();
        }
    }
}

function updateUI() {
    switch(currentState) {
        case 'in_round':
            $('#timer').removeClass('hide');
            $('#visualizer').removeClass('hide');
            $('#processing').addClass('hide');
            break;
        case 'between_rounds':
            $('#timer').addClass('hide');
            $('#visualizer').addClass('hide');
            $('#processing').addClass('hide');
            break;
        case 'processing':
            $('#timer').addClass('hide');
            $('#visualizer').addClass('hide');
            $('#processing').removeClass('hide');
            break;
        case 'end':
            $('#question').addClass('hide');
            $('#timer').addClass('hide');
            $('#visualizer').addClass('hide');
            $('#processing').addClass('hide');
            $('#end').removeClass('hide');
            break;
    }
}

// Event listeners
$(document).keypress(function(e) {
    if (e.which == 13) { // 13 is enter
        if (currentState === 'in_round') {
            endRound();
        } else if (currentState === 'between_rounds') {
            next_q();
        }
    }
});

// Initialize
$(document).ready(function() {
    // Set up a button to start the interview
    $('body').prepend('<div id="start-interview"><button>Start Interview</button></div>');
    $('#start-interview').click(function() {
		$('#openai').attr('hidden', false);
        $(this).remove(); // Remove the button after clicking
        setupAudioContext();
        next_q();
    });
});