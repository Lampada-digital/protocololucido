import * as THREE from 'three';

/**
 * NarrativeEngine - Manages internal monologue, typewriter effects, and audio logs
 * Features:
 * - Location-based monologue triggers
 * - Typewriter text effect with glitch variations
 * - Audio log collection system
 * - Unreliable narrator (text corruption when sanity < 40%)
 * - Journal UI integration
 */
export class NarrativeEngine {
  constructor(game) {
    this.game = game;
    
    // Monologue state
    this.currentMonologue = null;
    this.monologueQueue = [];
    this.isTyping = false;
    this.typewriterSpeed = 50; // ms per character
    this.typewriterTimer = 0;
    this.displayedText = '';
    this.fullText = '';
    
    // Audio logs
    this.collectedLogs = [];
    this.currentLog = null;
    this.isPlayingLog = false;
    
    // Trigger zones (location-based monologue)
    this.triggerZones = new Map();
    
    // Narrative triggers (event-based)
    this.eventTriggers = new Map();
    
    // Unreliable narrator state
    this.glitchIntensity = 0;
    this.glitchTimer = 0;
    
    // UI elements
    this.monologueOverlay = null;
    this.journalUI = null;
    
    this.initNarrativeData();
    this.initUI();
  }
  
  initNarrativeData() {
    // Define monologue triggers by location
    this.triggerZones.set('entrance', {
      position: new THREE.Vector3(0, 0, 0),
      radius: 5,
      triggered: false,
      lines: [
        "Eu prometi que este lugar a salvaria...",
        "Mas o que eu encontrei aqui... não é humano.",
        "Preciso encontrá-la. Antes que seja tarde demais."
      ]
    });
    
    this.triggerZones.set('hospital_ward', {
      position: new THREE.Vector3(-10, 0, -10),
      radius: 8,
      triggered: false,
      lines: [
        "Este era o quarto dela. Eu reconheço...",
        "As paredes... estão respirando?",
        "Não. Não pode ser. Estou imaginando coisas."
      ]
    });
    
    this.triggerZones.set('operating_room', {
      position: new THREE.Vector3(10, 0, 10),
      radius: 6,
      triggered: false,
      lines: [
        "O que eles fizeram aqui?",
        "Há sangue... em todos os lugares.",
        "Eu não deveria ter vindo. Mas agora é tarde."
      ]
    });
    
    // Define audio logs
    this.audioLogs = [
      {
        id: 'log_001',
        title: 'Gravação do Dr. Mendes - Dia 1',
        text: 'Dia 1: O paciente apresenta sinais de dissociação severa. A realidade parece... fragmentada para ele. Estamos tentando entender se é sintoma ou se ele está percebendo algo que nós não vemos.',
        position: new THREE.Vector3(-5, 0.5, -5),
        collected: false
      },
      {
        id: 'log_002',
        title: 'Gravação do Dr. Mendes - Dia 15',
        text: 'Dia 15: Os outros pacientes começaram a relatar os mesmos sonhos. Sombras nos cantos. Vozes que não existem. É como se... algo estivesse entrando na mente deles. Ou saindo.',
        position: new THREE.Vector3(10, 0.5, -10),
        collected: false
      },
      {
        id: 'log_003',
        title: 'Gravação do Dr. Mendes - Dia 30',
        text: 'Dia 30: Eu vi. Eu vi o que eles veem. Não é loucura. É... outra camada da realidade. E está nos observando. Deus nos ajude.',
        position: new THREE.Vector3(-15, 0.5, 15),
        collected: false
      }
    ];
    
    // Event-based triggers
    this.eventTriggers.set('first_enemy_sighted', {
      triggered: false,
      lines: [
        "O que é isso?!",
        "Não... não pode ser real.",
        "Fique longe de mim!"
      ]
    });
    
    this.eventTriggers.set('low_sanity_25', {
      triggered: false,
      lines: [
        "As paredes... estão me observando.",
        "Eu ouço vozes. Elas chamam meu nome.",
        "Não estou louco. Não estou. NÃO ESTOU!"
      ]
    });
  }
  
