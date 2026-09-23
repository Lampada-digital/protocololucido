# ARQUITETURA — PROTOCOLO LÚCIDO

## Arquitetura Proposta para Survival Horror AAA

---

## 🏗️ VISÃO GERAL DA ARQUITETURA

### Princípios de Design

1. **Modularidade** — Sistemas independentes e testáveis
2. **Event-Driven** — Comunicação via eventos
3. **Component-Based** — Entidades compostas por componentes
4. **Data-Driven** — Configuração via dados
5. **Separation of Concerns** — Cada módulo tem responsabilidade única
6. **Dependency Injection** — Injeção de dependências
7. **State Management** — Estado centralizado
8. **Performance First** — Otimizado para 60 FPS

---

## 📐 DIAGRAMA DE ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────┐
│                         GAME MANAGER                             │
│  (Game Loop, State Management, Event System, Resource Manager)  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  RENDERING    │    │   GAMEPLAY    │    │     AUDIO     │
│   SYSTEM      │    │    SYSTEM     │    │    SYSTEM     │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   SCENE       │    │   PLAYER      │    │   SPATIAL     │
│   GRAPH       │    │   CONTROLLER  │    │    AUDIO      │
├───────────────┤    ├───────────────┤    ├───────────────┤
│   CAMERA      │    │   WEAPONS     │    │   MUSIC       │
│   SYSTEM      │    │   SYSTEM      │    │   SYSTEM      │
├───────────────┤    ├───────────────┤    ├───────────────┤
│   LIGHTING    │    │   ENEMY AI    │    │   VOICE       │
│   SYSTEM      │    │   SYSTEM      │    │   SYSTEM      │
├───────────────┤    ├───────────────┤    └───────────────┘
│   POST-FX     │    │   HORROR      │
│   SYSTEM      │    │   DIRECTOR    │
└───────────────┘    └───────────────┘
                             │
                             ▼
                    ┌───────────────┐
                    │   NARRATIVE   │
                    │   SYSTEM      │
                    ├───────────────┤
                    │   DIALOGUE    │
                    │   SYSTEM      │
                    ├───────────────┤
                    │   CUTSCENE    │
                    │   SYSTEM      │
                    └───────────────┘
```

---

## 🎮 GAME MANAGER

### Responsabilidades
- Game loop principal
- Gerenciamento de estado global
- Sistema de eventos central
- Gerenciamento de recursos
- Coordenação entre sistemas

### Implementação

```javascript
// src/core/Game.js
export class Game {
  constructor() {
    this.state = new GameState();
    this.events = new EventManager();
    this.resources = new ResourceManager();
    this.input = new InputManager();
    
    // Sistemas
    this.scene = null;
    this.player = null;
    this.audio = null;
    this.narrative = null;
    this.horror = null;
    
    // Estado
    this.isRunning = false;
    this.isPaused = false;
    this.deltaTime = 0;
  }
  
  async init() {
    // Inicializar sistemas
    await this.initScene();
    await this.initPlayer();
    await this.initAudio();
    await this.initNarrative();
    await this.initHorror();
    
    // Iniciar game loop
    this.isRunning = true;
    this.loop();
  }
  
  loop() {
    if (!this.isRunning) return;
    
    requestAnimationFrame(() => this.loop());
    
    this.deltaTime = this.clock.getDelta();
    
    if (!this.isPaused) {
      this.update(this.deltaTime);
    }
    
    this.render();
  }
  
  update(delta) {
    this.events.emit('update:start', { delta });
    
    this.player.update(delta);
    this.audio.update(delta);
    this.narrative.update(delta);
    this.horror.update(delta);
    
    this.events.emit('update:end', { delta });
  }
  
  render() {
    this.scene.render();
  }
  
  pause() {
    this.isPaused = true;
    this.events.emit('game:pause');
  }
  
