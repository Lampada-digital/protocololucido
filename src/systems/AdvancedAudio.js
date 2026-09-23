import * as THREE from 'three';

/**
 * AdvancedAudio - Spatial audio system for horror atmosphere
 * Features:
 * - 3D spatial radio static (increases near enemies)
 * - Layered ambient sounds (drone, distant sounds)
 * - Player foley (footsteps by surface, breathing)
 * - Integration with sanity system
 * - Performance optimized
 */
export class AdvancedAudio {
  constructor(game) {
    this.game = game;
    
    // Audio context
    this.audioContext = null;
    this.masterGain = null;
    this.listener = null;
    
    // Radio static (proximity-based)
    this.radioStaticSource = null;
    this.radioStaticGain = null;
    this.radioStaticFilter = null;
    this.radioStaticIntensity = 0;
    
    // Ambient layers
    this.ambientDrone = null;
    this.ambientDroneGain = null;
    this.distantSounds = [];
    this.distantSoundTimer = 0;
    
    // Player foley
    this.footstepTimer = 0;
    this.breathingSource = null;
    this.breathingGain = null;
    this.heartbeatSource = null;
    this.heartbeatGain = null;
    
    // Surface types for footsteps
    this.surfaceTypes = {
      concrete: { pitch: 100, volume: 0.15 },
      metal: { pitch: 200, volume: 0.2 },
      wood: { pitch: 150, volume: 0.12 }
    };
    this.currentSurface = 'concrete';
    
    // State
    this.isInitialized = false;
    this.isAmbientPaused = false;
    
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
      
      // Setup listener (for 3D audio)
      if (this.audioContext.listener.positionX) {
        // Modern API
        this.listener = this.audioContext.listener;
      } else {
        // Legacy API
        this.listener = {
          positionX: { value: 0 },
          positionY: { value: 0 },
          positionZ: { value: 0 },
          setPosition: (x, y, z) => {
            this.listener.positionX.value = x;
            this.listener.positionY.value = y;
            this.listener.positionZ.value = z;
          }
        };
      }
      
      // Start ambient layers
      this.startAmbientDrone();
      this.startDistantSounds();
      
      this.isInitialized = true;
      console.log('[AdvancedAudio] Initialized');
    } catch (error) {
      console.warn('[AdvancedAudio] Failed to initialize:', error);
    }
  }
  
  // ─── RADIO STATIC (Proximity-based) ─────────────────────
  
  initRadioStatic() {
    if (this.radioStaticSource) return;
    
    // Create white noise buffer
    const bufferSize = 2 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    this.radioStaticSource = this.audioContext.createBufferSource();
    this.radioStaticSource.buffer = noiseBuffer;
    this.radioStaticSource.loop = true;
    
    // Bandpass filter (radio sound)
    this.radioStaticFilter = this.audioContext.createBiquadFilter();
    this.radioStaticFilter.type = 'bandpass';
    this.radioStaticFilter.frequency.value = 2000;
    this.radioStaticFilter.Q.value = 0.5;
    
    // Gain control
    this.radioStaticGain = this.audioContext.createGain();
    this.radioStaticGain.gain.value = 0;
    
    // Connect: source → filter → gain → master
    this.radioStaticSource.connect(this.radioStaticFilter);
    this.radioStaticFilter.connect(this.radioStaticGain);
    this.radioStaticGain.connect(this.masterGain);
    
    this.radioStaticSource.start();
  }
  
  updateRadioStatic(intensity) {
    if (!this.isInitialized) return;
    
    // Initialize on first use
    if (!this.radioStaticSource) {
      this.initRadioStatic();
    }
    
    this.radioStaticIntensity = intensity;
    
    // Adjust volume based on intensity (0-1)
    this.radioStaticGain.gain.value = intensity * 0.4;
    
    // Increase pitch when very close (screeching effect)
    if (intensity > 0.7) {
      this.radioStaticSource.playbackRate.value = 1.5;
      this.radioStaticFilter.frequency.value = 3000;
    } else {
      this.radioStaticSource.playbackRate.value = 1.0;
      this.radioStaticFilter.frequency.value = 2000;
    }
  }
  
  // ─── AMBIENT LAYERS ─────────────────────────────────────
  
  startAmbientDrone() {
    // Low-frequency drone (barely audible, creates dread)
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 40; // Very low frequency
    gain.gain.value = 0.04; // Barely audible
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    
    this.ambientDrone = osc;
    this.ambientDroneGain = gain;
    
    // Modulate drone slightly (uneasy feeling)
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
  }
  
  startDistantSounds() {
    // Schedule random distant sounds
    this.distantSoundTimer = 5 + Math.random() * 10;
  }
  
  playDistantSound(type) {
    if (!this.isInitialized || this.isAmbientPaused) return;
    
    const playerPos = this.game.player.getPosition();
    
    // Random position around player (but far away)
    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 10;
    const soundPos = new THREE.Vector3(
      playerPos.x + Math.cos(angle) * distance,
      1 + Math.random() * 2,
      playerPos.z + Math.sin(angle) * distance
    );
    
    switch (type) {
      case 'dripping':
        this.playDrippingWater(soundPos);
        break;
      case 'scraping':
        this.playMetallicScraping(soundPos);
        break;
      case 'laughter':
        this.playChildLaughter(soundPos);
        break;
    }
  }
  
  playDrippingWater(position) {
    // Create dripping sound
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const panner = this.createPanner(position);
    
    osc.type = 'sine';
    osc.frequency.value = 800 + Math.random() * 400;
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.1);
  }
  
  playMetallicScraping(position) {
    // Create metallic scraping sound
    const bufferSize = this.audioContext.sampleRate * 0.5;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    const gain = this.audioContext.createGain();
    gain.gain.value = 0.1;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    
    const panner = this.createPanner(position);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);
    
    source.start();
  }
  
  playChildLaughter(position) {
    // Eerie child laughter (high-pitched, distorted)
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const panner = this.createPanner(position);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
    osc.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.3);
  }
  
  createPanner(position) {
    const panner = this.audioContext.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 30;
    panner.rolloffFactor = 1;
    
    if (panner.positionX) {
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z;
    } else {
      panner.setPosition(position.x, position.y, position.z);
    }
    
    return panner;
  }
  
  // ─── PLAYER FOLEY ───────────────────────────────────────
  
  playFootstep(isSprinting) {
    if (!this.isInitialized) return;
    
    const surface = this.surfaceTypes[this.currentSurface];
    const playerPos = this.game.player.getPosition();
    
    // Create footstep sound
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const panner = this.createPanner(playerPos);
    
    osc.type = 'sine';
    osc.frequency.value = surface.pitch * (isSprinting ? 1.2 : 1.0);
    
    const volume = surface.volume * (isSprinting ? 1.5 : 1.0);
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.15);
  }
  
  playBreathing(heavy) {
    if (!this.isInitialized) return;
    
    const playerPos = this.game.player.getPosition();
    
    // Create breathing sound (filtered white noise)
    const bufferSize = this.audioContext.sampleRate * 0.8;
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
    
    const panner = this.createPanner(playerPos);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);
    
    source.start();
  }
  
  playHeartbeat(intensity) {
    if (!this.isInitialized) return;
    
    const playerPos = this.game.player.getPosition();
    
    // Create heartbeat sound (two thumps)
    const playBeat = (delay, volume) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const panner = this.createPanner(playerPos);
      
      osc.type = 'sine';
      osc.frequency.value = 60;
      
      gain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
      gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + delay + 0.2);
      
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain);
      
      osc.start(this.audioContext.currentTime + delay);
      osc.stop(this.audioContext.currentTime + delay + 0.2);
    };
    
    // Lub-dub pattern
    playBeat(0, intensity * 0.3);
    playBeat(0.2, intensity * 0.2);
  }
  
  // ─── UPDATE LOOP ────────────────────────────────────────
  
  update(delta) {
    if (!this.isInitialized) return;
    
    // Update listener position
    const playerPos = this.game.player.getPosition();
    if (this.listener.positionX) {
      this.listener.positionX.value = playerPos.x;
      this.listener.positionY.value = playerPos.y;
      this.listener.positionZ.value = playerPos.z;
    } else {
      this.listener.setPosition(playerPos.x, playerPos.y, playerPos.z);
    }
    
    // Update distant sounds
    this.distantSoundTimer -= delta;
    if (this.distantSoundTimer <= 0) {
      const soundTypes = ['dripping', 'scraping', 'laughter'];
      const type = soundTypes[Math.floor(Math.random() * soundTypes.length)];
      this.playDistantSound(type);
      
      this.distantSoundTimer = 8 + Math.random() * 15;
    }
    
    // Update breathing based on state
    if (this.game.player) {
      const isSprinting = this.game.player.isSprinting;
      const sanity = this.game.sanitySystem ? this.game.sanitySystem.getEffectiveSanity() : 100;
      
      // Heavy breathing when sprinting or low sanity
      if (isSprinting || sanity < 40) {
        this.footstepTimer += delta;
        if (this.footstepTimer > 2) {
          this.footstepTimer = 0;
          this.playBreathing(sanity < 30);
        }
      }
      
      // Heartbeat when sanity is very low
      if (sanity < 30) {
        const heartbeatIntensity = (30 - sanity) / 30;
        this.footstepTimer += delta;
        const heartbeatInterval = 1.2 - (heartbeatIntensity * 0.5);
        
        if (this.footstepTimer > heartbeatInterval) {
          this.footstepTimer = 0;
          this.playHeartbeat(heartbeatIntensity);
        }
      }
    }
  }
  
  // ─── UTILITY METHODS ────────────────────────────────────
  
  setSurface(surface) {
    if (this.surfaceTypes[surface]) {
      this.currentSurface = surface;
    }
  }
  
  pauseAmbient() {
    this.isAmbientPaused = true;
    if (this.ambientDroneGain) {
      this.ambientDroneGain.gain.value = 0;
    }
  }
  
  resumeAmbient() {
    this.isAmbientPaused = false;
    if (this.ambientDroneGain) {
      this.ambientDroneGain.gain.value = 0.04;
    }
  }
  
  cleanup() {
    if (this.radioStaticSource) {
      this.radioStaticSource.stop();
    }
    if (this.ambientDrone) {
      this.ambientDrone.stop();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
