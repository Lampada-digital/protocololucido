export class AudioSystem {
  constructor(game) {
    this.game = game;
    
    // Audio context
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    this.dataArray = null;
    this.freqArray = null;
    
    // State
    this.isActive = false;
    this.isInitialized = false;
    this.currentFear = 0;
    this.lastAnalysis = null;
    
    // Thresholds
    this.SCREAM_VOLUME_THRESHOLD = 0.65;
    this.SCREAM_FREQ_THRESHOLD = 800;
    this.FEAR_DECAY_RATE = 0.02;
    this.SUSTAIN_FRAMES = 8;
    this.sustainCounter = 0;
    
    // Spatial audio
    this.listener = null;
    this.enemySounds = new Map();
    
    // Animation frame
    this.animationFrame = null;
    
    // Keyboard fallback
    this.panicKeyPressed = false;
    
    this.initKeyboardFallback();
  }
  
  initKeyboardFallback() {
    // F key as panic button when mic is not available
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyF' && !this.isActive) {
        if (!this.panicKeyPressed) {
          this.panicKeyPressed = true;
          this.onPanicButton();
        }
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (e.code === 'KeyF') {
        this.panicKeyPressed = false;
      }
    });
    
    // M key to toggle mic
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') {
        this.toggleMicrophone();
      }
    });
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
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Create analyser
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3;
      
      // Connect: mic → analyser (NOT to destination)
      source.connect(this.analyser);
      
      // Prepare buffers
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.freqArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      // Setup spatial audio listener
      this.listener = this.audioContext.listener;
      if (this.listener.positionX) {
        // Modern API
        this.listener.positionX.value = 0;
        this.listener.positionY.value = 1.6;
        this.listener.positionZ.value = 0;
      } else {
        // Legacy API
        this.listener.setPosition(0, 1.6, 0);
      }
      
      this.isInitialized = true;
      console.log('[AudioSystem] Microphone initialized successfully');
      
      return true;
    } catch (error) {
      console.warn('[AudioSystem] Microphone access denied:', error);
      console.log('[AudioSystem] Using keyboard fallback (F key for panic)');
      return false;
    }
  }
  
  start() {
    if (!this.isInitialized) {
      console.warn('[AudioSystem] Must call initialize() first');
      return;
    }
    
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
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.isInitialized = false;
    
    if (window.gameState) {
      window.gameState.isMicActive = false;
    }
    
    console.log('[AudioSystem] Fear detection stopped');
  }
  
  analyze = () => {
    if (!this.isActive || !this.analyser || !this.dataArray || !this.freqArray) return;
    
    // Get time-domain data (volume)
    this.analyser.getByteTimeDomainData(this.dataArray);
    
    // Get frequency data (pitch)
    this.analyser.getByteFrequencyData(this.freqArray);
    
    // Calculate RMS volume (0-1)
    const volume = this.calculateRMS(this.dataArray);
    
    // Find peak frequency
    const peakFreq = this.findPeakFrequency(this.freqArray);
    
    // Determine if this is a scream
    const isScream = volume > this.SCREAM_VOLUME_THRESHOLD && peakFreq > this.SCREAM_FREQ_THRESHOLD;
    
    // Calculate composite fear intensity
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
    
    // Update continuous fear level
    this.currentFear = Math.max(this.currentFear, fearIntensity * 0.5);
    
    const analysis = {
      volume,
      peakFrequency: peakFreq,
      isScream: isScream && this.sustainCounter >= this.SUSTAIN_FRAMES,
      fearIntensity: this.currentFear,
      timestamp: Date.now()
    };
    
    this.lastAnalysis = analysis;
    
    // Trigger scream event
    if (analysis.isScream) {
      this.onScreamDetected(analysis);
      this.sustainCounter = 0;
    }
    
    // Update game state
    if (window.gameState) {
      window.gameState.fearLevel = this.currentFear;
    }
    
    // Continue analysis loop
    this.animationFrame = requestAnimationFrame(this.analyze);
  }
  
  onScreamDetected(analysis) {
    console.log('[AudioSystem] SCREAM DETECTED!', analysis);
    
    // Notify game
    this.game.onScream(analysis.fearIntensity);
  }
  
  onPanicButton() {
    console.log('[AudioSystem] Panic button pressed (keyboard fallback)');
    
    // Simulate fear spike
    const fakeAnalysis = {
      volume: 0.7,
      peakFrequency: 1000,
      isScream: true,
      fearIntensity: 0.5,
      timestamp: Date.now()
    };
    
    this.game.onScream(fakeAnalysis.fearIntensity);
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
  
  getLastAnalysis() {
    return this.lastAnalysis;
  }
  
  // Spatial audio for enemies
  updateSpatialAudio(playerPosition, enemies) {
    if (!this.audioContext || !this.listener) return;
    
    // Update listener position
    if (this.listener.positionX) {
      this.listener.positionX.value = playerPosition.x;
      this.listener.positionY.value = playerPosition.y;
      this.listener.positionZ.value = playerPosition.z;
    } else {
      this.listener.setPosition(playerPosition.x, playerPosition.y, playerPosition.z);
    }
    
    // Update enemy sound positions
    enemies.forEach(enemy => {
      const sound = this.enemySounds.get(enemy);
      if (sound) {
        if (sound.positionX) {
          sound.positionX.value = enemy.position.x;
          sound.positionY.value = enemy.position.y;
          sound.positionZ.value = enemy.position.z;
        } else {
          sound.setPosition(enemy.position.x, enemy.position.y, enemy.position.z);
        }
      }
    });
  }
  
  createEnemySound(enemy) {
    if (!this.audioContext) return null;
    
    // Create a creepy sound source
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const panner = this.audioContext.createPanner();
    
    // Configure panner for 3D audio
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 20;
    panner.rolloffFactor = 1;
    
    if (panner.positionX) {
      panner.positionX.value = enemy.position.x;
      panner.positionY.value = enemy.position.y;
      panner.positionZ.value = enemy.position.z;
    } else {
      panner.setPosition(enemy.position.x, enemy.position.y, enemy.position.z);
    }
    
    // Creepy low-frequency sound
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 50 + Math.random() * 30;
    
    gainNode.gain.value = 0.1;
    
    // Connect: oscillator → gain → panner → destination
    oscillator.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(this.audioContext.destination);
    
    oscillator.start();
    
    this.enemySounds.set(enemy, panner);
    
    return { oscillator, gainNode, panner };
  }
  
  removeEnemySound(enemy) {
    const sound = this.enemySounds.get(enemy);
    if (sound) {
      sound.oscillator.stop();
      sound.oscillator.disconnect();
      sound.gainNode.disconnect();
      sound.panner.disconnect();
      this.enemySounds.delete(enemy);
    }
  }
  
  cleanup() {
    this.stop();
    
    // Remove all enemy sounds
    this.enemySounds.forEach((sound, enemy) => {
      this.removeEnemySound(enemy);
    });
  }
}