  resume() {
    this.isPaused = false;
    this.events.emit('game:resume');
  }
}
```

---

## 🎯 EVENT MANAGER

### Responsabilidades
- Sistema de eventos central
- Comunicação entre sistemas
- Desacoplamento de módulos

### Implementação

```javascript
// src/core/EventManager.js
export class EventManager {
  constructor() {
    this.listeners = new Map();
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
  
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => callback(data));
  }
  
  once(event, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

// Eventos do sistema
export const GameEvents = {
  // Player
  PLAYER_HEALTH_CHANGED: 'player:health:changed',
  PLAYER_AMMO_CHANGED: 'player:ammo:changed',
  PLAYER_WEAPON_CHANGED: 'player:weapon:changed',
  PLAYER_DIED: 'player:died',
  
  // Enemy
  ENEMY_SPAWNED: 'enemy:spawned',
  ENEMY_DIED: 'enemy:died',
  ENEMY_ALERTED: 'enemy:alerted',
  
  // Horror
  HORROR_EVENT_TRIGGERED: 'horror:event:triggered',
  NRL_CHANGED: 'nrl:changed',
  HALLUCINATION_STARTED: 'hallucination:started',
  
  // Narrative
  DOCUMENT_COLLECTED: 'document:collected',
  DIALOGUE_STARTED: 'dialogue:started',
  CUTSCENE_STARTED: 'cutscene:started',
  
  // Audio
  SOUND_PLAYED: 'sound:played',
  MUSIC_CHANGED: 'music:changed',
  
  // Game
  GAME_PAUSED: 'game:paused',
  GAME_RESUMED: 'game:resumed',
  LEVEL_LOADED: 'level:loaded',
  GAME_SAVED: 'game:saved'
};
```

---

## 🎮 PLAYER SYSTEM

### Arquitetura

```javascript
// src/player/Player.js
export class Player {
  constructor(game) {
    this.game = game;
    
    // Componentes
    this.transform = new TransformComponent();
    this.health = new HealthComponent(this);
    this.stamina = new StaminaComponent(this);
    this.inventory = new InventoryComponent(this);
    this.weapon = new WeaponComponent(this);
    this.camera = new PlayerCamera(this);
    
    // Estado
    this.isAlive = true;
    this.isSprinting = false;
    this.isCrouching = false;
  }
  
  update(delta) {
    this.transform.update(delta);
    this.health.update(delta);
    this.stamina.update(delta);
    this.weapon.update(delta);
    this.camera.update(delta);
  }
  
  takeDamage(amount) {
    this.health.takeDamage(amount);
    
    if (this.health.current <= 0) {
      this.die();
    }
  }
  
  die() {
    this.isAlive = false;
    this.game.events.emit(GameEvents.PLAYER_DIED, { player: this });
  }
}
```

### Componentes

#### HealthComponent
```javascript
// src/player/HealthComponent.js
export class HealthComponent {
  constructor(player) {
    this.player = player;
    this.current = 100;
    this.max = 100;
  }
  
  takeDamage(amount) {
    this.current = Math.max(0, this.current - amount);
    this.player.game.events.emit(GameEvents.PLAYER_HEALTH_CHANGED, {
      current: this.current,
      max: this.max
    });
  }
  
  heal(amount) {
    this.current = Math.min(this.max, this.current + amount);
    this.player.game.events.emit(GameEvents.PLAYER_HEALTH_CHANGED, {
      current: this.current,
      max: this.max
    });
  }
}
```

#### WeaponComponent
```javascript
// src/player/WeaponComponent.js
export class WeaponComponent {
  constructor(player) {
    this.player = player;
    this.currentWeapon = null;
    this.weapons = [];
  }
  
  equipWeapon(weapon) {
    this.currentWeapon = weapon;
    this.player.game.events.emit(GameEvents.PLAYER_WEAPON_CHANGED, {
      weapon: weapon
    });
  }
  
  shoot() {
    if (!this.currentWeapon) return;
    
    const result = this.currentWeapon.shoot();
    
    if (result.success) {
      this.player.game.events.emit(GameEvents.PLAYER_AMMO_CHANGED, {
        current: this.currentWeapon.currentAmmo,
        max: this.currentWeapon.maxAmmo
      });
    }
    
    return result;
  }
}
```

---

## 🔫 WEAPON SYSTEM

### Arquitetura

```javascript
// src/combat/WeaponSystem.js
export class WeaponSystem {
  constructor(game) {
    this.game = game;
    this.weapons = new Map();
    this.currentWeapon = null;
    
    // Registrar armas
    this.registerWeapon('pistol', new Pistol());
    this.registerWeapon('shotgun', new Shotgun());
    this.registerWeapon('smg', new SMG());
    this.registerWeapon('rifle', new Rifle());
  }
  
  registerWeapon(id, weapon) {
    this.weapons.set(id, weapon);
  }
  
  getWeapon(id) {
    return this.weapons.get(id);
  }
  
  equipWeapon(id) {
    const weapon = this.getWeapon(id);
    if (weapon) {
      this.currentWeapon = weapon;
      this.game.events.emit('weapon:equipped', { weapon });
    }
  }
}
```

### Classe Base de Arma

```javascript
// src/combat/Weapon.js
export class Weapon {
  constructor(config) {
    this.name = config.name;
    this.damage = config.damage;
    this.fireRate = config.fireRate;
    this.magazineSize = config.magazineSize;
    this.reserveAmmo = config.reserveAmmo;
    this.currentAmmo = config.magazineSize;
    this.recoil = config.recoil;
    this.spread = config.spread;
    this.range = config.range;
    
    this.isReloading = false;
    this.lastFireTime = 0;
  }
  
  shoot() {
    const now = Date.now();
    
    if (this.isReloading) {
      return { success: false, reason: 'reloading' };
    }
    
    if (now - this.lastFireTime < this.fireRate) {
      return { success: false, reason: 'fire_rate' };
    }
    
    if (this.currentAmmo <= 0) {
      return { success: false, reason: 'no_ammo' };
    }
    
    this.currentAmmo--;
    this.lastFireTime = now;
    
    return {
      success: true,
      damage: this.damage,
      recoil: this.recoil,
      spread: this.spread
    };
  }
  
  reload() {
    if (this.isReloading) return;
    if (this.currentAmmo === this.magazineSize) return;
    if (this.reserveAmmo <= 0) return;
    
    this.isReloading = true;
    
    setTimeout(() => {
      const needed = this.magazineSize - this.currentAmmo;
      const available = Math.min(needed, this.reserveAmmo);
      
      this.currentAmmo += available;
      this.reserveAmmo -= available;
      
      this.isReloading = false;
    }, 2000);
  }
}
```

---

## 🤖 ENEMY AI SYSTEM

### Arquitetura

```javascript
// src/ai/EnemyAI.js
export class EnemyAI {
  constructor(game) {
    this.game = game;
    this.enemies = [];
    this.perceptionSystem = new PerceptionSystem();
    this.pathfinding = new PathfindingSystem();
  }
  
  spawnEnemy(type, position) {
    const enemy = new EnemyBase(type, position, this.game);
    this.enemies.push(enemy);
    this.game.events.emit(GameEvents.ENEMY_SPAWNED, { enemy });
    return enemy;
  }
  
  update(delta) {
    this.enemies.forEach(enemy => {
      enemy.update(delta);
    });
  }
  
  removeEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
      this.game.events.emit(GameEvents.ENEMY_DIED, { enemy });
    }
  }
}
```

### Behavior Tree

```javascript
// src/ai/BehaviorTree.js
export class BehaviorNode {
  constructor(name) {
    this.name = name;
  }
  
