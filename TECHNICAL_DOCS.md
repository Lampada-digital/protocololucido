# PROTOCOLO LÚCIDO — DOCUMENTAÇÃO TÉCNICA

## Arquitetura do Jogo

---

## 🏗️ ARQUITETURA DE SISTEMAS

### Core Systems

```
┌─────────────────────────────────────────────────────────┐
│                    GAME STATE (Global)                   │
├─────────────────────────────────────────────────────────┤
│  • Player State (posição, saúde, stamina, NRL)          │
│  • Input State (teclas, mouse)                          │
│  • Environment State (luzes, inimigos, objetos)         │
│  • Weapons State (munição, tipo)                        │
│  • UI State (menus, HUD)                                │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   RENDER     │  │   INPUT      │  │   GAMEPLAY   │
│   SYSTEM     │  │   SYSTEM     │  │   SYSTEM     │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ Three.js     │  │ Keyboard     │  │ Movement     │
│ Scene Graph  │  │ Mouse        │  │ Combat       │
│ Lighting     │  │ Pointer Lock │  │ Interaction  │
│ Shadows      │  │              │  │ Inventory    │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 📁 ESTRUTURA DE CÓDIGO

### main.jsx — Arquivo Principal

```javascript
// Seções do arquivo:
1. GAME STATE      → Estado global do jogo
2. INITIALIZATION  → Setup do Three.js
3. ENVIRONMENT     → Construção do mundo
4. LIGHTING        → Sistema de iluminação
5. CONTROLS        → Input do jogador
6. AUDIO           → Sistema de áudio
7. GAME LOOP       → Loop principal
8. PLAYER UPDATE   → Lógica do jogador
9. INTERACTIONS    → Sistema de interação
10. WEAPONS        → Sistema de armas
11. HORROR         → Diretor de horror
12. UI             → Atualização da interface
13. MENU           → Sistema de menus
```

---

## 🎮 SISTEMAS IMPLEMENTADOS

### 1. Player System

**Propriedades:**
```javascript
player: {
  position: Vector3,      // Posição no mundo
  velocity: Vector3,      // Velocidade (gravidade)
  rotation: Euler,        // Rotação da câmera
  health: number,         // 0-100
  stamina: number,        // 0-100
  nrl: number,            // 0-100 (Neural Reconstruction Level)
  isLocked: boolean,      // Pointer lock ativo
  canJump: boolean,       // Pode pular
  isSprinting: boolean,   // Está correndo
  isCrouching: boolean,   // Está agachado
  hasWeapon: boolean,     // Tem arma equipada
  currentWeapon: string,  // Tipo de arma atual
  inventory: array        // Itens coletados
}
```

**Movimento:**
- Velocidade normal: 5 units/s
- Sprint: 8 units/s (consome stamina)
- Crouch: 2.5 units/s
- Pulo: 5 units/s (gravidade: 15 units/s²)
- Altura: 1.7m (normal), 1.2m (agachado)

### 2. Weapon System

**Estrutura de Arma:**
```javascript
weapon: {
  name: string,           // Nome da arma
  damage: number,         // Dano por tiro
  magazineSize: number,   // Capacidade do carregador
  reserveAmmo: number,    // Munição de reserva
  currentMagazine: number,// Munição atual
  fireRate: number,       // Tempo entre tiros (s)
  recoil: number,         // Recuo vertical
  spread: number,         // Dispersão
  range: number           // Alcance máximo
}
```

**Armas Planejadas:**
- 9MM Pistol (inicial)
- Shotgun
- Revolver
- SMG
- Rifle

### 3. NRL System (Neural Reconstruction Level)

**Níveis:**
```
100% → Realidade estável
 80% → Pequenas anomalias
 60% → Memórias sobrepostas
 40% → Distorção ambiental
 20% → Realidade instável
 10% → Protocolo crítico
  0% → Lucid Breach
