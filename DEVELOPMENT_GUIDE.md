# GUIA DE DESENVOLVIMENTO — PROTOCOLO LÚCIDO

## Como Expandir o Jogo

---

## 🎯 ROADMAP DE DESENVOLVIMENTO

### Fase 1: Core Gameplay (Semana 1-2)
**Objetivo:** Gameplay básico funcional

- [x] Sistema de movimento FPS
- [x] Controles de câmera
- [x] Ambiente básico
- [x] Iluminação cinematográfica
- [x] Sistema de armas
- [x] HUD minimalista
- [ ] **Inimigos com IA** ← Próximo
- [ ] **Sistema de combate**
- [ ] **Áudio espacial**

### Fase 2: Horror Systems (Semana 3-4)
**Objetivo:** Atmosfera e tensão

- [ ] Horror Director
- [ ] Eventos psicológicos
- [ ] Sistema NRL completo
- [ ] Distorção de realidade
- [ ] Áudio 3D espacial
- [ ] Efeitos sonoros

### Fase 3: Content (Semana 5-8)
**Objetivo:** Conteúdo jogável

- [ ] 5+ salas completas
- [ ] 3+ tipos de inimigos
- [ ] 5+ armas
- [ ] 10+ documentos
- [ ] Puzzles ambientais
- [ ] Narrativa completa

### Fase 4: Polish (Semana 9-12)
**Objetivo:** Qualidade AAA

- [ ] Otimização de performance
- [ ] Efeitos de pós-processamento
- [ ] Animações suaves
- [ ] Balanceamento
- [ ] Testes de playtest
- [ ] Bug fixes

---

## 🧠 COMO IMPLEMENTAR INIMIGOS

### Passo 1: Criar Classe de Inimigo