  execute(entity) {
    throw new Error('Must implement execute()');
  }
}

export class Selector extends BehaviorNode {
  constructor(name, children) {
    super(name);
    this.children = children;
  }
  
  execute(entity) {
    for (const child of this.children) {
      const result = child.execute(entity);
      if (result === 'success') return 'success';
      if (result === 'running') return 'running';
    }
    return 'failure';
  }
}

export class Sequence extends BehaviorNode {
  constructor(name, children) {
    super(name);
    this.children = children;
  }
  
  execute(entity) {
    for (const child of this.children) {
      const result = child.execute(entity);
      if (result === 'failure') return 'failure';
      if (result === 'running') return 'running';
    }
    return 'success';
  }
}

export class Condition extends BehaviorNode {
  constructor(name, condition) {
    super(name);
    this.condition = condition;
  }
  
  execute(entity) {
    return this.condition(entity) ? 'success' : 'failure';
  }
}

export class Action extends BehaviorNode {
  constructor(name, action) {
    super(name);
    this.action = action;
  }
  
  execute(entity) {
    return this.action(entity);
  }
}
```

### Enemy Base

```javascript
// src/ai/EnemyBase.js
export class EnemyBase {
  constructor(type, position, game) {
    this.type = type;
    this.position = position.clone();
    this.game = game;
    
    // Stats
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 3;
    this.damage = 20;
    
    // AI State
    this.state = 'idle';
    this.target = null;
    this.lastKnownPlayerPos = null;
    
    // Perception
    this.visionRange = 15;
    this.visionAngle = Math.PI / 3;
    this.hearingRange = 20;
    
    // Behavior Tree
    this.behaviorTree = this.createBehaviorTree();
    
    // Mesh
    this.mesh = this.createMesh();
  }
  
