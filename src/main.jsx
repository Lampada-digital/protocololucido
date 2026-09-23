import * as THREE from 'three';
import './index.css';

// ═══════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════
const gameState = {
  scene: null,
  camera: null,
  renderer: null,
  clock: null,
  
  // Player
  player: {
    position: new THREE.Vector3(0, 1.7, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
    health: 100,
    maxHealth: 100,
    stamina: 100,
    nrl: 100, // Neural Reconstruction Level (100 = stable, 0 = breach)
    isLocked: false,
    canJump: true,
    isSprinting: false,
    isCrouching: false,
    hasWeapon: false,
    currentWeapon: null,
    inventory: []
  },
  
  // Input
  input: {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    crouch: false,
    shoot: false,
    interact: false
  },
  
  // Weapons
  weapons: {
    pistol: {
      name: '9MM PISTOL',
      damage: 25,
      magazineSize: 8,
      reserveAmmo: 24,
      currentMagazine: 8,
      fireRate: 0.3,
      recoil: 0.02,
      spread: 0.01,
      range: 50
    }
  },
  
  // Environment
  environment: {
    lights: [],
    enemies: [],
    interactables: [],
    documents: [],
    doors: []
  },
  
  // Game systems
  systems: {
    horrorDirector: {
      eventTimer: 0,
      tensionLevel: 0,
      lastEvent: 0
    },
    audio: {
      context: null,
      listener: null
    }
  },
  
  // UI
  ui: {
    showInteraction: false,
    interactionText: '',
    deathCount: 1
  }
};

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════
function init() {
  console.log('🎮 Initializing PROTOCOLO LÚCIDO...');
  
  const canvas = document.getElementById('game-canvas');
  
  // Scene
  gameState.scene = new THREE.Scene();
  gameState.scene.background = new THREE.Color(0x0a0a12);
  gameState.scene.fog = new THREE.FogExp2(0x0a0a12, 0.015);
  
  // Camera
  gameState.camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  gameState.camera.position.copy(gameState.player.position);
  
  // Renderer
  gameState.renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  gameState.renderer.setSize(window.innerWidth, window.innerHeight);
  gameState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  gameState.renderer.shadowMap.enabled = true;
  gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  gameState.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  gameState.renderer.toneMappingExposure = 1.0;
  
  // Clock
  gameState.clock = new THREE.Clock();
  
  // Build world
  buildEnvironment();
  setupLighting();
  setupControls();
  setupAudio();
  
  // Start game loop
  animate();
  
  console.log('✅ Game initialized successfully');
}

// ═══════════════════════════════════════════════════════════
// ENVIRONMENT BUILDING
// ═══════════════════════════════════════════════════════════
function buildEnvironment() {
  console.log('🏗️ Building environment...');
  
  // Floor
  const floorGeo = new THREE.PlaneGeometry(100, 100);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a20,
    roughness: 0.9,
    metalness: 0.1
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  gameState.scene.add(floor);
  
  // Ceiling
  const ceilingGeo = new THREE.PlaneGeometry(100, 100);
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0x151518,
    roughness: 0.95,
    metalness: 0.05
  });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 4;
  gameState.scene.add(ceiling);
  
  // Walls
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a30,
    roughness: 0.85,
    metalness: 0.15
  });
  
  // Create laboratory rooms
  createRoom(0, 0, 0, 20, 20); // Main lab
  createRoom(25, 0, 0, 15, 15); // Security room
  createRoom(0, 0, 25, 15, 15); // Medical wing
  createCorridor(10, 0, 0, 15, 3); // Corridor to security
  createCorridor(0, 0, 10, 3, 15); // Corridor to medical
  
  // Props
  createMedicalBed(-5, 0, -5);
  createMonitor(5, 1.5, -8);
  createComputer(8, 0.75, -3);
  createLocker(-8, 0, 3);
  createLocker(-7, 0, 3);
  createDesk(3, 0, 5);
  createChair(3, 0, 6);
  
  // Documents
  createDocument(3.5, 0.76, 5.2, 'PROJECT_LUCID');
  createDocument(-5.5, 0.51, -4.8, 'SUBJECT_034');
  
  // Weapon pickup
  createWeaponPickup(26, 0.75, 2);
  
  console.log('✅ Environment built');
}