```javascript
class Enemy {
  constructor(type, position) {
    this.type = type;
    this.position = position.clone();
    this.health = 100;
    this.state = 'idle';
    this.target = null;
    this.lastKnownPlayerPos = null;
    
    // AI parameters
    this.visionRange = 15;
    this.visionAngle = Math.PI / 3; // 60 degrees
    this.hearingRange = 20;
    this.speed = 3;
    this.damage = 20;
    
    // Create mesh
    this.mesh = this.createMesh();
    this.mesh.position.copy(position);
    gameState.scene.add(this.mesh);
  }
  
  createMesh() {
    // Criar modelo 3D do inimigo
    const group = new THREE.Group();
    
    // Corpo
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 1.2, 4, 8),
      new THREE.MeshStandardMaterial({
        color: 0x2a1a1a,
        roughness: 0.8,
        metalness: 0.2
      })
    );
    body.position.y = 0.9;
    body.castShadow = true;
    group.add(body);
    
    // Cabeça
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0x3a2a2a,
        roughness: 0.7,
        metalness: 0.3
      })
    );
    head.position.y = 1.7;
    head.castShadow = true;
    group.add(head);
    
    return group;
  }
  
  update(delta) {
    // Atualizar IA
    this.updateAI(delta);
    
    // Atualizar animação
    this.updateAnimation(delta);
  }
  
  updateAI(delta) {
    const playerPos = gameState.player.position;
    const distance = this.position.distanceTo(playerPos);
    
    switch (this.state) {
      case 'idle':
        this.stateIdle(delta);
        break;
      case 'patrol':
        this.statePatrol(delta);
        break;
      case 'investigate':
        this.stateInvestigate(delta);
        break;
      case 'chase':
        this.stateChase(delta);
        break;
      case 'attack':
        this.stateAttack(delta);
        break;
    }
  }
  
  stateIdle(delta) {
    // Verificar se vê o jogador
    if (this.canSeePlayer()) {
      this.state = 'chase';
      this.target = gameState.player;
    }
    
    // Verificar se ouve o jogador
    if (this.canHearPlayer()) {
      this.state = 'investigate';
      this.lastKnownPlayerPos = gameState.player.position.clone();
    }
  }
  
  statePatrol(delta) {
    // Patrulhar entre pontos
    // TODO: Implementar patrol points
  }
  
  stateInvestigate(delta) {
    // Ir até última posição conhecida
    if (this.lastKnownPlayerPos) {
      this.moveTowards(this.lastKnownPlayerPos, delta);
      
      const distance = this.position.distanceTo(this.lastKnownPlayerPos);
      if (distance < 1) {
        this.state = 'idle';
        this.lastKnownPlayerPos = null;
      }
    }
  }
  
  stateChase(delta) {
    const playerPos = gameState.player.position;
    const distance = this.position.distanceTo(playerPos);
    
    // Perdeu o jogador?
    if (!this.canSeePlayer() && distance > this.visionRange) {
      this.state = 'investigate';
      this.lastKnownPlayerPos = playerPos.clone();
      return;
    }
    
    // Atacar se perto
    if (distance < 2) {
      this.state = 'attack';
      return;
    }
    
    // Perseguir
    this.moveTowards(playerPos, delta);
  }
  
  stateAttack(delta) {
    const playerPos = gameState.player.position;
    const distance = this.position.distanceTo(playerPos);
    
    // Jogador fugiu?
    if (distance > 3) {
      this.state = 'chase';
      return;
    }
    
    // Atacar
    this.attackPlayer();
  }
  
  canSeePlayer() {
    const playerPos = gameState.player.position;
    const distance = this.position.distanceTo(playerPos);
    
    if (distance > this.visionRange) return false;
    
    // Verificar ângulo
    const direction = new THREE.Vector3()
      .subVectors(playerPos, this.position)
      .normalize();
    
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(this.mesh.rotation);
    
    const angle = direction.angleTo(forward);
    if (angle > this.visionAngle) return false;
    
    // Raycast para verificar obstáculos
    const raycaster = new THREE.Raycaster(
      this.position,
      direction,
      0,
      distance
    );
    
    const intersects = raycaster.intersectObjects(
      gameState.scene.children,
      true
    );
    
    // Se não há obstáculos ou o primeiro objeto é o jogador
    if (intersects.length === 0) return true;
    
    const firstHit = intersects[0].object;
    return firstHit === gameState.camera;
  }
  
  canHearPlayer() {
    const playerPos = gameState.player.position;
    const distance = this.position.distanceTo(playerPos);
    
    // Jogador está correndo?
    const isSprinting = gameState.input.sprint;
    const hearingRange = isSprinting ? this.hearingRange * 1.5 : this.hearingRange;
    
    return distance < hearingRange;
  }
  
  moveTowards(target, delta) {
    const direction = new THREE.Vector3()
      .subVectors(target, this.position)
      .normalize();
    
    direction.y = 0; // Manter no chão
    
    this.position.add(direction.multiplyScalar(this.speed * delta));
    this.mesh.position.copy(this.position);
    
    // Olhar na direção do movimento
    this.mesh.lookAt(target.x, this.position.y, target.z);
  }
  
  attackPlayer() {
    // TODO: Implementar ataque
    gameState.player.health -= this.damage;
    
    if (gameState.player.health <= 0) {
      window.showDeathScreen();
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    gameState.scene.remove(this.mesh);
    const index = gameState.environment.enemies.indexOf(this);
    if (index > -1) {
      gameState.environment.enemies.splice(index, 1);
    }
  }
  
  updateAnimation(delta) {
    // TODO: Implementar animações
    // - Idle
    // - Walk
    // - Run
    // - Attack
    // - Death
  }
}
```

### Passo 2: Adicionar ao Game Loop

```javascript
function updateEnemies(delta) {
  gameState.environment.enemies.forEach(enemy => {
    enemy.update(delta);
  });
}

// No animate():
function animate() {
  requestAnimationFrame(animate);
  
  const delta = gameState.clock.getDelta();
  
  if (gameState.player.isLocked) {
    updatePlayer(delta);
    updateCamera();
    updateEnemies(delta);  // ← Adicionar aqui
    checkInteractions();
    updateHorrorDirector(delta);
    updateUI();
  }
  
  gameState.renderer.render(gameState.scene, gameState.camera);
}
```

### Passo 3: Criar Tipos de Inimigos

```javascript
// HOST — Funcionário contaminado
function createHost(position) {
  const enemy = new Enemy('host', position);
  enemy.health = 80;
  enemy.speed = 2.5;
  enemy.damage = 15;
  enemy.visionRange = 12;
  return enemy;
}

// SUBJECT — Experimento humano
function createSubject(position) {
  const enemy = new Enemy('subject', position);
  enemy.health = 150;
  enemy.speed = 4;
  enemy.damage = 30;
  enemy.visionRange = 20;
  return enemy;
}

// MEMORY — Entidade psicológica
function createMemory(position) {
  const enemy = new Enemy('memory', position);
  enemy.health = Infinity; // Não pode ser morto
  enemy.speed = 3;
  enemy.damage = 0; // Não ataca diretamente
  enemy.visionRange = 25;
  return enemy;
}
```