  createBehaviorTree() {
    return new Selector('Root', [
      // Attack if in range
      new Sequence('Attack', [
        new Condition('InAttackRange', (e) => this.isPlayerInRange(2)),
        new Action('Attack', (e) => this.attack())
      ]),
      
      // Chase if player visible
      new Sequence('Chase', [
        new Condition('PlayerVisible', (e) => this.canSeePlayer()),
        new Action('Chase', (e) => this.chasePlayer())
      ]),
      
      // Investigate if heard sound
      new Sequence('Investigate', [
        new Condition('HeardSound', (e) => this.lastKnownPlayerPos !== null),
        new Action('Investigate', (e) => this.investigate())
      ]),
      
      // Patrol
      new Action('Patrol', (e) => this.patrol())
    ]);
  }
  
  update(delta) {
    this.behaviorTree.execute(this);
    this.updateMesh();
  }
  
  canSeePlayer() {
    const playerPos = this.game.player.transform.position;
    const distance = this.position.distanceTo(playerPos);
    
    if (distance > this.visionRange) return false;
    
    // Check angle
    const direction = new THREE.Vector3()
      .subVectors(playerPos, this.position)
      .normalize();
    
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.mesh.quaternion);
    
    const angle = direction.angleTo(forward);
    if (angle > this.visionAngle) return false;
    
    // Raycast for obstacles
    const raycaster = new THREE.Raycaster(
      this.position,
      direction,
      0,
      distance
    );
    
    const intersects = raycaster.intersectObjects(
      this.game.scene.getObjects()
    );
    
    return intersects.length === 0;
  }
  
  attack() {
    this.game.player.takeDamage(this.damage);
    return 'success';
  }
  
  chasePlayer() {
    const playerPos = this.game.player.transform.position;
    this.moveTo(playerPos);
    return 'running';
  }
  
  investigate() {
    if (this.lastKnownPlayerPos) {
      this.moveTo(this.lastKnownPlayerPos);
      
      const distance = this.position.distanceTo(this.lastKnownPlayerPos);
      if (distance < 1) {
        this.lastKnownPlayerPos = null;
        return 'success';
      }
    }
    return 'running';
  }
  
  patrol() {
    // Implement patrol logic
    return 'running';
  }
  
  moveTo(target) {
    const direction = new THREE.Vector3()
      .subVectors(target, this.position)
      .normalize();
    
    this.position.add(direction.multiplyScalar(this.speed * 0.016));
  }
}
```

---

## 👻 HORROR SYSTEM

### Horror Director

```javascript
// src/horror/HorrorDirector.js
export class HorrorDirector {
  constructor(game) {
    this.game = game;
    this.tensionLevel = 0;
    this.lastEventTime = 0;
    this.eventCooldown = 30;
    
    this.events = [
      'lights_flicker',
      'door_slam',
      'whisper',
      'shadow_appear',
      'object_move'
    ];
  }
  
  update(delta) {
    this.lastEventTime += delta;
    this.tensionLevel += delta * 0.5;
    
    // Check if should trigger event
    if (this.lastEventTime > this.eventCooldown) {
      if (Math.random() < 0.1) {
        this.triggerRandomEvent();
        this.lastEventTime = 0;
        this.tensionLevel = 0;
      }
    }
  }
  
  triggerRandomEvent() {
    const event = this.events[Math.floor(Math.random() * this.events.length)];
    this.triggerEvent(event);
  }
  
  triggerEvent(eventType) {
    switch (eventType) {
      case 'lights_flicker':
        this.flickerLights();
        break;
      case 'door_slam':
        this.slamDoor();
        break;
      case 'whisper':
        this.playWhisper();
        break;
      case 'shadow_appear':
        this.spawnShadow();
        break;
    }
    
    this.game.events.emit(GameEvents.HORROR_EVENT_TRIGGERED, {
      type: eventType
    });
  }
  