  initUI() {
    // Create monologue overlay
    this.monologueOverlay = document.createElement('div');
    this.monologueOverlay.id = 'monologue-overlay';
    this.monologueOverlay.style.cssText = `
      position: absolute;
      bottom: 15%;
      left: 50%;
      transform: translateX(-50%);
      max-width: 600px;
      padding: 1.5rem 2rem;
      background: rgba(0, 0, 0, 0.85);
      border: 1px solid rgba(139, 0, 0, 0.5);
      border-radius: 4px;
      font-family: 'Special Elite', cursive;
      font-size: 1.2rem;
      color: #ccc;
      text-align: center;
      opacity: 0;
      transition: opacity 0.5s;
      pointer-events: none;
      z-index: 100;
      text-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
    `;
    document.getElementById('react-root').appendChild(this.monologueOverlay);
  }
  
  update(delta) {
    // Check location-based triggers
    this.checkLocationTriggers();
    
    // Update typewriter effect
    if (this.isTyping) {
      this.typewriterTimer += delta * 1000;
      
      if (this.typewriterTimer >= this.typewriterSpeed) {
        this.typewriterTimer = 0;
        
        if (this.displayedText.length < this.fullText.length) {
          this.displayedText += this.fullText[this.displayedText.length];
          this.monologueOverlay.textContent = this.displayedText;
        } else {
          // Finished typing
          this.isTyping = false;
          
          // Wait before hiding
          setTimeout(() => {
            this.hideMonologue();
          }, 3000);
        }
      }
    }
    
    // Update unreliable narrator (glitch effect)
    this.updateGlitchEffect(delta);
  }
  
  checkLocationTriggers() {
    const playerPos = this.game.player.getPosition();
    
    this.triggerZones.forEach((zone, key) => {
      if (zone.triggered) return;
      
      const distance = playerPos.distanceTo(zone.position);
      
      if (distance < zone.radius) {
        zone.triggered = true;
        this.triggerMonologue(zone.lines);
      }
    });
  }
  
  triggerMonologue(lines) {
    // Add all lines to queue
    lines.forEach(line => {
      this.monologueQueue.push(line);
    });
    
    // Start showing first line
    this.showNextMonologueLine();
  }
  
  showNextMonologueLine() {
    if (this.monologueQueue.length === 0) {
      this.currentMonologue = null;
      return;
    }
    
    this.currentMonologue = this.monologueQueue.shift();
    this.startTypewriter(this.currentMonologue);
  }
  
  startTypewriter(text) {
    this.fullText = text;
    this.displayedText = '';
    this.isTyping = true;
    this.typewriterTimer = 0;
    
    // Apply glitch if sanity is low
    if (this.game.sanitySystem) {
      const sanity = this.game.sanitySystem.getEffectiveSanity();
      if (sanity < 40) {
        this.fullText = this.glitchText(text, sanity);
      }
    }
    
    this.monologueOverlay.style.opacity = '1';
    this.monologueOverlay.textContent = '';
  }
  
  hideMonologue() {
    this.monologueOverlay.style.opacity = '0';
    
    setTimeout(() => {
      this.showNextMonologueLine();
    }, 500);
  }
  
  glitchText(text, sanity) {
    // Unreliable narrator: corrupt text based on sanity level
    const corruptionLevel = (40 - sanity) / 40; // 0 to 1
    
    let glitched = text;
    
    // Random character replacement
    const glitchChars = ['█', '▓', '▒', '░', '̷', '̸', '̶'];
    const words = glitched.split(' ');
    
    words.forEach((word, i) => {
      if (Math.random() < corruptionLevel * 0.3) {
        // Replace random characters in word
        let glitchedWord = '';
        for (let j = 0; j < word.length; j++) {
          if (Math.random() < corruptionLevel * 0.2) {
            glitchedWord += glitchChars[Math.floor(Math.random() * glitchChars.length)];
          } else {
            glitchedWord += word[j];
          }
        }
        words[i] = glitchedWord;
      }
    });
    
    glitched = words.join(' ');
    
    // Add contradictory statements at very low sanity
    if (sanity < 20 && Math.random() < 0.3) {
      const contradictions = [
        ' [MENTIRA]',
        ' [NÃO É REAL]',
        ' [EU ESTOU MENTINDO]',
        ' [OU ESTOU?]'
      ];
      glitched += contradictions[Math.floor(Math.random() * contradictions.length)];
    }
    
    // Repeat words at very low sanity
    if (sanity < 15 && Math.random() < 0.2) {
      const words = glitched.split(' ');
      const repeatIdx = Math.floor(Math.random() * words.length);
      words[repeatIdx] = words[repeatIdx] + ' ' + words[repeatIdx];
      glitched = words.join(' ');
    }
    
    return glitched;
  }
  
