const marshaller = require("@aws-sdk/eventstream-marshaller");
const util_utf8_node = require("@aws-sdk/util-utf8-node");
const getUserMedia = require('get-user-media-promise');
const MicrophoneStream  = require('microphone-stream').default;
const crypto = require('crypto');
const v4 = require('./aws-signature-v4');
const audioUtils = require('./audioUtils');

const eventStreamMarshaller = new marshaller.EventStreamMarshaller(util_utf8_node.toUtf8, util_utf8_node.fromUtf8);
const startRec = document.getElementById('start-rec');
const stopRec = document.getElementById('stop-rec');
const clearText = document.getElementById('clear-text');
const message = document.getElementById('message');
const transcriptionText = document.getElementById('transcriptionArea');

const sampleRate = 44100;
const languageCode = 'en-US'
let inputSampleRate = 0;
let transcription = '';
let socket = {};

// Display message
const showMessage = errorMessage =>
    message.innerHTML = errorMessage;

// Clear message div
const clearMessage = () =>
    message.innerHTML = '';

// Create socket connection URL
const createPresignedUrl = () => {
    const region = document.getElementById('region').value
    const endpoint = `transcribestreaming.${region}.amazonaws.com:8443`;
    // get a preauthenticated URL that we can use to establish our WebSocket
    return v4.createPresignedURL(
        'GET',
        endpoint,
        '/stream-transcription-websocket',
        'transcribe',
        crypto.createHash('sha256').update('', 'utf8').digest('hex'), {
            'key': document.getElementById('accessId').value,
            'secret': document.getElementById('secretKey').value,
            'protocol': 'wss',
            'expires': 15,
            'region': region,
            'query': `language-code=${languageCode}&media-encoding=pcm&sample-rate=${sampleRate}`
        }
    );
}

// Wrap the audio data in a JSON envelope
const getAudioEventMessage = buffer => {
    return {
        headers: {
            ':message-type': {
                type: 'string',
                value: 'event'
            },
            ':event-type': {
                type: 'string',
                value: 'AudioEvent'
            }
        },
        body: buffer
    };
}

// Convert raw audio data to binary
const convertAudioToBinaryMessage = raw => {
    // Downsample and convert the raw audio bytes to PCM
    const downsampledBuffer = audioUtils.downsampleBuffer(raw, inputSampleRate, sampleRate);
    let pcmEncodedBuffer = audioUtils.pcmEncode(downsampledBuffer);

    // Add the right JSON headers and structure to the message
    const audioEventMessage = getAudioEventMessage(Buffer.from(pcmEncodedBuffer));

    // Convert the JSON object + headers into a binary event stream message
    return eventStreamMarshaller.marshall(audioEventMessage);
}

// Stream audio to the socket, handle socket responses 
const streamAudioToWebSocket = micStream => {
    // Generate socket url
    const url = createPresignedUrl();

    // Create socket
    socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";

    // Open socket and send audio
    socket.onopen = function() {
        micStream.on('data', chunk => {
            const raw = MicrophoneStream.toRaw(chunk)
            const binaryAudio = convertAudioToBinaryMessage(raw)
            if (socket.readyState === socket.OPEN)
                socket.send(binaryAudio);
        }
    )};

    // Handle socket response
    socket.onmessage = function (message) {
        // Convert the binary event stream message to JSON
        let messageWrapper = eventStreamMarshaller.unmarshall(Buffer(message.data));
        let messageBody = JSON.parse(String.fromCharCode.apply(String, messageWrapper.body));
        if (messageWrapper.headers[":message-type"].value === "event") {
            const results = messageBody.Transcript.Results;
            if (results.length && results[0].Alternatives.length) {
                let transcript = results[0].Alternatives[0].Transcript;

                // Fix encoding for accented characters
                transcript = decodeURIComponent(escape(transcript));
                transcriptionText.value = transcription + transcript + "\n";

                // If this transcript segment is final, add it to the overall transcription
                if (!results[0].IsPartial)
                    transcription += transcript + "\n";
            }
        }
        else
            showMessage(messageBody.Message);
    };

    // Handle socket connection error
    socket.onerror = () => {
        showMessage('WebSocket connection error. Try again.');
    };
    
    // Handle socket closing
    socket.onclose = () => {
        showMessage('Socket connection stopped.')
    };
}

// On start button click, get audio and stream using a websocket 
startRec.addEventListener('click', (e) => {
    e.target.disabled = true;
    stopRec.disabled = false;
    clearMessage();

    const micStream = new MicrophoneStream();

    // Get input sample rate
    micStream.on('format', format => {
        inputSampleRate = format.sampleRate;
    });

    // Take stream and forward it to a socket
    getUserMedia({ video: false, audio: true })
        .then(stream => micStream.setStream(stream))
        .then(() => streamAudioToWebSocket(micStream))
        .catch(error => {
            showMessage(`Error: ${error}`);
            micStream.stop();
        });
    
    // On stop button click
    stopRec.addEventListener('click', (e) => {
        e.target.disabled = true;
        startRec.disabled = false;
        micStream.stop();

        // Send empty buffer to initiate socket closure
        const emptyMessage = getAudioEventMessage(Buffer.from(new Buffer([])));
        const emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
        socket.send(emptyBuffer);
    });
});

// Clear transcription area
clearText.addEventListener('click', function() {
    transcriptionText.value = ''
});
