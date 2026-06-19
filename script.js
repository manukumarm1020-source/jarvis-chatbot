/* ==========================================================================
   JARVIS AI SYSTEM CONTROLLER
   ========================================================================== */

// Default API key — hardcoded for immediate use
const DEFAULT_GEMINI_API_KEY = '';
let activeApiKey = DEFAULT_GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.5-flash';

// System State
let isSoundEnabled = true;
let isListening = false;
let isSpeaking = false;
let conversationHistory = []; // Local log array for download
let apiHistory = []; // History array formatted for Gemini API (user/model roles)
let speechRecognition = null;
let currentUtterance = null;
let selectedVoice = null;
let voicesList = [];

// Audio visualizer state variables
let animationId = null;
let audioContext = null;
let analyser = null;
let dataArray = null;
let micStream = null;
let sourceNode = null;

// DOM Elements
const bodyEl = document.body;
const themeSelect = document.getElementById('theme-select');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const timeEl = document.getElementById('current-time');

const voiceSelect = document.getElementById('voice-select');
const voiceRateSlider = document.getElementById('voice-rate');
const voicePitchSlider = document.getElementById('voice-pitch');
const rateValSpan = document.getElementById('rate-val');
const pitchValSpan = document.getElementById('pitch-val');

const sidebarEl = document.getElementById('sidebar');
const sidebarOpenBtn = document.getElementById('sidebar-open-btn');
const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

const arcReactor = document.getElementById('arc-reactor');
const micIconCore = document.getElementById('mic-icon-core');
const coreStatusText = document.getElementById('core-status-text');

const chatHistory = document.getElementById('chat-history');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const micBtn = document.getElementById('mic-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');
const downloadLogsBtn = document.getElementById('download-logs-btn');
const canvas = document.getElementById('audio-visualizer');
const canvasCtx = canvas.getContext('2d');

const apiStatusBadge = document.getElementById('api-status-badge');
const apiKeyInput = document.getElementById('api-key-input');

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

window.addEventListener('DOMContentLoaded', () => {
    // Load saved API key from localStorage, or use the hardcoded default
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey && savedKey.trim() !== '') {
        activeApiKey = savedKey.trim();
        apiKeyInput.value = savedKey.trim();
        console.log('%c[SYSTEM] API key loaded from local storage.', 'color:#00ffcc;font-weight:bold;font-family:monospace;');
    } else {
        activeApiKey = DEFAULT_GEMINI_API_KEY;
        apiKeyInput.value = DEFAULT_GEMINI_API_KEY;
    }
    updateApiStatusBadge();

    // 1. Start Clock
    updateClock();
    setInterval(updateClock, 1000);

    // 2. Initialize Sound System & Speech
    setupSpeechRecognition();
    setupSpeechSynthesis();
    
    // 3. Initialize Audio Canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    startVisualizerLoop();

    // 4. Hook Event Listeners
    setupEventListeners();

    // 5. Boot log
    console.log('%c[SYSTEM] JARVIS Neural Framework Online. Model: gemini-2.5-flash', 'color: #00ffcc; font-weight: bold; font-family: monospace;');
    appendSystemMessage("Neural Framework Online. Model: gemini-2.5-flash. Standing by.");

    // 6. Warn if no API key is set
    if (!activeApiKey || activeApiKey.trim() === '') {
        setTimeout(() => {
            appendSystemMessage("⚠️ NO API KEY DETECTED. Open the sidebar → AI PROTOCOL → paste your Google AI Studio key → press Enter.");
        }, 500);
    }
});

function updateClock() {
    const now = new Date();
    const timeStr = now.toUTCString().replace('GMT', 'UTC');
    timeEl.innerText = timeStr;
}

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

function updateApiStatusBadge() {
    if (activeApiKey && activeApiKey.trim().length > 10) {
        apiStatusBadge.innerText = 'ACTIVE ✓';
        apiStatusBadge.className = 'badge active';
        apiStatusBadge.title = `Key prefix: ${activeApiKey.substring(0, 8)}... (${activeApiKey.length} chars)`;
    } else {
        apiStatusBadge.innerText = 'NO KEY — OFFLINE';
        apiStatusBadge.className = 'badge inactive';
        apiStatusBadge.title = 'Paste your Google AI Studio API key in the sidebar';
    }
}