function createRoom(x, y, z, width, depth) {
  const wallHeight = 4;
  const wallThickness = 0.3;
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a30,
    roughness: 0.85,
    metalness: 0.15
  });
  
  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(width, wallHeight, wallThickness),
    wallMat
  );
  backWall.position.set(x, wallHeight / 2, z - depth / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  gameState.scene.add(backWall);
  
  // Front wall with door opening
  const frontWallLeft = new THREE.Mesh(
    new THREE.BoxGeometry(width / 2 - 1, wallHeight, wallThickness),
    wallMat
  );
  frontWallLeft.position.set(x - width / 4 - 0.5, wallHeight / 2, z + depth / 2);
  frontWallLeft.castShadow = true;
  gameState.scene.add(frontWallLeft);
  
  const frontWallRight = new THREE.Mesh(
    new THREE.BoxGeometry(width / 2 - 1, wallHeight, wallThickness),
    wallMat
  );
  frontWallRight.position.set(x + width / 4 + 0.5, wallHeight / 2, z + depth / 2);
  frontWallRight.castShadow = true;
  gameState.scene.add(frontWallRight);
  
  // Left wall
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, depth),
    wallMat
  );
  leftWall.position.set(x - width / 2, wallHeight / 2, z);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  gameState.scene.add(leftWall);
  
  // Right wall
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, depth),
    wallMat
  );
  rightWall.position.set(x + width / 2, wallHeight / 2, z);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  gameState.scene.add(rightWall);
}

function createCorridor(x, y, z, length, width) {
  const wallHeight = 4;
  const wallThickness = 0.3;
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a30,
    roughness: 0.85,
    metalness: 0.15
  });
  
  // Left wall
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, length),
    wallMat
  );
  leftWall.position.set(x - width / 2, wallHeight / 2, z + length / 2);
  leftWall.castShadow = true;
  gameState.scene.add(leftWall);
  
  // Right wall
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, length),
    wallMat
  );
  rightWall.position.set(x + width / 2, wallHeight / 2, z + length / 2);
  rightWall.castShadow = true;
  gameState.scene.add(rightWall);
}

function createMedicalBed(x, y, z) {
  const bed = new THREE.Group();
  
  // Frame
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x333340,
    roughness: 0.6,
    metalness: 0.7
  });
  
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.5, 1),
    frameMat
  );
  frame.position.y = 0.5;
  frame.castShadow = true;
  bed.add(frame);
  
  // Mattress
  const mattressMat = new THREE.MeshStandardMaterial({
    color: 0x444450,
    roughness: 0.9,
    metalness: 0.1
  });
  
  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.2, 0.9),
    mattressMat
  );
  mattress.position.y = 0.85;
  bed.add(mattress);
  
  // Legs
  const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5);
  const positions = [
    [-0.9, 0.25, -0.4],
    [0.9, 0.25, -0.4],
    [-0.9, 0.25, 0.4],
    [0.9, 0.25, 0.4]
  ];
  
  positions.forEach(pos => {
    const leg = new THREE.Mesh(legGeo, frameMat);
    leg.position.set(pos[0], pos[1], pos[2]);
    bed.add(leg);
  });
  
  bed.position.set(x, y, z);
  gameState.scene.add(bed);
}

function createMonitor(x, y, z) {
  const monitor = new THREE.Group();
  
  // Screen
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0x00aaff,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.8
  });
  
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.6, 0.05),
    screenMat
  );
  monitor.add(screen);
  
  // Stand
  const standMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.7,
    metalness: 0.5
  });
  
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.5),
    standMat
  );
  stand.position.y = -0.55;
  monitor.add(stand);
  
  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.05),
    standMat
  );
  base.position.y = -0.8;
  monitor.add(base);
  
  monitor.position.set(x, y, z);
  gameState.scene.add(monitor);
}