```

**Efeitos por Nível:**
- **100-80%:** Nenhum efeito
- **80-60%:** Luzes piscam ocasionalmente
- **60-40%:** Sons inexplicáveis, sombras
- **40-20%:** Objetos mudam, corredores distorcem
- **20-10%:** Inimigos aparecem, realidade quebra
- **10-0%:** Lucid Breach — realidade colapsa

**Decay:**
```javascript
player.nrl -= delta * 0.1; // 0.1% por segundo
```

### 4. Horror Director

**Função:**
Controla eventos psicológicos para criar tensão.

**Parâmetros:**
```javascript
horrorDirector: {
  eventTimer: number,      // Tempo desde último evento
  tensionLevel: number,    // Nível de tensão (0-100)
  lastEvent: number        // Timestamp do último evento
}
```

**Eventos Planejados:**
- Luzes piscando
- Portas fechando sozinhas
- Sons de passos
- Sombras passageiras
- Objetos mudando de posição
- Vozes distantes
- Aparições de entidades

---

## 🏢 AMBIENTE

### Salas Implementadas

1. **Main Lab** (0, 0, 0) — 20x20m
   - Cama médica
   - Monitor cardíaco
   - Computador com documentos

2. **Security Room** (25, 0, 0) — 15x15m
   - Armários
   - Mesa com arma

3. **Medical Wing** (0, 0, 25) — 15x15m
   - Camas médicas
   - Equipamentos

4. **Corridors**
   - Corredor para Security (15m)
   - Corredor para Medical (15m)

### Props

**Medical Bed:**
- Frame metálico
- Colchão
- 4 pernas
- Sombra projetada

**Monitor:**
- Tela emissiva (azul/verde)
- Suporte
- Base

**Computer:**
- Mesa
- Monitor
- Teclado
- 4 pernas

**Locker:**
- Armário metálico
- Maçaneta
- Porta (visual)

**Documents:**
- Papéis coletáveis
- Conteúdo narrativo
- Interativo (tecla E)

---

## 💡 ILUMINAÇÃO

### Tipos de Luz

1. **Ambient Light**
   - Cor: #404060
   - Intensidade: 0.3
   - Global, sem direção

2. **Fluorescent Lights**
   - Cor: #ddeeff
   - Intensidade: 1.5
   - Alcance: 12m
   - Sombras: Sim (512x512)
   - Posições: 7 pontos

3. **Emergency Lights**
   - Cor: #ff2200
   - Intensidade: 1.0
   - Alcance: 15m
   - Sombras: Não
   - Posições: 5 pontos

### Configuração do Renderer

```javascript
renderer: {
  antialias: true,
  powerPreference: 'high-performance',
  shadowMap: {
    enabled: true,
    type: PCFSoftShadowMap
  },
  toneMapping: ACESFilmicToneMapping,
  toneMappingExposure: 1.0
}
```

---

## 🎮 CONTROLES

### Input Mapping

```javascript
input: {
  forward: boolean,   // W
  backward: boolean,  // S
  left: boolean,      // A
  right: boolean,     // D
  jump: boolean,      // Space
  sprint: boolean,    // Shift
  crouch: boolean,    // Ctrl
  shoot: boolean,     // Mouse Left
  interact: boolean   // E
}
```

### Mouse Look

```javascript
sensitivity: 0.002
rotation.y -= movementX * sensitivity
rotation.x -= movementY * sensitivity

// Clamp vertical
rotation.x = clamp(-PI/2, PI/2)
```

---

## 🔄 GAME LOOP

```javascript
function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  
  if (player.isLocked) {
    updatePlayer(delta);      // Movimento, física
    updateCamera();           // Atualizar câmera
    checkInteractions();      // Verificar interações
    updateHorrorDirector(delta); // Eventos psicológicos
    updateUI();               // Atualizar HUD
  }
  
  renderer.render(scene, camera);
}
```

---

## 🎨 RENDERING

### Materiais PBR

**Parede:**
```javascript
{
  color: 0x2a2a30,
  roughness: 0.85,
  metalness: 0.15
}
```

**Chão:**
```javascript
{
  color: 0x1a1a20,
  roughness: 0.9,
  metalness: 0.1
}
```

**Metal:**
```javascript
{
  color: 0x333340,
  roughness: 0.6,
  metalness: 0.7
}
```

**Monitor (Emissivo):**
```javascript
{
  color: 0x000000,
  emissive: 0x00aaff,
  emissiveIntensity: 0.5,
  roughness: 0.3,
  metalness: 0.8
}
```

### Névoa

```javascript
scene.fog = new THREE.FogExp2(0x0a0a12, 0.015);
```

- Cor: #0a0a12 (azul muito escuro)
- Densidade: 0.015
- Tipo: Exponencial (mais realista)

---

## 🎵 ÁUDIO (Planejado)

### Sistema de Áudio Espacial

**Fontes de Som:**
- Passos do jogador
- Respiração
- Batimento cardíaco
- Portas
- Máquinas
- Vozes distantes
- Tiros
- Impactos
- Ambiente (ventilação, eletricidade)

**Parâmetros:**
```javascript
audio: {
  context: AudioContext,
  listener: AudioListener,
  sources: Map<string, AudioSource>
}
```

**Atenuação:**
- Distance model: Inverse
- Ref distance: 1m
- Max distance: 50m
- Rolloff factor: 1

---

## 📊 PERFORMANCE

### Otimizações

1. **Shadow Maps**
   - Apenas luzes importantes
   - Resolução: 512x512
   - PCFSoft para qualidade

2. **Pixel Ratio**
   - Cap: 2x (evita 4K em telas retina)
   - Performance vs qualidade

3. **Fog**
   - Culling natural de objetos distantes
   - Reduz draw calls

4. **Materiais**
   - PBR simplificado
   - Texturas procedurais (sem assets externos)
   - Reuso de materiais

5. **Geometria**
   - Primitivas simples (boxes, cylinders)
   - Low-poly mas eficaz
   - Instancing para objetos repetidos

### Metrics

```
Bundle Size: 470KB JS (120KB gzipped)
CSS: 27KB (6KB gzipped)
HTML: 3.5KB (1.3KB gzipped)
Total: ~500KB (127KB gzipped)