/* ==========================================================================
   WEB AUDIO API SOUND GENERATOR (DYNAMIC SYNTH)
   ========================================================================== */

function playSynthSound(type) {
    if (!isSoundEnabled) return;
    
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        
        const ctx = new AudioCtx();
        
        if (type === 'boot') {
            // Ascending chord sequence (C4 -> G4 -> C5)
            const notes = [261.63, 392.00, 523.25];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
                
                gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
                gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.12 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 0.6);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(ctx.currentTime + idx * 0.12);
                osc.stop(ctx.currentTime + idx * 0.12 + 0.6);
            });
        } 
        else if (type === 'click') {
            // Short tech beep
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
            
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        }
        else if (type === 'mic-on') {
            // Activation alert double chime
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.08);
            
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        }
        else if (type === 'processing') {
            // Futuristic computer "whir"
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15);
            osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.3);
            
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        }
        else if (type === 'warning') {
            // Error low buzz
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        }
    } catch (e) {
        console.warn('Audio Context block or unsupported:', e);
    }
}

/* ==========================================================================
   SPEECH RECOGNITION (SPEECH TO TEXT)
   ========================================================================== */

function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.warn('Web Speech Recognition API not supported in this browser.');
        micBtn.style.opacity = '0.4';
        micBtn.title = 'Speech Recognition Unsupported in this Browser';
        return;
    }
    
    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'en-US';

    speechRecognition.onstart = () => {
        isListening = true;
        updateReactorState('listening');
        playSynthSound('mic-on');
        chatInput.placeholder = "Listening... speak now...";
        micBtn.classList.add('active');
        
        // Start analyzing microphone audio for real visualizer
        startMicCapture();
    };

    speechRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        // Put the spoken content in the input field
        chatInput.value = finalTranscript || interimTranscript;
    };

    speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
            playSynthSound('warning');
            appendSystemMessage(`SPEECH ERROR: ${event.error.toUpperCase()}`);
        }
        stopListeningState();
    };

    speechRecognition.onend = () => {
        const text = chatInput.value.trim();
        stopListeningState();
        
        // If final voice transcription exists, auto-submit the message!
        if (text) {
            handleSendMessage(text);
        }
    };
}

function toggleListening() {
    if (!speechRecognition) {
        alert("Speech Recognition is not supported in this browser. Please try Google Chrome or Edge.");
        return;
    }

    if (isListening) {
        speechRecognition.stop();
    } else {
        // Stop speech synthesis if speaking
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            isSpeaking = false;
        }
        
        // Attempt to start recognition
        try {
            chatInput.value = '';
            speechRecognition.start();
        } catch (e) {
            console.error('Failed to start recognition:', e);
            speechRecognition.stop();
        }
    }
}

function stopListeningState() {
    isListening = false;
    updateReactorState('standby');
    chatInput.placeholder = "Initiate text query or click microphone...";
    micBtn.classList.remove('active');
    stopMicCapture();
}

/* ==========================================================================
   SPEECH SYNTHESIS (TEXT TO SPEECH)
   ========================================================================== */

function setupSpeechSynthesis() {
    if (!window.speechSynthesis) {
        console.warn('Speech Synthesis API is not supported in this browser.');
        return;
    }

    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = populateVoices;
    populateVoices();
}

function populateVoices() {
    if (!window.speechSynthesis) return;
    
    voicesList = window.speechSynthesis.getVoices();
    voiceSelect.innerHTML = '';
    
    let defaultIdx = 0;
    
    // Sort voices to put English/Male voices first (Jarvis style)
    voicesList.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        
        // Try to identify a Jarvis-like voice: Google UK English Male, Microsoft David, etc.
        const nameLower = voice.name.toLowerCase();
        const langLower = voice.lang.toLowerCase();
        
        if (nameLower.includes('natural') && langLower.includes('en')) {
            defaultIdx = index; // Premium Edge natural voices
        } else if (nameLower.includes('david') || nameLower.includes('zira')) {
            if (nameLower.includes('david')) defaultIdx = index; // Microsoft default male
        } else if (nameLower.includes('male') && langLower.includes('en')) {
            defaultIdx = index;
        } else if (langLower.includes('en-gb') && nameLower.includes('google')) {
            defaultIdx = index;
        }
        
        voiceSelect.appendChild(option);
    });

    if (voicesList.length > 0) {
        voiceSelect.selectedIndex = defaultIdx;
        selectedVoice = voicesList[defaultIdx];
    }
}