function createComputer(x, y, z) {
  const computer = new THREE.Group();
  
  // Desk
  const deskMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a30,
    roughness: 0.8,
    metalness: 0.2
  });
  
  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.05, 0.8),
    deskMat
  );
  desk.position.y = 0.75;
  desk.castShadow = true;
  computer.add(desk);
  
  // Legs
  const legGeo = new THREE.BoxGeometry(0.05, 0.75, 0.05);
  const legPositions = [
    [-0.7, 0.375, -0.35],
    [0.7, 0.375, -0.35],
    [-0.7, 0.375, 0.35],
    [0.7, 0.375, 0.35]
  ];
  
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeo, deskMat);
    leg.position.set(pos[0], pos[1], pos[2]);
    computer.add(leg);
  });
  
  // Monitor
  const monitorMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0x00ff41,
    emissiveIntensity: 0.3,
    roughness: 0.3,
    metalness: 0.8
  });
  
  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.4, 0.05),
    monitorMat
  );
  monitor.position.set(0, 1.1, -0.2);
  computer.add(monitor);
  
  // Keyboard
  const keyboardMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.3
  });
  
  const keyboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.02, 0.15),
    keyboardMat
  );
  keyboard.position.set(0, 0.76, 0.1);
  computer.add(keyboard);
  
  computer.position.set(x, y, z);
  gameState.scene.add(computer);
}

function createLocker(x, y, z) {
  const lockerMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a40,
    roughness: 0.7,
    metalness: 0.6
  });
  
  const locker = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 2, 0.5),
    lockerMat
  );
  locker.position.set(x, 1, z);
  locker.castShadow = true;
  locker.receiveShadow = true;
  gameState.scene.add(locker);
  
  // Handle
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.5,
    metalness: 0.8
  });
  
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.3, 0.05),
    handleMat
  );
  handle.position.set(x + 0.25, 1, z - 0.25);
  gameState.scene.add(handle);
}

function createDesk(x, y, z) {
  const deskMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a30,
    roughness: 0.8,
    metalness: 0.2
  });
  
  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.05, 0.8),
    deskMat
  );
  desk.position.set(x, 0.75, z);
  desk.castShadow = true;
  gameState.scene.add(desk);
  
  // Legs
  const legGeo = new THREE.BoxGeometry(0.05, 0.75, 0.05);
  const positions = [
    [x - 0.7, 0.375, z - 0.35],
    [x + 0.7, 0.375, z - 0.35],
    [x - 0.7, 0.375, z + 0.35],
    [x + 0.7, 0.375, z + 0.35]
  ];
  
  positions.forEach(pos => {
    const leg = new THREE.Mesh(legGeo, deskMat);
    leg.position.set(pos[0], pos[1], pos[2]);
    gameState.scene.add(leg);
  });
}

function createChair(x, y, z) {
  const chairMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a30,
    roughness: 0.8,
    metalness: 0.3
  });
  
  const chair = new THREE.Group();
  
  // Seat
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.05, 0.5),
    chairMat
  );
  seat.position.y = 0.5;
  chair.add(seat);
  
  // Back
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.05),
    chairMat
  );
  back.position.set(0, 0.75, -0.225);
  chair.add(back);
  
  // Legs
  const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5);
  const positions = [
    [-0.2, 0.25, -0.2],
    [0.2, 0.25, -0.2],
    [-0.2, 0.25, 0.2],
    [0.2, 0.25, 0.2]
  ];
  
  positions.forEach(pos => {
    const leg = new THREE.Mesh(legGeo, chairMat);
    leg.position.set(pos[0], pos[1], pos[2]);
    chair.add(leg);
  });
  
  chair.position.set(x, y, z);
  gameState.scene.add(chair);
}

function createDocument(x, y, z, type) {
  const docMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.1,
    emissive: 0x222222,
    emissiveIntensity: 0.1
  });
  
  const doc = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.01, 0.3),
    docMat
  );
  doc.position.set(x, y, z);
  doc.userData = {
    type: 'document',
    documentType: type,
    interactable: true
  };
  gameState.scene.add(doc);
  gameState.environment.documents.push(doc);
}

function createWeaponPickup(x, y, z) {
  const weaponMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.4,
    metalness: 0.9,
    emissive: 0x00aaff,
    emissiveIntensity: 0.2
  });
  
  const weapon = new THREE.Group();
  
  // Barrel
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.3),
    weaponMat
  );
  barrel.rotation.z = Math.PI / 2;
  weapon.add(barrel);
  
  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.08, 0.05),
    weaponMat
  );
  body.position.x = -0.1;
  weapon.add(body);
  
  // Grip
  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.12, 0.04),
    weaponMat
  );
  grip.position.set(-0.15, -0.08, 0);
  weapon.add(grip);
  
  weapon.position.set(x, y, z);
  weapon.userData = {
    type: 'weapon',
    weaponType: 'pistol',
    interactable: true
  };
  gameState.scene.add(weapon);
  gameState.environment.interactables.push(weapon);
}