---

## 🔊 COMO IMPLEMENTAR ÁUDIO

### Passo 1: Sistema de Áudio Espacial

```javascript
class AudioSystem {
  constructor() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.listener = this.context.listener;
    this.sounds = new Map();
  }
  
  updateListener(position, rotation) {
    // Atualizar posição do listener
    if (this.listener.positionX) {
      this.listener.positionX.value = position.x;
      this.listener.positionY.value = position.y;
      this.listener.positionZ.value = position.z;
    }
    
    // Atualizar orientação
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(rotation);
    
    const up = new THREE.Vector3(0, 1, 0);
    
    if (this.listener.forwardX) {
      this.listener.forwardX.value = forward.x;
      this.listener.forwardY.value = forward.y;
      this.listener.forwardZ.value = forward.z;
      
      this.listener.upX.value = up.x;
      this.listener.upY.value = up.y;
      this.listener.upZ.value = up.z;
    }
  }
  
  playSound(name, position, options = {}) {
    const sound = this.sounds.get(name);
    if (!sound) return;
    
    const source = this.context.createBufferSource();
    source.buffer = sound;
    
    // Panner para áudio 3D
    const panner = this.context.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 50;
    panner.rolloffFactor = 1;
    
    if (position) {
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z;
    }
    
    // Gain
    const gain = this.context.createGain();
    gain.gain.value = options.volume || 1.0;
    
    // Conectar
    source.connect(panner);
    panner.connect(gain);
    gain.connect(this.context.destination);
    
    source.start();
    
    return { source, panner, gain };
  }
  
  async loadSound(name, url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    this.sounds.set(name, audioBuffer);
  }
}
```

### Passo 2: Carregar Sons

```javascript
async function loadAudioAssets() {
  const audioSystem = new AudioSystem();
  
  // Carregar sons
  await audioSystem.loadSound('footstep_concrete', '/audio/footstep_concrete.mp3');
  await audioSystem.loadSound('footstep_metal', '/audio/footstep_metal.mp3');
  await audioSystem.loadSound('door_open', '/audio/door_open.mp3');
  await audioSystem.loadSound('door_close', '/audio/door_close.mp3');
  await audioSystem.loadSound('gunshot', '/audio/gunshot.mp3');
  await audioSystem.loadSound('reload', '/audio/reload.mp3');
  await audioSystem.loadSound('ambient_hum', '/audio/ambient_hum.mp3');
  await audioSystem.loadSound('whisper', '/audio/whisper.mp3');
  
  return audioSystem;
}
```

### Passo 3: Tocar Sons no Jogo

```javascript
// Passos do jogador
function playFootstep() {
  const position = gameState.player.position;
  audioSystem.playSound('footstep_concrete', position, {
    volume: 0.5
  });
}

// Tiro
function playGunshot() {
  const position = gameState.player.position;
  audioSystem.playSound('gunshot', position, {
    volume: 1.0
  });
}

// Som ambiente
function playAmbientLoop() {
  audioSystem.playSound('ambient_hum', null, {
    volume: 0.2,
    loop: true
  });
}
```

---

## 🎭 COMO IMPLEMENTAR EVENTOS PSICOLÓGICOS

### Passo 1: Horror Director