  flickerLights() {
    const lights = this.game.scene.getLights();
    
    lights.forEach(light => {
      const originalIntensity = light.intensity;
      
      let flickerCount = 0;
      const interval = setInterval(() => {
        light.intensity = Math.random() > 0.5 ? originalIntensity : 0;
        flickerCount++;
        
        if (flickerCount > 10) {
          clearInterval(interval);
          light.intensity = originalIntensity;
        }
      }, 100);
    });
  }
}
```

---

## 🔊 AUDIO SYSTEM

### AudioManager

```javascript
// src/audio/AudioManager.js
export class AudioManager {
  constructor(game) {
    this.game = game;
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.listener = this.context.listener;
    
    this.sounds = new Map();
    this.music = null;
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
  }
  
  async loadSound(name, url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    this.sounds.set(name, audioBuffer);
  }
  
  playSound(name, position, options = {}) {
    const buffer = this.sounds.get(name);
    if (!buffer) return;
    
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    
    // Spatial audio
    const panner = this.context.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 50;
    
    if (position) {
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z;
    }
    
    const gain = this.context.createGain();
    gain.gain.value = options.volume || 1.0;
    
    source.connect(panner);
    panner.connect(gain);
    gain.connect(this.masterGain);
    
    source.start();
    
    return { source, panner, gain };
  }
  
  updateListener(position, rotation) {
    if (this.listener.positionX) {
      this.listener.positionX.value = position.x;
      this.listener.positionY.value = position.y;
      this.listener.positionZ.value = position.z;
    }
  }
}
```

---

## 🎭 NARRATIVE SYSTEM

### NarrativeManager

```javascript
// src/narrative/NarrativeManager.js
export class NarrativeManager {
  constructor(game) {
    this.game = game;
    this.documents = new Map();
    this.dialogues = [];
    this.currentDialogue = null;
  }
  
  loadDocument(id, content) {
    this.documents.set(id, content);
  }
  
  collectDocument(id) {
    const document = this.documents.get(id);
    if (document) {
      this.game.events.emit(GameEvents.DOCUMENT_COLLECTED, {
        id,
        content: document
      });
      return true;
    }
    return false;
  }
  
  startDialogue(dialogueId) {
    const dialogue = this.dialogues.find(d => d.id === dialogueId);
    if (dialogue) {
      this.currentDialogue = dialogue;
      this.game.events.emit(GameEvents.DIALOGUE_STARTED, { dialogue });
    }
  }
}
```

---

## 🎨 RENDERING SYSTEM

### Scene Manager

```javascript
// src/rendering/Scene.js
export class SceneManager {
  constructor(game) {
    this.game = game;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer();
    
    this.lights = [];
    this.objects = [];
  }
  
  init(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  addLight(light) {
    this.lights.push(light);
    this.scene.add(light);
  }
  
  addObject(object) {
    this.objects.push(object);
    this.scene.add(object);
  }
}
```

---

## 💾 SAVE SYSTEM

### SaveManager

```javascript
// src/save/SaveManager.js
export class SaveManager {
  constructor(game) {
    this.game = game;
    this.saveKey = 'lucid_protocol_save';
  }
  
  save(slot = 0) {
    const data = {
      player: {
        position: this.game.player.transform.position.toArray(),
        health: this.game.player.health.current,
        inventory: this.game.player.inventory.getItems()
      },
      world: {
        nrl: this.game.nrl.current,
        documents: this.game.narrative.getCollectedDocuments()
      },
      timestamp: Date.now()
    };
    
    localStorage.setItem(`${this.saveKey}_${slot}`, JSON.stringify(data));
    this.game.events.emit(GameEvents.GAME_SAVED, { slot });
  }
  