// ═══════════════════════════════════════════════════════════
// LIGHTING
// ═══════════════════════════════════════════════════════════
function setupLighting() {
  console.log('💡 Setting up lighting...');
  
  // Ambient light (very dim)
  const ambientLight = new THREE.AmbientLight(0x404060, 0.3);
  gameState.scene.add(ambientLight);
  
  // Fluorescent lights
  const fluorescentPositions = [
    [0, 3.8, 0],
    [-5, 3.8, -5],
    [5, 3.8, -5],
    [-5, 3.8, 5],
    [5, 3.8, 5],
    [25, 3.8, 0],
    [0, 3.8, 25]
  ];
  
  fluorescentPositions.forEach(pos => {
    const light = new THREE.PointLight(0xddeeff, 1.5, 12);
    light.position.set(pos[0], pos[1], pos[2]);
    light.castShadow = true;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    gameState.scene.add(light);
    gameState.environment.lights.push(light);
    
    // Light fixture
    const fixtureMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
    const fixture = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.1, 2),
      fixtureMat
    );
    fixture.position.set(pos[0], pos[1] + 0.1, pos[2]);
    gameState.scene.add(fixture);
  });
  
  // Emergency red lights
  const emergencyPositions = [
    [-8, 3, -8],
    [8, 3, -8],
    [-8, 3, 8],
    [8, 3, 8],
    [25, 3, 2]
  ];
  
  emergencyPositions.forEach(pos => {
    const light = new THREE.PointLight(0xff2200, 1, 15);
    light.position.set(pos[0], pos[1], pos[2]);
    gameState.scene.add(light);
    gameState.environment.lights.push(light);
  });
  
  console.log('✅ Lighting setup complete');
}