  updateGlitchEffect(delta) {
    if (!this.game.sanitySystem) return;
    
    const sanity = this.game.sanitySystem.getEffectiveSanity();
    
    if (sanity < 40) {
      this.glitchTimer += delta;
      
      // Random visual glitch on monologue text
      if (this.glitchTimer > 2 && Math.random() < 0.1) {
        this.glitchTimer = 0;
        
        if (this.monologueOverlay.style.opacity === '1') {
          // Brief glitch effect
          this.monologueOverlay.style.transform = 'translateX(-50%) skewX(5deg)';
          this.monologueOverlay.style.color = '#ff0040';
          
          setTimeout(() => {
            this.monologueOverlay.style.transform = 'translateX(-50%)';
            this.monologueOverlay.style.color = '#ccc';
          }, 100);
        }
      }
    }
  }
  
  // Audio log system
  collectAudioLog(logId) {
    const log = this.audioLogs.find(l => l.id === logId);
    if (!log || log.collected) return false;
    
    log.collected = true;
    this.collectedLogs.push(log);
    
    // Show notification
    this.showLogNotification(log.title);
    
    // Trigger monologue about finding the log
    if (this.collectedLogs.length === 1) {
      this.triggerMonologue([
        "Uma gravação... do Dr. Mendes?",
        "Preciso ouvir isso. Pode ter respostas."
      ]);
    }
    
    return true;
  }
  
  showLogNotification(title) {
    const notification = document.createElement('div');
    notification.className = 'pickup-notification';
    notification.innerHTML = `
      <div style="font-size: 0.7rem; color: #888; margin-bottom: 0.3rem;">AUDIO LOG COLLECTED</div>
      <div style="font-family: 'Special Elite', cursive; color: #fff;">${title}</div>
    `;
    document.getElementById('react-root').appendChild(notification);
    
    setTimeout(() => notification.remove(), 4000);
  }
  
  playAudioLog(logId) {
    const log = this.collectedLogs.find(l => l.id === logId);
    if (!log) return;
    
    this.currentLog = log;
    this.isPlayingLog = true;
    
    // Show log text with typewriter effect
    this.startTypewriter(log.text);
    
    // Pause ambient music (if implemented)
    if (this.game.audioSystem) {
      this.game.audioSystem.pauseAmbient();
    }
    
    // Auto-close after reading
    setTimeout(() => {
      this.isPlayingLog = false;
      if (this.game.audioSystem) {
        this.game.audioSystem.resumeAmbient();
      }
    }, log.text.length * this.typewriterSpeed + 3000);
  }
  
  // Event triggers
  triggerEvent(eventName) {
    const trigger = this.eventTriggers.get(eventName);
    if (!trigger || trigger.triggered) return;
    
    trigger.triggered = true;
    this.triggerMonologue(trigger.lines);
  }
  
  // Reset for new game
  reset() {
    this.triggerZones.forEach(zone => {
      zone.triggered = false;
    });
    
    this.eventTriggers.forEach(trigger => {
      trigger.triggered = false;
    });
    
    this.audioLogs.forEach(log => {
      log.collected = false;
    });
    
    this.collectedLogs = [];
    this.monologueQueue = [];
    this.currentMonologue = null;
  }
  
  // Get journal data for UI
  getJournalData() {
    return {
      collectedLogs: this.collectedLogs,
      totalLogs: this.audioLogs.length
    };
  }
}