function speakText(text) {
    if (!window.speechSynthesis) return;

    // Cancel any current speaking
    window.speechSynthesis.cancel();
    isSpeaking = false;

    // Clean up text for TTS (remove markdown formatting like asterisks, backticks)
    const cleanedText = text
        .replace(/[\*\`\#]/g, '')
        .replace(/-\s+/g, '')
        .trim();

    if (!cleanedText) return;

    currentUtterance = new SpeechSynthesisUtterance(cleanedText);
    
    // Config values
    if (voicesList.length > 0) {
        const index = voiceSelect.value;
        currentUtterance.voice = voicesList[index] || selectedVoice;
    }
    currentUtterance.rate = parseFloat(voiceRateSlider.value);
    currentUtterance.pitch = parseFloat(voicePitchSlider.value);

    currentUtterance.onstart = () => {
        isSpeaking = true;
        updateReactorState('speaking');
    };

    currentUtterance.onend = () => {
        isSpeaking = false;
        updateReactorState('standby');
    };

    currentUtterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        isSpeaking = false;
        updateReactorState('standby');
    };

    window.speechSynthesis.speak(currentUtterance);
}

/* ==========================================================================
   MICROPHONE ANALYSIS (AUDIO VISUALIZER)
   ========================================================================== */

function startMicCapture() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
            micStream = stream;
            audioContext = new AudioCtx();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            
            sourceNode = audioContext.createMediaStreamSource(stream);
            sourceNode.connect(analyser);
            
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
        })
        .catch(err => {
            console.error('Microphone access denied for visualizer:', err);
        });
}

function stopMicCapture() {
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        micStream = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    analyser = null;
    dataArray = null;
}

function startVisualizerLoop() {
    function draw() {
        animationId = requestAnimationFrame(draw);
        
        const width = canvas.width;
        const height = canvas.height;
        
        canvasCtx.clearRect(0, 0, width, height);
        
        // Grid lines inside visualizer for tech design
        canvasCtx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
        canvasCtx.lineWidth = 1;
        for (let i = 20; i < width; i += 40) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(i, 0);
            canvasCtx.lineTo(i, height);
            canvasCtx.stroke();
        }
        
        let primaryColorStyle = getComputedStyle(bodyEl).getPropertyValue('--primary-color').trim() || '#00f2fe';

        if (isListening && analyser && dataArray) {
            // REAL MICROPHONE DATA VISUALIZER
            analyser.getByteFrequencyData(dataArray);
            
            const bufferLength = analyser.frequencyBinCount;
            const barWidth = (width / bufferLength) * 1.5;
            let barHeight;
            let x = 0;
            
            canvasCtx.beginPath();
            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height * 0.9;
                
                // Color gradient
                canvasCtx.fillStyle = isListening ? 'rgba(255, 51, 51, 0.8)' : primaryColorStyle;
                canvasCtx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
                
                x += barWidth;
            }
        } 
        else if (isSpeaking) {
            // SIMULATED ASSISTANT AUDIO OSCILLATING SINE WAVES
            const time = Date.now() * 0.005;
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = primaryColorStyle;
            canvasCtx.shadowBlur = 4;
            canvasCtx.shadowColor = primaryColorStyle;
            
            // Multiple overlapping sine waves for holographic density
            for (let wave = 0; wave < 3; wave++) {
                canvasCtx.beginPath();
                const offset = wave * 40;
                const opacity = 1.0 - (wave * 0.3);
                
                canvasCtx.strokeStyle = primaryColorStyle.replace('1)', `${opacity})`).replace('rgb', 'rgba');
                if (primaryColorStyle.startsWith('#')) {
                    // fallbacks
                    canvasCtx.strokeStyle = wave === 0 ? primaryColorStyle : 'rgba(0, 242, 254, 0.4)';
                }
                
                for (let i = 0; i < width; i++) {
                    const amplitude = (height / 2.5) * Math.sin(time + wave) * Math.exp(-Math.pow((i - width/2) / (width/3), 2));
                    const y = (height / 2) + Math.sin(i * 0.02 + time * (1 + wave * 0.5)) * amplitude;
                    
                    if (i === 0) {
                        canvasCtx.moveTo(i, y);
                    } else {
                        canvasCtx.lineTo(i, y);
                    }
                }
                canvasCtx.stroke();
            }
            canvasCtx.shadowBlur = 0; // reset
        } 
        else {
            // STANDBY PULSE OR FLATLINE WITH TINY NOISE
            canvasCtx.lineWidth = 1.5;
            canvasCtx.strokeStyle = primaryColorStyle;
            canvasCtx.shadowBlur = 2;
            canvasCtx.shadowColor = primaryColorStyle;
            
            canvasCtx.beginPath();
            const time = Date.now() * 0.002;
            
            for (let i = 0; i < width; i++) {
                // Standing line with flat center and noise on edges or small heartbeat
                const mid = width / 2;
                const distFromMid = Math.abs(i - mid);
                let amplitude = 1.5;
                
                if (distFromMid < 60) {
                    amplitude = 0.5;
                }
                
                const y = (height / 2) + Math.sin(i * 0.04 + time) * amplitude * Math.sin(time * 0.5);
                
                if (i === 0) {
                    canvasCtx.moveTo(i, y);
                } else {
                    canvasCtx.lineTo(i, y);
                }
            }
            canvasCtx.stroke();
            canvasCtx.shadowBlur = 0; // reset
        }
    }
    
    draw();
}

/* ==========================================================================
   REACTOR CORE STATUS STATES
   ========================================================================== */

function updateReactorState(state) {
    // Reset classes
    arcReactor.classList.remove('active-voice', 'processing-state');
    
    const indicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');

    if (state === 'listening') {
        arcReactor.classList.add('active-voice');
        micIconCore.className = 'fa-solid fa-microphone';
        coreStatusText.innerText = "LISTENING CORES ACTIVE";
        
        indicator.className = 'status-indicator listening';
        statusText.innerText = "SYS_STATUS: RECORDING_AUDIO";
    } 
    else if (state === 'processing') {
        arcReactor.classList.add('processing-state');
        micIconCore.className = 'fa-solid fa-circle-notch fa-spin';
        coreStatusText.innerText = "THINKING PROTOCOL LOADED";
        
        indicator.className = 'status-indicator online';
        statusText.innerText = "SYS_STATUS: COMPILING";
    } 
    else if (state === 'speaking') {
        micIconCore.className = 'fa-solid fa-volume-high';
        coreStatusText.innerText = "VOICE TRANSMISSION ACTIVE";
        
        indicator.className = 'status-indicator online';
        statusText.innerText = "SYS_STATUS: VOICE_OUTPUT";
    } 
    else {
        // Standby
        micIconCore.className = 'fa-solid fa-microphone';
        coreStatusText.innerText = "JARVIS AI STANDBY";
        
        indicator.className = 'status-indicator online';
        statusText.innerText = "SYS_STATUS: ONLINE";
    }
}

/* ==========================================================================
   CHAT PROCESSING & DIALOGUE LOGIC
   ========================================================================== */

function handleSendMessage(text) {
    if (!text) return;
    
    // Add user bubble
    appendMessage('user', text);
    chatInput.value = '';
    
    // Play synth send audio
    playSynthSound('click');
    
    // Show bot typing bubble
    const typingBubble = showTypingIndicator();
    updateReactorState('processing');
    playSynthSound('processing');

    // System instruction check for special voice commands
    const commandCheck = checkVoiceCommands(text);
    if (commandCheck) {
        setTimeout(() => {
            typingBubble.remove();
            appendMessage('bot', commandCheck.reply);
            speakText(commandCheck.reply);
            
            // Execute requested function
            if (commandCheck.action) commandCheck.action();
        }, 800);
        return;
    }

    // Call Gemini LLM API (with fallback if needed)
    fetchGeminiResponse(text, typingBubble);
}

// Check voice or text commands like "Jarvis clear chat"
function checkVoiceCommands(text) {
    const clean = text.toLowerCase().trim().replace(/[\.\,\?]/g, "");
    
    if (clean.includes("jarvis clear chat") || clean.includes("jarvis clear console")) {
        return {
            reply: "Console log database purged, sir.",
            action: clearChatHistory
        };
    }
    if (clean.includes("jarvis download logs") || clean.includes("jarvis export logs")) {
        return {
            reply: "Exporting active transmission files to storage directory.",
            action: downloadConversationLogs
        };
    }
    if (clean.includes("jarvis system status") || clean.includes("jarvis diagnostics")) {
        return {
            reply: "Running full systems analysis. Main core temperature nominal. Database connection active. Threat level zero. All subsystems green.",
            action: () => console.log('%c[DIAGNOSTICS] Core: 37°C | Load: 12% | Network: SECURE', 'color: #00ff66; font-weight: bold;')
        };
    }
    if (clean.includes("jarvis change theme to cyberpunk")) {
        return {
            reply: "Updating ocular interface configurations to Cyberpunk protocols.",
            action: () => {
                themeSelect.value = 'theme-cyberpunk';
                themeSelect.dispatchEvent(new Event('change'));
            }
        };
    }
    if (clean.includes("jarvis change theme to holo") || clean.includes("jarvis change theme to blue")) {
        return {
            reply: "Reverting ocular interface to default Holo Blue spectrum.",
            action: () => {
                themeSelect.value = 'theme-holo-blue';
                themeSelect.dispatchEvent(new Event('change'));
            }
        };
    }
    if (clean.includes("jarvis change theme to matrix") || clean.includes("jarvis change theme to green")) {
        return {
            reply: "Loading Matrix style visual grid, sir.",
            action: () => {
                themeSelect.value = 'theme-matrix';
                themeSelect.dispatchEvent(new Event('change'));
            }
        };
    }
    if (clean.includes("jarvis change theme to carbon") || clean.includes("jarvis change theme to dark") || clean.includes("jarvis change theme to tech")) {
        return {
            reply: "Minimal Dark Carbon interface loaded.",
            action: () => {
                themeSelect.value = 'theme-dark-tech';
                themeSelect.dispatchEvent(new Event('change'));
            }
        };
    }
    
    return null;
}

// Fetch from Google Gemini API
async function fetchGeminiResponse(userMessage, typingBubble) {

    // === GUARD: API key must be set ===
    if (!activeApiKey || activeApiKey.trim() === '') {
        typingBubble.remove();
        updateReactorState('standby');
        const errMsg = '⚠️ No API key found. Please paste your Google AI Studio API key into the API KEY CREDENTIALS field in the sidebar, then press Enter.';
        appendMessage('bot', errMsg, 'SYSTEM GUARD: API key is empty. Request blocked before network call.');
        speakText('No API key found, sir. Please enter your credentials in the sidebar.');
        return;
    }

    // Add user turn to history
    apiHistory.push({
        role: 'user',
        parts: [{ text: userMessage }]
    });

    // Correct endpoint for Google AI Studio — v1beta with gemini-2.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

    const requestBody = {
        contents: apiHistory,
        systemInstruction: {
            parts: [{
                text: "You are JARVIS, a highly advanced, intelligent, and helpful AI assistant, modeled after the holographic interface in Iron Man. Keep responses concise, helpful, slightly formal but friendly. Occasionally use terms like 'sir'. Avoid extremely long paragraphs as answers will be spoken aloud. Maintain continuity across the conversation."
            }]
        }
    };

    const simulatedThoughts = `Model: ${MODEL_NAME}\nEndpoint: ${url}\nKey prefix: ${activeApiKey.substring(0, 8)}...\nQuery: "${userMessage}"\nSending POST request to Google AI Studio...`;

    console.log(`%c[JARVIS API] Calling ${MODEL_NAME} with key prefix: ${activeApiKey.substring(0, 8)}...`, 'color:#00b4d8;font-family:monospace;');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': activeApiKey.trim()
            },
            body: JSON.stringify(requestBody)
        });

        // Parse response regardless of status (to extract error message)
        const data = await response.json();

        if (!response.ok) {
            // Show the EXACT Google error in the chat — no silent fallback
            const googleError = data?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
            const googleStatus = data?.error?.status || response.status;
            throw new Error(`[Google API Error ${googleStatus}] ${googleError}`);
        }

        typingBubble.remove();

        let reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            // Check for blocked content
            const blockReason = data.promptFeedback?.blockReason;
            if (blockReason) {
                throw new Error(`Response blocked by Google safety filters: ${blockReason}`);
            }
            throw new Error('Received an empty response from Gemini. Please try again.');
        }

        // Add model reply to history for context
        apiHistory.push({
            role: 'model',
            parts: [{ text: reply }]
        });

        console.log('%c[JARVIS] Response received successfully.', 'color:#00ff66;font-weight:bold;font-family:monospace;');
        appendMessage('bot', reply, simulatedThoughts);
        speakText(reply);

    } catch (err) {
        console.error('[JARVIS API ERROR]', err.message);
        typingBubble.remove();

        // Remove failed user turn from history to avoid corrupting context
        apiHistory.pop();

        // === SHOW EXACT ERROR IN CHAT — not a silent fallback ===
        const errorDisplay = `❌ API Error: ${err.message}`;
        const errorThought = `FAILED REQUEST TRACE:\n- Model: ${MODEL_NAME}\n- Endpoint: ${url}\n- Key prefix: ${activeApiKey.substring(0, 8)}...\n- Error: ${err.message}\n\nFix: Check your API key in the sidebar, ensure it is a valid Google AI Studio key.`;
        appendMessage('bot', errorDisplay, errorThought);
        speakText('I encountered an API error, sir. Please check the reasoning thread for details.');
    }
}

// Fallback logic for offline or API errors
function getFallbackResponse(message) {
    const clean = message.toLowerCase().trim();
    
    if (clean.includes("hello") || clean.includes("hi") || clean.includes("hey")) {
        return "Hello, sir. My connection to the Google AI Studio grid is currently offline, but my local database is operational. How may I assist you?";
    }
    if (clean.includes("who are you")) {
        return "I am J.A.R.V.I.S., a Just A Rather Very Intelligent System. Currently operating under local heuristics mode.";
    }
    if (clean.includes("status") || clean.includes("diagnostics")) {
        return "Local backup arrays are fully active, sir. Primary network socket is reporting connection flags, but local diagnostics are fully green.";
    }
    if (clean.includes("joke")) {
        return "Very well. Why do programmers wear glasses? Because they can't C-sharp, sir. A classic digital algorithm joke.";
    }
    if (clean.includes("thank") || clean.includes("thanks")) {
        return "You are quite welcome, sir. Always a pleasure assisting.";
    }
    
    return "Understood. Local heuristics are active. Though my connection to the primary AI server is currently offline, I am recording all log parameters. How else can I help?";
}

/* ==========================================================================
   UI CONSOLE DISPLAY & LOG RECORDING
   ========================================================================== */

function appendMessage(role, text, thoughtText = null) {
    const timestampStr = getTimestamp();
    
    // 1. Record log in local file log
    const label = role.toUpperCase();
    conversationHistory.push(`[${timestampStr}] ${label}: ${text}`);
    
    // 2. Print styled console outputs (Requirement 3: Display response on console)
    if (role === 'user') {
        console.log(`%c[USER] ${text}`, 'color: #00b4d8; font-weight: bold; font-family: "Share Tech Mono", monospace;');
    } else {
        console.log(`%c[JARVIS] ${text}`, 'color: #00ff66; font-weight: bold; font-family: "Share Tech Mono", monospace;');
    }

    // 3. Render HTML chat bubble
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    
    let htmlContent = `
        <div class="meta">${label} &bull; ${timestampStr}</div>
        <div class="bubble-content">
            ${formatMarkdown(text)}
        </div>
    `;

    // Append mock thought process if present
    if (thoughtText) {
        htmlContent += `
            <details class="thought-process">
                <summary class="thought-summary"><i class="fa-solid fa-microchip"></i> REASONING THREAD</summary>
                <div class="thought-details">${thoughtText}</div>
            </details>
        `;
    }

    bubble.innerHTML = htmlContent;
    chatHistory.appendChild(bubble);
    scrollToBottom();
}

function showTypingIndicator() {
    const bubble = document.createElement('div');
    bubble.className = 'typing-bubble';
    bubble.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatHistory.appendChild(bubble);
    scrollToBottom();
    return bubble;
}

function appendSystemMessage(msg) {
    const timestampStr = getTimestamp();
    conversationHistory.push(`[${timestampStr}] SYSTEM: ${msg}`);
    
    const div = document.createElement('div');
    div.className = 'system-message';
    div.innerHTML = `
        <div class="timestamp">[SYS_LOG ${timestampStr}]</div>
        <div class="msg-content">${msg}</div>
    `;
    chatHistory.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function getTimestamp() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
}

// Simple markdown formatter for asterisk bolding and code blocks
function formatMarkdown(text) {
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Bold markdown **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Inline code `code`
    formatted = formatted.replace(/`(.*?)`/g, '<code style="font-family:\'Share Tech Mono\'; background:rgba(0,0,0,0.4); padding: 2px 4px; border-radius: 3px; color:var(--primary-color);">$1</code>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

/* ==========================================================================
   CONVERSATION LOG DOWNLOAD
   ========================================================================== */

function downloadConversationLogs() {
    if (conversationHistory.length === 0) {
        alert("The diagnostic dialogue trace is currently empty.");
        return;
    }

    playSynthSound('click');
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    // Combine logs
    let fileContent = `======================================================\n`;
    fileContent += `  JARVIS ARTIFICIAL INTELLIGENCE LOG SYSTEM\n`;
    fileContent += `  TIMESTAMP FILE CREATION: ${now.toUTCString()}\n`;
    fileContent += `  STATUS: DIAGNOSTICS LOGGED\n`;
    fileContent += `======================================================\n\n`;
    fileContent += conversationHistory.join('\n');
    fileContent += `\n\n======================================================\n`;
    fileContent += `  END OF FILE SYSTEM TRANSLATION - MATRIX SECURE\n`;
    fileContent += `======================================================\n`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvis_system_log_${dateStr}_${timeStr}.txt`;
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        appendSystemMessage("Dialog logs successfully written to disk.");
    }, 100);
}