// ═══════════════════════════════════════════════════════════
// CONTROLS
// ═══════════════════════════════════════════════════════════
function setupControls() {
  console.log('🎮 Setting up controls...');
  
  const canvas = document.getElementById('game-canvas');
  
  // Pointer lock
  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });
  
  document.addEventListener('pointerlockchange', () => {
    gameState.player.isLocked = document.pointerLockElement === canvas;
    console.log('Pointer lock:', gameState.player.isLocked);
  });
  
  // Mouse look
  document.addEventListener('mousemove', (e) => {
    if (!gameState.player.isLocked) return;
    
    const sensitivity = 0.002;
    gameState.player.rotation.y -= e.movementX * sensitivity;
    gameState.player.rotation.x -= e.movementY * sensitivity;
    
    // Clamp vertical rotation
    gameState.player.rotation.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, gameState.player.rotation.x)
    );
  });
  
  // Keyboard
  document.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'KeyW': gameState.input.forward = true; break;
      case 'KeyS': gameState.input.backward = true; break;
      case 'KeyA': gameState.input.left = true; break;
      case 'KeyD': gameState.input.right = true; break;
      case 'Space':
        if (gameState.player.canJump) {
          gameState.player.velocity.y = 5;
          gameState.player.canJump = false;
        }
        break;
      case 'ShiftLeft': gameState.input.sprint = true; break;
      case 'ControlLeft': gameState.input.crouch = true; break;
      case 'KeyE': gameState.input.interact = true; break;
      case 'KeyR': reloadWeapon(); break;
    }
  });
  
  document.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW': gameState.input.forward = false; break;
      case 'KeyS': gameState.input.backward = false; break;
      case 'KeyA': gameState.input.left = false; break;
      case 'KeyD': gameState.input.right = false; break;
      case 'ShiftLeft': gameState.input.sprint = false; break;
      case 'ControlLeft': gameState.input.crouch = false; break;
      case 'KeyE': gameState.input.interact = false; break;
    }
  });
  
  // Mouse buttons
  document.addEventListener('mousedown', (e) => {
    if (e.button === 0) gameState.input.shoot = true;
  });
  
  document.addEventListener('mouseup', (e) => {
    if (e.button === 0) gameState.input.shoot = false;
  });
  
  // Window resize
  window.addEventListener('resize', () => {
    gameState.camera.aspect = window.innerWidth / window.innerHeight;
    gameState.camera.updateProjectionMatrix();
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  console.log('✅ Controls setup complete');
}

// ═══════════════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════════════
function setupAudio() {
  console.log('🔊 Setting up audio...');
  
  try {
    gameState.systems.audio.context = new (window.AudioContext || window.webkitAudioContext)();
    gameState.systems.audio.listener = gameState.systems.audio.context.listener;
    console.log('✅ Audio setup complete');
  } catch (error) {
    console.warn('⚠️ Audio setup failed:', error);
  }
}

// ═══════════════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════════════
function animate() {
  requestAnimationFrame(animate);
  
  const delta = gameState.clock.getDelta();
  
  if (gameState.player.isLocked) {
    updatePlayer(delta);
    updateCamera();
    checkInteractions();
    updateHorrorDirector(delta);
    updateUI();
  }
  
  gameState.renderer.render(gameState.scene, gameState.camera);
}

function updatePlayer(delta) {
  const player = gameState.player;
  const input = gameState.input;
  
  // Movement speed
  let speed = 5;
  if (input.sprint && player.stamina > 0) {
    speed = 8;
    player.stamina -= delta * 20;
  } else {
    player.stamina = Math.min(100, player.stamina + delta * 10);
  }
  
  if (input.crouch) speed = 2.5;
  
  // Movement direction
  const direction = new THREE.Vector3();
  
  if (input.forward) direction.z -= 1;
  if (input.backward) direction.z += 1;
  if (input.left) direction.x -= 1;
  if (input.right) direction.x += 1;
  
  direction.normalize();
  direction.applyEuler(new THREE.Euler(0, player.rotation.y, 0, 'YXZ'));
  
  // Apply movement
  player.position.x += direction.x * speed * delta;
  player.position.z += direction.z * speed * delta;
  
  // Gravity
  player.velocity.y -= 15 * delta;
  player.position.y += player.velocity.y * delta;
  
  // Ground collision
  const groundHeight = input.crouch ? 1.2 : 1.7;
  if (player.position.y < groundHeight) {
    player.position.y = groundHeight;
    player.velocity.y = 0;
    player.canJump = true;
  }
  
  // Boundary collision
  player.position.x = Math.max(-45, Math.min(45, player.position.x));
  player.position.z = Math.max(-45, Math.min(45, player.position.z));
  
  // Shooting
  if (input.shoot && player.hasWeapon) {
    shootWeapon();
  }
}

function updateCamera() {
  gameState.camera.position.copy(gameState.player.position);
  gameState.camera.rotation.copy(gameState.player.rotation);
}

function checkInteractions() {
  if (!gameState.input.interact) return;
  
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), gameState.camera);
  raycaster.far = 3;
  
  const interactables = gameState.environment.interactables.concat(
    gameState.environment.documents
  );
  
  const intersects = raycaster.intersectObjects(interactables);
  
  if (intersects.length > 0) {
    const object = intersects[0].object;
    
    if (object.userData.type === 'weapon') {
      pickupWeapon(object);
    } else if (object.userData.type === 'document') {
      readDocument(object);
    }
  }
}

function pickupWeapon(weapon) {
  if (!gameState.player.hasWeapon) {
    gameState.player.hasWeapon = true;
    gameState.player.currentWeapon = 'pistol';
    gameState.scene.remove(weapon);
    
    const index = gameState.environment.interactables.indexOf(weapon);
    if (index > -1) {
      gameState.environment.interactables.splice(index, 1);
    }
    
    showNotification('WEAPON ACQUIRED: 9MM PISTOL');
  }
}

function readDocument(doc) {
  const content = getDocumentContent(doc.userData.documentType);
  showNotification(content);
}

function getDocumentContent(type) {
  const documents = {
    'PROJECT_LUCID': 'PROJECT LUCID — Memory reconstruction technology. Status: ACTIVE. Protocol 12 initiated.',
    'SUBJECT_034': 'SUBJECT 034 — Daniel Vale. Memory integrity: 12%. WARNING: Secondary personality detected.'
  };
  
  return documents[type] || 'DOCUMENT UNREADABLE';
}

function shootWeapon() {
  const weapon = gameState.weapons[gameState.player.currentWeapon];
  
  if (weapon.currentMagazine <= 0) {
    showNotification('RELOAD REQUIRED');
    return;
  }
  
  weapon.currentMagazine--;
  
  // Recoil
  gameState.player.rotation.x += weapon.recoil;
  
  // Muzzle flash (visual feedback)
  // TODO: Add muzzle flash effect
}

