(function () {
  'use strict';

  const container = document.getElementById('app-container');
  const statusText = document.getElementById('status-text');
  const feed = document.getElementById('feed');
  const clearBtn = document.getElementById('clear-log');
  const orbTrigger = document.getElementById('orb-trigger');
  
  const pairingOverlay = document.getElementById('pairing-overlay');
  const pairingStatus = document.getElementById('pairing-status');
  const retryBtn = document.getElementById('retry-pairing');

  let config = { endpoint: 'http://127.0.0.1:8000', pin: '' };
  let authToken = '';
  let ws = null;
  let voiceWs = null;
  let audioCtx = null;
  let micStream = null;
  let mediaStreamSource = null;
  let scriptProcessor = null;
  let isRecording = false;
  let stopTimer = null;

  // ── Setup & Auth ──

  async function loadConfig() {
    try {
      const r = await fetch('/app-config?app=jarvis', { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        if (data && data.options) {
          config.endpoint = data.options.endpoint || 'http://127.0.0.1:8000';
          config.pin = data.options.pin || '';
        }
      }
    } catch (e) {
      logSystemMessage('Failed to read open-quake configuration.');
    }
  }

  async function authenticate() {
    if (!config.pin) {
      showPairing('PIN not configured. Enter pairing PIN in editor.');
      return false;
    }

    pairingStatus.textContent = 'Authenticating...';

    const endpointsToTry = [config.endpoint];
    if (config.endpoint.startsWith('http://')) {
      endpointsToTry.push(config.endpoint.replace(/^http:/, 'https:'));
    }

    for (let i = 0; i < endpointsToTry.length; i++) {
      const ep = endpointsToTry[i];
      try {
        const r = await fetch(`${ep}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: config.pin.toUpperCase().trim() })
        });

        if (r.ok) {
          const res = await r.json();
          if (res && res.token) {
            authToken = res.token;
            config.endpoint = ep; // use the working endpoint
            pairingOverlay.classList.remove('open');
            return true;
          }
        }
        if (r.status === 401) {
          showPairing('Pairing failed. Invalid or expired PIN.');
          return false;
        }
      } catch (e) {
        console.warn(`Failed to connect to JARVIS endpoint ${ep}:`, e);
      }
    }

    showPairing('Cannot reach JARVIS server. Is it running?');
    return false;
  }

  function showPairing(message) {
    pairingStatus.textContent = message;
    pairingOverlay.classList.add('open');
  }

  // ── Log UI Helpers ──

  function logSystemMessage(text) {
    const m = document.createElement('div');
    m.className = 'msg sys';
    m.textContent = text;
    feed.appendChild(m);
    scrollFeed();
  }

  function logChatMessage(speaker, text) {
    const m = document.createElement('div');
    m.className = `msg ${speaker === 'user' ? 'user' : 'jarvis'}`;
    m.textContent = text;
    feed.appendChild(m);
    scrollFeed();
    
    // Limit to last 50 messages
    while (feed.children.length > 50) {
      feed.removeChild(feed.firstChild);
    }
  }

  function scrollFeed() {
    feed.scrollTop = feed.scrollHeight;
  }

  function updateStatus(state) {
    container.className = 'container';
    if (state === 'active' || state === 'listening' || state === 'speaking' || state === 'thinking') {
      container.classList.add(`state-${state}`);
      statusText.textContent = `Jarvis ${state}`;
    } else {
      container.classList.add('state-sleeping');
      statusText.textContent = 'Jarvis Sleeping';
    }
  }

  // ── WebSockets Connect ──

  function connectWebSocket() {
    if (ws) {
      try { ws.close(); } catch (e) {}
      ws = null;
    }

    const host = config.endpoint.startsWith('https:') ? config.endpoint.replace(/^https:/, 'wss:') : config.endpoint.replace(/^http:/, 'ws:');
    logSystemMessage('Connecting status feed...');
    
    try {
      ws = new WebSocket(`${host}/ws?token=${encodeURIComponent(authToken)}`);
    } catch (e) {
      logSystemMessage('Failed to create status WebSocket.');
      return;
    }

    ws.onopen = () => {
      logSystemMessage('Connected to JARVIS.');
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'status') {
          updateStatus(msg.state);
        } else if (msg.type === 'log') {
          logChatMessage(msg.speaker, msg.text);
        } else if (msg.type === 'sys') {
          logSystemMessage(msg.text);
        } else if (msg.type === 'file_received') {
          logSystemMessage(`File received: ${msg.name} (${Math.round(msg.size / 1024)} KB)`);
        }
      } catch (err) {}
    };

    ws.onclose = () => {
      logSystemMessage('Connection lost. Retrying in 5 seconds...');
      updateStatus('sleeping');
      setTimeout(startSetup, 5000);
    };

    ws.onerror = () => {
      logSystemMessage('WebSocket feed error.');
    };
  }

  // ── Voice Push-to-Talk (PTT) ──

  // Convert Float32 to resampled Int16 PCM
  function f32ToPcm16(f32, srcRate) {
    let s = f32;
    if (srcRate !== 16000) {
      const ratio = srcRate / 16000;
      const len = Math.round(f32.length / ratio);
      s = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        s[i] = f32[Math.min(Math.round(i * ratio), f32.length - 1)];
      }
    }
    const out = new Int16Array(s.length);
    for (let i = 0; i < s.length; i++) {
      out[i] = Math.max(-32768, Math.min(32767, Math.round(s[i] * 32768)));
    }
    return out.buffer;
  }

  async function getMic() {
    console.log('[JARVIS] getMic() requesting default mic...');
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('[JARVIS] getMic() default stream acquired:', stream.id);
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      console.log('[JARVIS] Detected audio input devices:');
      devs.forEach(d => {
        if (d.kind === 'audioinput') {
          console.log(`  - label: "${d.label}" | deviceId: "${d.deviceId}"`);
        }
      });
      const isWin = navigator.platform.indexOf('Win') !== -1 || navigator.userAgent.indexOf('Windows') !== -1;
      const pnp = isWin ? null : devs.find(d => d.kind === 'audioinput' && /pnp|usb pnp|usb audio/i.test(d.label));
      if (pnp) {
        console.log('[JARVIS] getMic() found PnP mic:', pnp.label);
        if (stream.getAudioTracks()[0].getSettings().deviceId !== pnp.deviceId) {
          stream.getTracks().forEach(t => t.stop());
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: pnp.deviceId } }
          });
          console.log('[JARVIS] getMic() switched to PnP stream:', stream.id);
        }
      } else {
        console.log('[JARVIS] getMic() using default/preferred mic.');
      }
    } catch (e) {
      console.warn('[JARVIS] Failed to select PnP mic, falling back to default:', e);
    }
    return stream;
  }

  let audioBuffer = [];

  window.pttStart = async function () {
    console.log('[JARVIS] pttStart() triggered');
    if (stopTimer) {
      clearTimeout(stopTimer);
      stopTimer = null;
      console.log('[JARVIS] pttStart() - cancelled pending stop, continuing stream.');
      return;
    }
    if (isRecording || voiceWs || !authToken) {
      console.warn('[JARVIS] pttStart() ignored. isRecording:', isRecording, 'voiceWs:', !!voiceWs, 'hasAuth:', !!authToken);
      return;
    }

    try {
      micStream = await getMic();
    } catch (e) {
      console.error('[JARVIS] Microphone access denied:', e);
      logSystemMessage('Microphone access denied or unavailable.');
      return;
    }

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    } catch (e) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    audioBuffer = [];
    const rate = audioCtx.sampleRate;
    console.log('[JARVIS] AudioContext active at rate:', rate, 'state:', audioCtx.state);
    mediaStreamSource = audioCtx.createMediaStreamSource(micStream);
    
    let processCount = 0;
    scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
    scriptProcessor.onaudioprocess = (e) => {
      processCount++;
      if (processCount <= 5 || processCount % 20 === 0) {
        console.log(`[JARVIS] onaudioprocess fired. Count: ${processCount}, State: ${audioCtx.state}`);
      }
      const input = e.inputBuffer.getChannelData(0);
      const chunk = new Float32Array(input);
      
      if (voiceWs && voiceWs.readyState === WebSocket.OPEN) {
        if (audioBuffer.length > 0) {
          audioBuffer.forEach(bufChunk => {
            voiceWs.send(f32ToPcm16(bufChunk, rate));
          });
          audioBuffer = [];
        }
        voiceWs.send(f32ToPcm16(chunk, rate));
      } else {
        audioBuffer.push(chunk);
      }
    };
    
    mediaStreamSource.connect(scriptProcessor);
    scriptProcessor.connect(audioCtx.destination);

    updateStatus('listening');

    const host = config.endpoint.startsWith('https:') ? config.endpoint.replace(/^https:/, 'wss:') : config.endpoint.replace(/^http:/, 'ws:');
    try {
      console.log('[JARVIS] Opening Voice WebSocket:', host);
      const w = new WebSocket(`${host}/ws/phone-audio?token=${encodeURIComponent(authToken)}`);
      w.binaryType = 'arraybuffer';
      voiceWs = w;

      w.onopen = () => {
        console.log('[JARVIS] Voice WebSocket connected');
        if (voiceWs !== w) {
          console.warn('[JARVIS] Voice WebSocket changed, closing socket.');
          try { w.close(); } catch (e) {}
          return;
        }
        isRecording = true;
        if (audioBuffer.length > 0) {
          console.log('[JARVIS] Flushing', audioBuffer.length, 'buffered chunks.');
          audioBuffer.forEach(bufChunk => {
            w.send(f32ToPcm16(bufChunk, rate));
          });
          audioBuffer = [];
        }
      };

      w.onclose = (event) => {
        console.log('[JARVIS] Voice WebSocket closed. Code:', event.code, 'Reason:', event.reason || 'None');
        if (voiceWs === w) stopVoice('onclose');
      };

      w.onerror = (err) => {
        console.warn('[JARVIS] Voice WebSocket error:', err);
        if (voiceWs === w) {
          logSystemMessage('Audio streaming connection error.');
          stopVoice('onerror');
        }
      };
    } catch (e) {
      console.error('[JARVIS] WebSocket setup failed:', e);
      logSystemMessage('Failed to open audio stream.');
      stopVoice('setup_failed');
      return;
    }
  };

  window.pttStop = function () {
    console.log('[JARVIS] window.pttStop() called');
    if (stopTimer) clearTimeout(stopTimer);
    stopTimer = setTimeout(() => {
      stopVoice('pttStop');
      stopTimer = null;
    }, 800);
  };

  function stopVoice(reason) {
    console.log('[JARVIS] stopVoice() called. Reason:', reason);
    if (stopTimer) {
      clearTimeout(stopTimer);
      stopTimer = null;
    }
    isRecording = false;
    updateStatus('sleeping');
    
    if (scriptProcessor) {
      try { scriptProcessor.disconnect(); } catch (e) {}
      scriptProcessor = null;
    }
    if (mediaStreamSource) {
      try { mediaStreamSource.disconnect(); } catch (e) {}
      mediaStreamSource = null;
    }
    if (audioCtx) {
      try { audioCtx.close(); } catch (e) {}
      audioCtx = null;
    }
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }
    if (voiceWs) {
      const w = voiceWs;
      voiceWs = null;
      if (w.readyState === WebSocket.CONNECTING || w.readyState === WebSocket.OPEN) {
        w.close();
      }
    }
  }

  // ── Initialize ──

  async function startSetup() {
    await loadConfig();
    const ok = await authenticate();
    if (ok) {
      connectWebSocket();
    }
  }

  // Clear log button
  clearBtn.addEventListener('click', () => {
    feed.innerHTML = '';
    logSystemMessage('Conversation log cleared.');
  });

  // Re-pair checking button
  retryBtn.addEventListener('click', startSetup);

  // Click on Orb triggers manual toggle PTT
  orbTrigger.addEventListener('click', () => {
    if (isRecording) {
      window.pttStop();
    } else {
      window.pttStart();
    }
  });

  // Toggle Desktop UI button
  const toggleDesktopUiBtn = document.getElementById('toggle-desktop-ui');
  if (toggleDesktopUiBtn) {
    toggleDesktopUiBtn.addEventListener('click', async () => {
      if (!authToken || !config.endpoint) return;
      try {
        const r = await fetch(`${config.endpoint}/api/show_ui`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (r.ok) {
          logSystemMessage('Sent desktop UI show command.');
        } else {
          logSystemMessage('Failed to show desktop UI. Server error.');
        }
      } catch (e) {
        logSystemMessage('Cannot connect to JARVIS desktop UI endpoint.');
      }
    });
  }

  // Start initialization
  startSetup();

})();