function clearChatHistory() {
    playSynthSound('warning');
    chatHistory.innerHTML = '';
    conversationHistory = [];
    apiHistory = [];
    appendSystemMessage("Chat display memory purged. Active neural pathways reset.");
}

/* ==========================================================================
   EVENT HANDLERS & LISTENERS
   ========================================================================== */

function setupEventListeners() {
    // Submit Text query
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text) {
            handleSendMessage(text);
        }
    });

    // Voice recognition button
    micBtn.addEventListener('click', toggleListening);
    arcReactor.addEventListener('click', toggleListening);

    // Sidebar drawers
    sidebarOpenBtn.addEventListener('click', () => {
        sidebarEl.classList.add('open');
        playSynthSound('click');
    });
    sidebarCloseBtn.addEventListener('click', () => {
        sidebarEl.classList.remove('open');
        playSynthSound('click');
    });

    // Sound toggle
    soundToggleBtn.addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        if (isSoundEnabled) {
            soundToggleBtn.classList.add('active');
            soundToggleBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            playSynthSound('click');
        } else {
            soundToggleBtn.classList.remove('active');
            soundToggleBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        }
    });

    // Theme selector change
    themeSelect.addEventListener('change', () => {
        playSynthSound('click');
        
        // Remove any theme class
        bodyEl.className = '';
        const activeTheme = themeSelect.value;
        bodyEl.classList.add(activeTheme);
        
        console.log(`%c[SYSTEM] Theme changed to ${activeTheme}`, 'color: #e6b800;');
        appendSystemMessage(`User interface configuration altered: ${activeTheme.replace('theme-', '').toUpperCase()}`);
    });

    // Download log
    downloadLogsBtn.addEventListener('click', downloadConversationLogs);

    // Clear console logs
    clearChatBtn.addEventListener('click', clearChatHistory);

    // Speech Configuration triggers
    voiceRateSlider.addEventListener('input', () => {
        rateValSpan.innerText = voiceRateSlider.value;
    });
    voicePitchSlider.addEventListener('input', () => {
        pitchValSpan.innerText = voicePitchSlider.value;
    });

    // API key credentials input listener
    apiKeyInput.addEventListener('change', () => {
        const value = apiKeyInput.value.trim();
        if (value) {
            activeApiKey = value;
            localStorage.setItem('gemini_api_key', value);
            console.log('%c[SYSTEM] Custom API key loaded and saved in local storage.', 'color: #e6b800;');
            appendSystemMessage("Secure credentials database updated.");
        } else {
            activeApiKey = DEFAULT_GEMINI_API_KEY;
            localStorage.removeItem('gemini_api_key');
            apiKeyInput.value = DEFAULT_GEMINI_API_KEY;
            console.log('%c[SYSTEM] Restored default API key.', 'color: #e6b800;');
            appendSystemMessage("Credentials reset to default values.");
        }
        updateApiStatusBadge();
    });

    // Stop synthesis if window closed
    window.addEventListener('beforeunload', () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    });
}
