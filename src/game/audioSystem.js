export class AudioSystem {
  constructor(game) {
    this.game = game;
    
    // Audio context
    this.audioContext = null;
    this.masterGain = null;
    
    // Microphone fear detection
    this.analyser = null;
    this.mediaStream = null;
    this.dataArray = null;
    this.freqArray = null;
    this.isActive = false;
    this.isInitialized = false;
    this.currentFear = 0;
    
    // Radio static
    this.radioStaticGain = null;
    this.radioStaticOsc = null;
    this.radioStaticIntensity = 0;
    
    // Ambient sounds
    this.ambientDrone = null;
    this.ambientDroneGain = null;
    
    // Heartbeat
    this.heartbeatGain = null;
    this.heartbeatInterval = null;
    this.heartbeatIntensity = 0;
    
    // Thresholds
    this.SCREAM_VOLUME_THRESHOLD = 0.65;
    this.SCREAM_FREQ_THRESHOLD = 800;
    this.FEAR_DECAY_RATE = 0.02;
    this.SUSTAIN_FRAMES = 8;
    this.sustainCounter = 0;
    
    // Animation frame
    this.animationFrame = null;
    
    this.init();
  }
  
  async init() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.audioContext.destination);
      
      // Start ambient drone
      this.startAmbientDrone();
      
      console.log('[AudioSystem] Initialized');
    } catch (error) {
      console.warn('[AudioSystem] Failed to initialize:', error);
    }
  }
  
  startAmbientDrone() {
    // Low frequency drone (barely audible)
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 40; // Very low frequency
    gain.gain.value = 0.05; // Barely audible
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    
    this.ambientDrone = osc;
    this.ambientDroneGain = gain;
    
    // Modulate drone slightly
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
  }
  
  async toggleMicrophone() {
    if (this.isActive) {
      this.stop();
    } else {
      await this.initialize();
      if (this.isInitialized) {
        this.start();
      }
    }
  }
  
  async initialize() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3;
      
      source.connect(this.analyser);
      
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.freqArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      this.isInitialized = true;
      console.log('[AudioSystem] Microphone initialized');
      
      return true;
    } catch (error) {
      console.warn('[AudioSystem] Microphone access denied:', error);
      return false;
    }
  }
  
  start() {
    if (!this.isInitialized) return;
    
    this.isActive = true;
    this.analyze();
    
    if (window.gameState) {
      window.gameState.isMicActive = true;
    }
    
    console.log('[AudioSystem] Fear detection active');
  }
  
  stop() {
    this.isActive = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    this.isInitialized = false;
    
    if (window.gameState) {
      window.gameState.isMicActive = false;
    }
  }
  
  analyze = () => {
    if (!this.isActive || !this.analyser) return;
    
    this.analyser.getByteTimeDomainData(this.dataArray);
    this.analyser.getByteFrequencyData(this.freqArray);
    
    const volume = this.calculateRMS(this.dataArray);
    const peakFreq = this.findPeakFrequency(this.freqArray);
    
    const isScream = volume > this.SCREAM_VOLUME_THRESHOLD && peakFreq > this.SCREAM_FREQ_THRESHOLD;
    
    let fearIntensity = 0;
    if (isScream) {
      fearIntensity = Math.min(1, volume * 1.2);
      this.sustainCounter++;
    } else if (volume > 0.3) {
      fearIntensity = volume * 0.3;
      this.sustainCounter = Math.max(0, this.sustainCounter - 1);
    } else {
      this.currentFear = Math.max(0, this.currentFear - this.FEAR_DECAY_RATE);
      this.sustainCounter = 0;
    }
    
    this.currentFear = Math.max(this.currentFear, fearIntensity * 0.5);
    
    if (isScream && this.sustainCounter >= this.SUSTAIN_FRAMES) {
      this.onScreamDetected(fearIntensity);
      this.sustainCounter = 0;
    }
    
    if (window.gameState) {
      window.gameState.fearLevel = this.currentFear;
    }
    
    this.animationFrame = requestAnimationFrame(this.analyze);
  }
  
  onScreamDetected(intensity) {
    console.log('[AudioSystem] SCREAM DETECTED!');
    this.game.onScream(intensity);
  }
  
  calculateRMS(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - 128) / 128;
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / data.length);
  }
  
  findPeakFrequency(freqData) {
    if (!this.audioContext) return 0;
    
    let maxVal = 0;
    let maxIndex = 0;
    
    for (let i = 0; i < freqData.length; i++) {
      if (freqData[i] > maxVal) {
        maxVal = freqData[i];
        maxIndex = i;
      }
    }
    
    const nyquist = this.audioContext.sampleRate / 2;
    return (maxIndex / freqData.length) * nyquist;
  }
  
  getFearLevel() {
    return this.currentFear;
  }
  
  // Radio static (increases near enemies)
  updateRadioStatic(intensity) {
    this.radioStaticIntensity = intensity;
    
    if (!this.radioStaticOsc) {
      // Create radio static noise
      const bufferSize = 2 * this.audioContext.sampleRate;
      const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      this.radioStaticOsc = this.audioContext.createBufferSource();
      this.radioStaticOsc.buffer = noiseBuffer;
      this.radioStaticOsc.loop = true;
      
      this.radioStaticGain = this.audioContext.createGain();
      this.radioStaticGain.gain.value = 0;
      
      // Filter to make it sound like radio
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 0.5;
      
      this.radioStaticOsc.connect(filter);
      filter.connect(this.radioStaticGain);
      this.radioStaticGain.connect(this.masterGain);
      
      this.radioStaticOsc.start();
    }
    
    // Adjust volume based on intensity
    this.radioStaticGain.gain.value = intensity * 0.3;
    
    // Increase pitch when very close (screeching)
    if (intensity > 0.7) {
      this.radioStaticOsc.playbackRate.value = 1.5;
    } else {
      this.radioStaticOsc.playbackRate.value = 1.0;
    }
  }
  
  // Heartbeat (when sanity is low)
  updateHeartbeat(intensity) {
    this.heartbeatIntensity = intensity;
    
    if (!this.heartbeatGain && intensity > 0) {
      this.heartbeatGain = this.audioContext.createGain();
      this.heartbeatGain.gain.value = 0;
      this.heartbeatGain.connect(this.masterGain);
      
      this.startHeartbeatLoop();
    }
    
    if (this.heartbeatGain) {
      this.heartbeatGain.gain.value = intensity * 0.4;
    }
  }
  
  startHeartbeatLoop() {
    const playBeat = () => {
      if (!this.heartbeatGain || this.heartbeatIntensity <= 0) return;
      
      // Create heartbeat sound
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 60;
      
      gain.gain.setValueAtTime(0, this.audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
      
      osc.connect(gain);
      gain.connect(this.heartbeatGain);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.2);
      
      // Second beat (lub-dub)
      setTimeout(() => {
        if (!this.heartbeatGain) return;
        
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        
        osc2.type = 'sine';
        osc2.frequency.value = 50;
        
        gain2.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain2.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        osc2.connect(gain2);
        gain2.connect(this.heartbeatGain);
        
        osc2.start();
        osc2.stop(this.audioContext.currentTime + 0.15);
      }, 200);
      
      // Schedule next beat based on intensity
      const interval = 1000 - (this.heartbeatIntensity * 400);
      setTimeout(playBeat, interval);
    };
    
    playBeat();
  }
  
  // Sound effects
  playFootstep(isSprinting) {
    if (!this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = isSprinting ? 150 : 100;
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.1);
  }
  
  playBreathing(heavy) {
    if (!this.audioContext) return;
    
    // White noise for breathing
    const bufferSize = this.audioContext.sampleRate * 0.5;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    const gain = this.audioContext.createGain();
    gain.gain.value = heavy ? 0.15 : 0.08;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    source.start();
  }
  
  playGunshot() {
    if (!this.audioContext) return;
    
    // Loud noise burst
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    const gain = this.audioContext.createGain();
    gain.gain.value = 0.5;
    
    source.connect(gain);
    gain.connect(this.masterGain);
    
    source.start();
  }
  
  playEnemyGroan() {
    if (!this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.value = 80 + Math.random() * 40;
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 1);
  }
  
  playEnemyAttack() {
    if (!this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'square';
    osc.frequency.value = 200;
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.3);
  }
  
  playEnemyHit() {
    if (!this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 300;
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.2);
  }
  
  playEnemySpawn() {
    if (!this.audioContext) return;
    
    // Eerie spawn sound
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 1);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 1);
  }
  
  playPain() {
    if (!this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.value = 400;
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.3);
  }
  
  playHeal() {
    if (!this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(500, this.audioContext.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.5);
  }
  
  playSiren() {
    if (!this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 0.5);
    osc.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + 1);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 1.5);
  }
  
  playJumpScare() {
    if (!this.audioContext) return;
    
    // Loud screech
    const bufferSize = this.audioContext.sampleRate * 0.5;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    const gain = this.audioContext.createGain();
    gain.gain.value = 0.8;
    
    source.connect(gain);
    gain.connect(this.masterGain);
    
    source.start();
  }
  
  playDeath() {
    if (!this.audioContext) return;
    
    // Low rumble
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 30;
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 3);
  }
  
  playPhoneRing() {
    if (!this.audioContext) return;
    
    // Phone ringing sound
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc1.frequency.value = 440;
    osc2.frequency.value = 480;
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    
    // Ring pattern
    for (let i = 0; i < 3; i++) {
      const time = this.audioContext.currentTime + i * 0.5;
      gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
      gain.gain.linearRampToValueAtTime(0, time + 0.4);
    }
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    
    osc1.start();
    osc2.start();
    osc1.stop(this.audioContext.currentTime + 1.5);
    osc2.stop(this.audioContext.currentTime + 1.5);
  }
  
  cleanup() {
    this.stop();
    
    if (this.ambientDrone) {
      this.ambientDrone.stop();
    }
    
    if (this.radioStaticOsc) {
      this.radioStaticOsc.stop();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