function reloadWeapon() {
  const weapon = gameState.weapons[gameState.player.currentWeapon];
  
  if (!weapon || weapon.currentMagazine === weapon.magazineSize) return;
  if (weapon.reserveAmmo <= 0) return;
  
  const needed = weapon.magazineSize - weapon.currentMagazine;
  const available = Math.min(needed, weapon.reserveAmmo);
  
  weapon.currentMagazine += available;
  weapon.reserveAmmo -= available;
  
  showNotification('RELOADING...');
}

function updateHorrorDirector(delta) {
  const director = gameState.systems.horrorDirector;
  
  director.eventTimer += delta;
  
  // Random psychological events
  if (director.eventTimer > 30 && Math.random() < 0.01) {
    triggerPsychologicalEvent();
    director.eventTimer = 0;
  }
  
  // NRL decay
  gameState.player.nrl = Math.max(0, gameState.player.nrl - delta * 0.1);
}

function triggerPsychologicalEvent() {
  // TODO: Implement psychological events
  // - Lights flicker
  // - Sounds play
  // - Objects move
  // - Shadows appear
}

function updateUI() {
  // Health bar
  const healthBar = document.getElementById('health-bar');
  if (healthBar) {
    healthBar.style.setProperty('--health-width', `${gameState.player.health}%`);
  }
  
  // Ammo display
  const ammoDisplay = document.getElementById('ammo-display');
  if (ammoDisplay && gameState.player.hasWeapon) {
    const weapon = gameState.weapons[gameState.player.currentWeapon];
    ammoDisplay.textContent = `${weapon.currentMagazine} / ${weapon.reserveAmmo}`;
  }
  
  // NRL display
  const nrlDisplay = document.getElementById('nrl-display');
  if (nrlDisplay) {
    nrlDisplay.textContent = `NRL: ${Math.round(gameState.player.nrl)}%`;
  }
}

function showNotification(text) {
  const prompt = document.getElementById('interaction-prompt');
  if (prompt) {
    prompt.textContent = text;
    prompt.classList.add('visible');
    
    setTimeout(() => {
      prompt.classList.remove('visible');
    }, 3000);
  }
}

// ═══════════════════════════════════════════════════════════
// MENU SYSTEM
// ═══════════════════════════════════════════════════════════
function startGame() {
  console.log('🎬 Starting game...');
  
  const menu = document.getElementById('main-menu');
  if (menu) {
    menu.style.display = 'none';
  }
  
  init();
}

function showDeathScreen() {
  const deathScreen = document.getElementById('death-screen');
  if (deathScreen) {
    deathScreen.style.display = 'flex';
    gameState.ui.deathCount++;
    document.getElementById('death-attempt').textContent = 
      gameState.ui.deathCount.toString().padStart(2, '0');
  }
}

function restartGame() {
  const deathScreen = document.getElementById('death-screen');
  if (deathScreen) {
    deathScreen.style.display = 'none';
  }
  
  // Reset player
  gameState.player.health = 100;
  gameState.player.nrl = 100;
  gameState.player.position.set(0, 1.7, 0);
}

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 PROTOCOLO LÚCIDO loaded');
  
  // Menu buttons
  const btnNewSession = document.getElementById('btn-new-session');
  if (btnNewSession) {
    btnNewSession.addEventListener('click', startGame);
  }
  
  const btnRestart = document.getElementById('btn-restart');
  if (btnRestart) {
    btnRestart.addEventListener('click', restartGame);
  }
  
  // Start on any key
  document.addEventListener('keydown', (e) => {
    const menu = document.getElementById('main-menu');
    if (menu && menu.style.display !== 'none') {
      startGame();
    }
  });
  
  // Animate system message
  const messages = [
    'SYSTEM MESSAGE: "HE IS AWAKE."',
    'WARNING: MEMORY INTEGRITY CRITICAL',
    'PROTOCOL 12: ACTIVE',
    'SUBJECT 034: LOCATED'
  ];
  
  let messageIndex = 0;
  setInterval(() => {
    const msgElement = document.getElementById('system-message');
    if (msgElement) {
      messageIndex = (messageIndex + 1) % messages.length;
      msgElement.textContent = messages[messageIndex];
    }
  }, 5000);
});

window.startGame = startGame;
window.showDeathScreen = showDeathScreen;
window.restartGame = restartGame;