Target FPS: 60
Target Memory: < 500MB
Target Load Time: < 5s
```

---

## 🚀 EXPANSÃO

### Como Adicionar Novos Sistemas

#### 1. Novo Inimigo

```javascript
function createEnemy(type, position) {
  const enemy = {
    type: type,           // 'host', 'subject', 'memory'
    position: position,
    health: 100,
    state: 'idle',        // idle, patrol, chase, attack
    ai: {
      visionRange: 15,
      hearingRange: 20,
      speed: 3,
      damage: 20
    }
  };
  
  // Criar mesh 3D
  const mesh = createEnemyMesh(type);
  mesh.position.copy(position);
  mesh.userData = enemy;
  
  gameState.scene.add(mesh);
  gameState.environment.enemies.push(mesh);
  
  return enemy;
}
```

#### 2. Novo Evento Psicológico

```javascript
function triggerEvent(eventType) {
  switch (eventType) {
    case 'lights_flicker':
      flickerLights();
      break;
    case 'shadow_appear':
      spawnShadow();
      break;
    case 'door_close':
      closeRandomDoor();
      break;
    case 'voice_whisper':
      playWhisper();
      break;
  }
}
```

#### 3. Nova Sala

```javascript
function createNewRoom(x, y, z, width, depth, type) {
  // Criar paredes
  createRoom(x, y, z, width, depth);
  
  // Adicionar props específicos do tipo
  switch (type) {
    case 'generator':
      createGenerator(x, y, z);
      break;
    case 'archives':
      createFilingCabinets(x, y, z);
      break;
    case 'containment':
      createContainmentCells(x, y, z);
      break;
  }
  
  // Adicionar luzes
  addRoomLights(x, y, z, width, depth);
}
```

---

## 🐛 DEBUG

### Console Logs

```javascript
console.log('🎮 Initializing...');
console.log('🏗️ Building environment...');
console.log('💡 Setting up lighting...');
console.log('🎮 Setting up controls...');
console.log('🔊 Setting up audio...');
console.log('✅ Game initialized successfully');
```

### Debug Mode (Planejado)

```javascript
if (debugMode) {
  // Mostrar FPS
  // Mostrar posição do jogador
  // Mostrar estado dos inimigos
  // Wireframe mode
  // Collision boxes
}
```

---

## 📝 NOTAS TÉCNICAS

### Three.js Version
- Usando Three.js via npm
- Versão: Latest stable

### React
- Usado apenas para UI (menu, HUD)
- Não usado para renderização 3D
- Minimal dependency

### Vite
- Build tool rápido
- HMR para desenvolvimento
- Tree-shaking para production

### Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (WebGL2)
- Mobile: ⚠️ Limited (desktop-focused)

---

## 🎯 PRÓXIMOS PASSOS

### Prioridade Alta
1. Implementar sistema de inimigos com IA
2. Adicionar áudio espacial
3. Criar eventos psicológicos dinâmicos
4. Implementar sistema de save

### Prioridade Média
1. Expandir ambiente (mais salas)
2. Adicionar mais armas
3. Implementar inventário completo
4. Criar cutscenes

### Prioridade Baixa
1. Otimizações avançadas
2. Efeitos de pós-processamento
3. Sistema de achievements
4. Multiplayer (futuro)

---

**Documentação Técnica v0.1.0**  
*Protocolo Lúcido — THE MEMORY IS LYING*