```javascript
class HorrorDirector {
  constructor() {
    this.tensionLevel = 0;
    this.lastEventTime = 0;
    this.eventCooldown = 30; // 30 segundos entre eventos
    this.events = [];
  }
  
  update(delta) {
    this.lastEventTime += delta;
    
    // Aumentar tensão gradualmente
    this.tensionLevel += delta * 0.5;
    
    // Verificar se pode触发 evento
    if (this.lastEventTime > this.eventCooldown) {
      if (Math.random() < 0.1) { // 10% de chance por frame
        this.triggerRandomEvent();
        this.lastEventTime = 0;
        this.tensionLevel = 0;
      }
    }
  }
  
  triggerRandomEvent() {
    const events = [
      'lights_flicker',
      'door_slam',
      'whisper',
      'shadow_appear',
      'object_move'
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
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
      case 'object_move':
        this.moveObject();
        break;
    }
  }
  
  flickerLights() {
    const lights = gameState.environment.lights;
    
    lights.forEach(light => {
      const originalIntensity = light.intensity;
      
      // Flicker pattern
      let flickerCount = 0;
      const flickerInterval = setInterval(() => {
        light.intensity = Math.random() > 0.5 ? originalIntensity : 0;
        flickerCount++;
        
        if (flickerCount > 10) {
          clearInterval(flickerInterval);
          light.intensity = originalIntensity;
        }
      }, 100);
    });
  }
  
  slamDoor() {
    // Tocar som de porta batendo
    audioSystem.playSound('door_slam', null, {
      volume: 0.8
    });
    
    // Tremer câmera
    gameState.camera.rotation.x += 0.05;
    setTimeout(() => {
      gameState.camera.rotation.x -= 0.05;
    }, 100);
  }
  
  playWhisper() {
    // Tocar sussurro em posição aleatória
    const position = new THREE.Vector3(
      gameState.player.position.x + (Math.random() - 0.5) * 10,
      1.7,
      gameState.player.position.z + (Math.random() - 0.5) * 10
    );
    
    audioSystem.playSound('whisper', position, {
      volume: 0.4
    });
  }
  
  spawnShadow() {
    // Criar sombra temporária
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5
    });
    
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 2),
      shadowMat
    );
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 8;
    
    shadow.position.set(
      gameState.player.position.x + Math.cos(angle) * distance,
      1,
      gameState.player.position.z + Math.sin(angle) * distance
    );
    
    shadow.lookAt(gameState.player.position);
    gameState.scene.add(shadow);
    
    // Remover após 2 segundos
    setTimeout(() => {
      gameState.scene.remove(shadow);
    }, 2000);
  }
  
  moveObject() {
    // Mover objeto aleatório
    const props = gameState.scene.children.filter(
      child => child.userData && child.userData.movable
    );
    
    if (props.length > 0) {
      const prop = props[Math.floor(Math.random() * props.length)];
      
      // Mover ligeiramente
      prop.position.x += (Math.random() - 0.5) * 0.5;
      prop.position.z += (Math.random() - 0.5) * 0.5;
    }
  }
}
```

---

## 🏢 COMO ADICIONAR NOVAS SALAS

### Template de Sala

```javascript
function createNewRoom(config) {
  const {
    position,
    size,
    type,
    props = [],
    lights = []
  } = config;
  
  // Criar estrutura
  createRoom(position.x, position.y, position.z, size.width, size.depth);
  
  // Adicionar props específicos
  props.forEach(prop => {
    switch (prop.type) {
      case 'bed':
        createMedicalBed(prop.x, prop.y, prop.z);
        break;
      case 'desk':
        createDesk(prop.x, prop.y, prop.z);
        break;
      case 'locker':
        createLocker(prop.x, prop.y, prop.z);
        break;
      // ... mais tipos
    }
  });
  
  // Adicionar luzes específicas
  lights.forEach(light => {
    const pointLight = new THREE.PointLight(
      light.color,
      light.intensity,
      light.distance
    );
    pointLight.position.set(light.x, light.y, light.z);
    gameState.scene.add(pointLight);
  });
}

// Exemplo de uso
createNewRoom({
  position: { x: 50, y: 0, z: 0 },
  size: { width: 20, depth: 20 },
  type: 'generator',
  props: [
    { type: 'generator', x: 0, y: 0, z: 0 },
    { type: 'pipes', x: -5, y: 2, z: 0 },
    { type: 'control_panel', x: 5, y: 1, z: -8 }
  ],
  lights: [
    { x: 0, y: 3.8, z: 0, color: 0xffaa00, intensity: 1.5, distance: 15 }
  ]
});
```

---

## 📝 CHECKLIST DE DESENVOLVIMENTO

### Antes de Commitar

- [ ] Código funciona sem erros
- [ ] Build passa sem warnings
- [ ] Performance está boa (60 FPS)
- [ ] Controles estão responsivos
- [ ] Iluminação está correta
- [ ] Não há objetos flutuando
- [ ] Colisões estão funcionando
- [ ] Documentação atualizada

### Antes de Release

- [ ] Todos os sistemas core funcionam
- [ ] Áudio está implementado
- [ ] Inimigos com IA funcional
- [ ] Eventos psicológicos ativos
- [ ] Narrativa completa
- [ ] Balanceamento testado
- [ ] Otimizações aplicadas
- [ ] Testado em múltiplos browsers

---

**Boa sorte no desenvolvimento!**

*"THE MEMORY IS LYING."*