  load(slot = 0) {
    const data = localStorage.getItem(`${this.saveKey}_${slot}`);
    if (!data) return false;
    
    const save = JSON.parse(data);
    
    // Restore player
    this.game.player.transform.position.fromArray(save.player.position);
    this.game.player.health.current = save.player.health;
    
    // Restore world
    this.game.nrl.current = save.world.nrl;
    
    return true;
  }
}
```

---

## 📊 FLUXO DE DADOS

### Exemplo: Jogador Atira

```
1. Input: Click do mouse
   ↓
2. InputManager: Detecta input
   ↓
3. EventManager: Emite 'input:shoot'
   ↓
4. WeaponComponent: Recebe evento
   ↓
5. Weapon.shoot(): Processa tiro
   ↓
6. EventManager: Emite 'weapon:fired'
   ↓
7. AudioManager: Toca som do tiro
   ↓
8. EnemyAI: Inimigos ouvem o tiro
   ↓
9. HorrorDirector: Aumenta tensão
   ↓
10. HUD: Atualiza munição
```

---

## 🎯 PADRÕES DE DESIGN UTILIZADOS

### 1. Singleton
- GameManager
- EventManager
- AudioManager

### 2. Observer
- EventManager (publish/subscribe)
- Componentes (notificações de estado)

### 3. Component
- Player (composto por HealthComponent, WeaponComponent, etc)
- Enemy (composto por AIComponent, HealthComponent, etc)

### 4. Factory
- WeaponFactory
- EnemyFactory
- PropFactory

### 5. State
- EnemyAI (máquina de estados)
- PlayerState (máquina de estados)

### 6. Strategy
- Different weapon behaviors
- Different enemy behaviors

### 7. Command
- Input commands (shoot, reload, interact)

---

## 📁 ESTRUTURA FINAL DE ARQUIVOS

```
src/
├── core/
│   ├── Game.js
│   ├── EventManager.js
│   ├── InputManager.js
│   ├── ResourceManager.js
│   └── StateManager.js
│
├── player/
│   ├── Player.js
│   ├── PlayerCamera.js
│   ├── components/
│   │   ├── HealthComponent.js
│   │   ├── StaminaComponent.js
│   │   ├── InventoryComponent.js
│   │   └── WeaponComponent.js
│   └── animations/
│       └── PlayerAnimations.js
│
├── combat/
│   ├── WeaponSystem.js
│   ├── Weapon.js
│   ├── weapons/
│   │   ├── Pistol.js
│   │   ├── Shotgun.js
│   │   ├── SMG.js
│   │   └── Rifle.js
│   ├── AmmoSystem.js
│   └── DamageSystem.js
│
├── ai/
│   ├── EnemyAI.js
│   ├── EnemyBase.js
│   ├── BehaviorTree.js
│   ├── PerceptionSystem.js
│   ├── Pathfinding.js
│   └── enemies/
│       ├── Host.js
│       ├── Subject.js
│       └── Memory.js
│
├── neural/
│   ├── NRLSystem.js
│   ├── PerceptionManager.js
│   ├── HallucinationSystem.js
│   └── RealityDistortion.js
│
├── horror/
│   ├── HorrorDirector.js
│   ├── PsychologicalEvents.js
│   └── AtmosphereManager.js
│
├── environment/
│   ├── EnvironmentBuilder.js
│   ├── LevelLoader.js
│   ├── PropSystem.js
│   ├── DoorSystem.js
│   └── LightingSystem.js
│
├── audio/
│   ├── AudioManager.js
│   ├── SpatialAudio.js
│   ├── MusicSystem.js
│   └── SoundLibrary.js
│
├── narrative/
│   ├── NarrativeManager.js
│   ├── DialogueSystem.js
│   ├── DocumentSystem.js
│   └── CutsceneSystem.js
│
├── ui/
│   ├── HUD.js
│   ├── MainMenu.js
│   ├── InventoryUI.js
│   ├── JournalUI.js
│   └── SettingsMenu.js
│
├── save/
│   ├── SaveManager.js
│   └── CheckpointManager.js
│
├── utils/
│   ├── MathUtils.js
│   ├── ObjectPool.js
│   └── DebugTools.js
│
└── data/
    ├── weapons.json
    ├── enemies.json
    └── config.json
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Implementar Game Manager** — Base do sistema
2. **Implementar Event Manager** — Comunicação entre sistemas
3. **Implementar Player Controller** — Controles do jogador
4. **Implementar Weapon System** — Sistema de armas
5. **Implementar Enemy AI** — Inteligência artificial
6. **Implementar Audio System** — Áudio espacial
7. **Implementar Horror System** — Terror psicológico
8. **Implementar Narrative System** — Narrativa
9. **Implementar Save System** — Persistência
10. **Polish e Otimização** — Qualidade final

---

**Arquitetura Proposta**  
*PROTOCOLO LÚCIDO — Survival Horror AAA*  
*Lead Technical Director*  
*2024*
