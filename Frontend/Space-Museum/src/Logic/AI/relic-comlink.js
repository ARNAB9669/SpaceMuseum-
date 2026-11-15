import * as THREE from 'three';

/*/ ============================================================================
    relic-comlink.js — Direct First-Person Voice Com-Link with Spacecraft & Relics
    NASA Space Apps Challenge 2026: "Abandoned but not Forgotten"
    Architecture Adopted from Covelly Live Voice Gateway (Covelly/cw.js & script.js)
    Handles 16kHz PCM streaming, 24kHz PCM playback, real-time barge-in,
    and two-way conversational Q&A with Google Gemini Multimodal Live API.
    ============================================================================ /*/

/*/ Audio Processing Utility Functions (from Covelly/script.js) /*/
function downsampleTo16k(inputData, inputSampleRate) {
  if (inputSampleRate === 16000) return inputData;
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(inputData.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.floor((i + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let j = start; j < end && j < inputData.length; j++) {
      sum += inputData[j];
      count++;
    }
    result[i] = count > 0 ? sum / count : 0;
  }
  return result;
}

function float32ToInt16(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

function int16ToFloat32(int16Array) {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
  }
  return float32Array;
}

function bufferToBase64(int16Array) {
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const evenLen = len % 2 === 0 ? len : len - 1;
  const bytes = new Uint8Array(evenLen);
  for (let i = 0; i < evenLen; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

export class RelicComlink {
  constructor() {
    this.isActive = false;
    this.currentRelic = null;
    this.currentRelicName = null;
    this.ws = null;
    this.micStream = null;
    this.audioCtx = null;
    this.processor = null;
    this.micSource = null;
    this.analyser = null;
    this.analyserData = null;
    this.activeSources = [];
    this.nextPlayTime = 0;
    this.isConnected = false;
    this.isConnecting = false;
    this.isSetupComplete = false;
    this.isSpeaking = false;

    /*/ Default Gateway WebSocket URL (override via window.RELIC_GATEWAY_URL) /*/
    this.gatewayUrl = (typeof window !== 'undefined' && window.RELIC_GATEWAY_URL)
      ? window.RELIC_GATEWAY_URL
      : 'wss://space-museum-relic-gateway.arnabbiswas9669.workers.dev';

    /*/ Active Gemini Voice Model (override via window.RELIC_LIVE_MODEL) /*/
    this.liveModel = (typeof window !== 'undefined' && window.RELIC_LIVE_MODEL)
      ? window.RELIC_LIVE_MODEL
      : 'models/gemini-3.8-live';

    /*/ Relic ID Mapping for Courtyard Platforms & Wall Posters /*/
    this.platformRelicMap = {
      '01': { id: 'apollo_11', name: 'Apollo 11 LM (Eagle)' },
      '06': { id: 'spirit_and_opportunity', name: 'Spirit & Opportunity' },
      '07': { id: 'viking_1', name: 'Viking 1 Lander' },
      '08': { id: 'insight', name: 'InSight Lander' },
      '09': { id: 'dawn', name: 'Dawn Spacecraft' },
      '10': { id: 'near_shoemaker', name: 'NEAR Shoemaker' },
      '11': { id: 'pioneer_10_11', name: 'Pioneer 10 & 11' },
      '12': { id: 'ingenuity', name: 'Ingenuity Mars Helicopter' }
    };

    this.initUI();
  }

  /*/ Create Floating Sci-Fi Com-Link HUD Overlay /*/
  initUI() {
    if (typeof document === 'undefined') return;

    const overlay = document.createElement('div');
    overlay.id = 'relic-comlink-hud';
    overlay.style.position = 'fixed';
    overlay.style.top = '28px';
    overlay.style.left = '50%';
    overlay.style.transform = 'translateX(-50%)';
    overlay.style.display = 'none';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.gap = '8px';
    overlay.style.padding = '14px 28px';
    overlay.style.background = 'rgba(7, 11, 20, 0.92)';
    overlay.style.border = '1px solid rgba(56, 189, 248, 0.5)';
    overlay.style.borderRadius = '32px';
    overlay.style.boxShadow = '0 12px 48px rgba(56, 189, 248, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
    overlay.style.backdropFilter = 'blur(12px)';
    overlay.style.webkitBackdropFilter = 'blur(12px)';
    overlay.style.zIndex = '99999';
    overlay.style.color = '#e2e8f0';
    overlay.style.fontFamily = 'monospace';
    overlay.style.pointerEvents = 'auto';

    overlay.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span id="comlink-indicator" style="width: 10px; height: 10px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 12px #38bdf8; animation: pulse 1.5s infinite;"></span>
        <span id="comlink-title" style="font-weight: 700; font-size: 14px; letter-spacing: 1px; color: #38bdf8;">COM-LINK CONNECTED</span>
        <span id="comlink-model-badge" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); color: #7dd3fc; border-radius: 12px; padding: 2px 8px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px;">Gemini 3.8 Live</span>
        <span id="comlink-status" style="font-size: 12px; color: #94a3b8; margin-left: 4px;">[Listening]</span>
        <button id="comlink-close-btn" style="margin-left: 14px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.6); color: #fca5a5; border-radius: 16px; padding: 4px 12px; cursor: pointer; font-size: 11px; font-weight: 600; font-family: monospace;">DISCONNECT</button>
      </div>
      <div id="comlink-waveform" style="display: flex; align-items: center; gap: 3px; height: 20px; margin-top: 4px;"></div>
    `;

    document.body.appendChild(overlay);
    this.hudElement = overlay;

    const waveform = overlay.querySelector('#comlink-waveform');
    if (waveform) {
      for (let i = 0; i < 20; i++) {
        const bar = document.createElement('div');
        bar.className = 'wave-bar';
        bar.style.width = '3px';
        bar.style.height = '4px';
        bar.style.background = '#38bdf8';
        bar.style.borderRadius = '2px';
        bar.style.transition = 'height 0.08s ease';
        waveform.appendChild(bar);
      }
    }

    const closeBtn = overlay.querySelector('#comlink-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stopComlink();
      });
    }
  }

  /*/ Start Com-Link with Selected Spacecraft / Relic /*/
  async startComlink(relicId, relicName = 'Spacecraft') {
    /*/ Debounce concurrent clicks or key-repeats /*/
    if (this.isConnecting) return;

    if (this.isActive) {
      if (this.currentRelic === relicId) {
        this.stopComlink();
        return;
      }
      this.stopComlink();
    }

    this.isConnecting = true;
    this.isActive = true;
    this.currentRelic = relicId;
    this.currentRelicName = relicName;

    if (this.hudElement) {
      this.hudElement.style.display = 'flex';
      const titleEl = this.hudElement.querySelector('#comlink-title');
      const statusEl = this.hudElement.querySelector('#comlink-status');
      if (titleEl) titleEl.textContent = `COM-LINK: ${relicName.toUpperCase()}`;
      if (statusEl) statusEl.textContent = '[Connecting to Telemetry...]';
    }

    try {
      /*/ 1. Initialize Single Web AudioContext and unlock via user gesture /*/
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx({ latencyHint: 'interactive' });
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      /*/ Output Analyser for live HUD waveform visualization /*/
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);

      /*/ 2. Request Microphone Access /*/
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.micStream = stream;

      /*/ 3. Connect to WebSocket Gateway (Specifying Gemini 3.8 Live & Spacecraft Relic) /*/
      const wsUrl = `${this.gatewayUrl}/ws?relic=${encodeURIComponent(relicId)}&model=${encodeURIComponent(this.liveModel)}`;
      console.log(`[RelicComlink] Connecting to Gateway: ${wsUrl}`);
      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        if (this.ws !== socket) return;
        console.log('[RelicComlink] WebSocket connection established.');
        this.isConnected = true;
        this.isConnecting = false;
        const statusEl = this.hudElement?.querySelector('#comlink-status');
        if (statusEl) statusEl.textContent = '[Telemetry Online • Negotiating Live Channel...]';
      };

      socket.onmessage = async (event) => {
        if (this.ws !== socket) return;
        let text = event.data;
        if (text && typeof text.text === 'function') {
          text = await text.text();
        } else if (text instanceof Blob) {
          text = await text.text();
        }
        try {
          const msg = JSON.parse(text);
          this.handleGatewayMessage(msg);
        } catch (e) {
          console.warn('[RelicComlink] Failed to parse message JSON:', e);
        }
      };

      socket.onerror = (err) => {
        if (this.ws !== socket) return;
        console.error('[RelicComlink] WebSocket error:', err);
        this.isConnecting = false;
        const statusEl = this.hudElement?.querySelector('#comlink-status');
        if (statusEl) statusEl.textContent = '[Connection Error • Offline]';
      };

      socket.onclose = (event) => {
        if (this.ws !== socket) return;
        console.log(`[RelicComlink] WebSocket closed: code=${event.code}, reason=${event.reason}`);
        this.stopComlink();
      };

    } catch (err) {
      console.error('[RelicComlink] Start error:', err);
      this.isConnecting = false;
      alert(err.name === 'NotAllowedError' ? 'Microphone permission blocked.' : `Com-Link connection failed: ${err.message}`);
      this.stopComlink();
    }
  }

  /*/ Stream Microphone Audio downsampled to 16kHz PCM to Gemini Live (from Covelly/script.js) /*/
  startMicrophoneStreaming() {
    if (!this.micStream || !this.audioCtx || !this.ws) return;

    try {
      const source = this.audioCtx.createMediaStreamSource(this.micStream);
      this.processor = this.audioCtx.createScriptProcessor(1024, 1, 1);

      this.processor.onaudioprocess = (e) => {
        /*/ Mute speaker output for mic to avoid feedback loop /*/
        const out = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < out.length; i++) out[i] = 0;

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isSetupComplete) return;

        const inputData = e.inputBuffer.getChannelData(0);

        /*/ Calculate microphone RMS volume /*/
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
          sumSquares += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sumSquares / inputData.length);

        /*/ Downsample hardware mic to 16kHz /*/
        const downsampled = downsampleTo16k(inputData, this.audioCtx.sampleRate);
        const pcm16 = float32ToInt16(downsampled);
        const base64Data = bufferToBase64(pcm16);

        /*/ Send Realtime Audio Chunk to Gemini in exact Live API schema /*/
        try {
          this.ws.send(JSON.stringify({
            realtimeInput: {
              audio: {
                mimeType: 'audio/pcm;rate=16000',
                data: base64Data
              }
            }
          }));
        } catch (err) {}
      };

      source.connect(this.processor);
      this.processor.connect(this.audioCtx.destination);
      this.micSource = source;
      console.log(`[RelicComlink] Microphone streaming active (${this.audioCtx.sampleRate}Hz -> 16kHz PCM).`);
    } catch (e) {
      console.error('[RelicComlink] Error starting mic streaming:', e);
    }
  }

  /*/ Handle Incoming Gateway Messages & Audio Chunks (from Covelly/script.js) /*/
  handleGatewayMessage(msg) {
    /*/ 1. Setup Complete: Initialize microphone and send introductory greeting prompt /*/
    if (msg.setupComplete) {
      console.log('[RelicComlink] Gemini Setup Complete! Initializing audio pipeline...');
      this.isSetupComplete = true;
      this.startMicrophoneStreaming();

      const relicName = this.currentRelicName || 'Spacecraft';
      const greetingTurn = {
        clientContent: {
          turns: [
            {
              role: 'user',
              parts: [{ text: `A museum visitor has just approached your exhibit and opened a direct voice com-link. Warmly introduce yourself in 1-2 spoken sentences and welcome them.` }]
            }
          ],
          turnComplete: true
        }
      };

      /*/ Capture the socket identity at time of setupComplete to prevent stale sends /*/
      const currentSocket = this.ws;
      const sendGreeting = () => {
        /*/ Guard: only send if this socket is still the active one and fully open /*/
        if (!currentSocket || currentSocket !== this.ws || currentSocket.readyState !== WebSocket.OPEN) return;
        try {
          currentSocket.send(JSON.stringify(greetingTurn));
        } catch (e) {
          console.error('[RelicComlink] Error sending greeting turn:', e);
        }
      };

      if (currentSocket && currentSocket.readyState === WebSocket.OPEN) {
        sendGreeting();
      } else if (currentSocket && currentSocket.readyState === WebSocket.CONNECTING) {
        currentSocket.addEventListener('open', sendGreeting, { once: true });
      }

      const statusEl = this.hudElement?.querySelector('#comlink-status');
      if (statusEl) statusEl.textContent = '[Spacecraft Connecting & Greeting...]';
      return;
    }

    /*/ 2. User Barge-in Interruption /*/
    if (msg.serverContent?.interrupted) {
      console.log('[RelicComlink] User interrupted speech.');
      this.interruptPlayback();
      const statusEl = this.hudElement?.querySelector('#comlink-status');
      if (statusEl) statusEl.textContent = '[Listening to you...]';
      return;
    }

    /*/ 3. Audio Stream Chunks from Gemini Live /*/
    if (msg.serverContent?.modelTurn?.parts) {
      for (const part of msg.serverContent.modelTurn.parts) {
        if (part.inlineData?.data) {
          this.queueAudioChunk(part.inlineData.data);
        }
        if (part.text) {
          console.log('[RelicComlink] Transcript chunk:', part.text);
        }
      }
    }

    /*/ 4. Turn Complete / Generation Complete /*/
    if (msg.serverContent?.turnComplete || msg.serverContent?.generationComplete) {
      if (this.activeSources.length === 0) {
        this.isSpeaking = false;
        const statusEl = this.hudElement?.querySelector('#comlink-status');
        if (statusEl) statusEl.textContent = '[Listening to you • Ask anything!]';
      }
    }
  }

  /*/ Queue and Schedule Incoming 24kHz PCM Audio Chunk (from Covelly/script.js) /*/
  queueAudioChunk(base64Data) {
    if (!this.audioCtx) return;

    try {
      const pcm16 = base64ToBuffer(base64Data);
      const float32 = int16ToFloat32(pcm16);

      /*/ Gemini Live outputs 24kHz PCM linear mono /*/
      const buffer = this.audioCtx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      this.scheduleBuffer(buffer);
    } catch (err) {
      console.error('[RelicComlink] Error decoding audio chunk:', err);
    }
  }

  /*/ Schedule Audio Buffer on AudioContext Timeline (from Covelly/script.js) /*/
  scheduleBuffer(buffer) {
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioCtx.destination); /*/ Direct audio output to speakers /*/

    if (!this.analyser) {
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
    }
    source.connect(this.analyser); /*/ Direct audio to live waveform analyser /*/

    const now = this.audioCtx.currentTime;
    if (this.nextPlayTime < now) {
      this.nextPlayTime = now + 0.06; /*/ 60ms smooth jitter buffer /*/
    }

    source.start(this.nextPlayTime);
    this.nextPlayTime += buffer.duration;

    this.activeSources.push(source);
    this.isSpeaking = true;

    const statusEl = this.hudElement?.querySelector('#comlink-status');
    if (statusEl) statusEl.textContent = '[Spacecraft Speaking...]';

    source.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== source);
      if (this.activeSources.length === 0) {
        this.isSpeaking = false;
        const sEl = this.hudElement?.querySelector('#comlink-status');
        if (sEl) sEl.textContent = '[Listening to you • Ask anything!]';
      }
    };
  }

  /*/ Interrupt Playback when User Speaks (from Covelly/script.js) /*/
  interruptPlayback() {
    for (const s of this.activeSources) {
      try { s.stop(); } catch (e) {}
    }
    this.activeSources = [];
    this.nextPlayTime = 0;
    this.isSpeaking = false;
  }

  /*/ Disconnect Com-Link and Clean Up Hardware (from Covelly/script.js) /*/
  stopComlink() {
    this.isActive = false;
    this.currentRelic = null;
    this.currentRelicName = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.isSetupComplete = false;
    this.isSpeaking = false;

    if (this.hudElement) {
      this.hudElement.style.display = 'none';
    }

    this.interruptPlayback();

    if (this.processor) {
      try { this.processor.disconnect(); } catch (e) {}
      this.processor = null;
    }

    if (this.micSource) {
      try { this.micSource.disconnect(); } catch (e) {}
      this.micSource = null;
    }

    if (this.micStream) {
      try { this.micStream.getTracks().forEach((t) => t.stop()); } catch (e) {}
      this.micStream = null;
    }

    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch (e) {}
      this.audioCtx = null;
    }

    if (this.ws) {
      const socket = this.ws;
      this.ws = null;
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      try {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close(1000, 'User ended call');
        }
      } catch (e) {}
    }
  }

  /*/ Frame Update for HUD Audio Waveform Animation /*/
  update(delta) {
    if (!this.isActive || !this.analyser || !this.analyserData) return;

    this.analyser.getByteFrequencyData(this.analyserData);

    const bars = this.hudElement?.querySelectorAll('.wave-bar');
    if (bars && bars.length > 0) {
      for (let i = 0; i < bars.length; i++) {
        const val = this.analyserData[i % this.analyserData.length] || 0;
        const h = Math.max(4, (val / 255) * 20);
        bars[i].style.height = `${h}px`;
      }
    }
  }
}
