import * as THREE from 'three';
import './index.css';

let scene, camera, renderer, clock;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false;
let velocity = { x: 0, y: 0, z: 0 };
let isLocked = false;

function init() {
  console.log('🎮 Initializing THE LUCID PROTOCOL...');
  
  const canvas = document.getElementById('game-canvas');
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a12);
  scene.fog = new THREE.Fog(0x0a0a12, 5, 30);
  
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.7, 0);
  
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
  scene.add(ambientLight);
  
  const mainLight = new THREE.DirectionalLight(0xffeedd, 0.8);
  mainLight.position.set(5, 10, 5);
  mainLight.castShadow = true;
  scene.add(mainLight);
  
  const redLight1 = new THREE.PointLight(0xff2200, 1, 15);
  redLight1.position.set(-5, 3, -5);
  scene.add(redLight1);
  
  const redLight2 = new THREE.PointLight(0xff2200, 1, 15);
  redLight2.position.set(5, 3, 5);
  scene.add(redLight2);
  
  buildEnvironment();
  
  clock = new THREE.Clock();
  setupControls();
  animate();
  
  console.log('✅ Game initialized successfully');
}

function buildEnvironment() {
  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x1a1a20, roughness: 0.8 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  
  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.9 });
  
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(50, 8, 0.5), wallMat);
  backWall.position.set(0, 4, -10);
  backWall.castShadow = true;
  scene.add(backWall);
  
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 50), wallMat);
  leftWall.position.set(-10, 4, 0);
  scene.add(leftWall);
  
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 50), wallMat);
  rightWall.position.set(10, 4, 0);
  scene.add(rightWall);
  
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x151518 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 8;
  scene.add(ceiling);
  
  // Fluorescent lights
  for (let i = -8; i <= 8; i += 4) {
    const light = new THREE.PointLight(0xddeeff, 1.5, 10);
    light.position.set(i, 7, 0);
    scene.add(light);
    
    const fixture = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.1, 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    fixture.position.set(i, 7.5, 0);
    scene.add(fixture);
  }
  
  // Medical bed
  const bed = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.5, 1),
    new THREE.MeshStandardMaterial({ color: 0x333340, metalness: 0.5 })
  );
  frame.position.y = 0.5;
  frame.castShadow = true;
  bed.add(frame);
  
  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.2, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x444450 })
  );
  mattress.position.y = 0.85;
  bed.add(mattress);
  
  bed.position.set(-5, 0, -5);
  scene.add(bed);
  
  // Monitor
  const monitor = new THREE.Group();
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.6, 0.05),
    new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      emissive: 0x00aaff,
      emissiveIntensity: 0.5
    })
  );
  monitor.add(screen);
  
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  stand.position.y = -0.55;
  monitor.add(stand);
  
  monitor.position.set(5, 1.5, -8);
  scene.add(monitor);
  
  console.log('✅ Environment built');
}

function setupControls() {
  const canvas = document.getElementById('game-canvas');
  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });
  
  document.addEventListener('pointerlockchange', () => {
    isLocked = document.pointerLockElement === canvas;
    console.log('Pointer lock:', isLocked);
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isLocked) return;
    
    const sensitivity = 0.002;
    camera.rotation.y -= e.movementX * sensitivity;
    camera.rotation.x -= e.movementY * sensitivity;
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
  });
  
  document.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'KeyW': moveForward = true; break;
      case 'KeyS': moveBackward = true; break;
      case 'KeyA': moveLeft = true; break;
      case 'KeyD': moveRight = true; break;
      case 'Space':
        if (canJump) {
          velocity.y = 5;
          canJump = false;
        }
        break;
    }
  });
  
  document.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW': moveForward = false; break;
      case 'KeyS': moveBackward = false; break;
      case 'KeyA': moveLeft = false; break;
      case 'KeyD': moveRight = false; break;
    }
  });
}

function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  
  if (isLocked) {
    const speed = 5;
    const direction = new THREE.Vector3();
    
    if (moveForward) direction.z -= 1;
    if (moveBackward) direction.z += 1;
    if (moveLeft) direction.x -= 1;
    if (moveRight) direction.x += 1;
    
    direction.normalize();
    direction.applyQuaternion(camera.quaternion);
    direction.y = 0;
    
    camera.position.x += direction.x * speed * delta;
    camera.position.z += direction.z * speed * delta;
    
    velocity.y -= 10 * delta;
    camera.position.y += velocity.y * delta;
    
    if (camera.position.y < 1.7) {
      camera.position.y = 1.7;
      velocity.y = 0;
      canJump = true;
    }
    
    camera.position.x = Math.max(-9, Math.min(9, camera.position.x));
    camera.position.z = Math.max(-9, Math.min(9, camera.position.z));
  }
  
  renderer.render(scene, camera);
}

function startGame() {
  console.log('🎬 Starting game...');
  
  const startScreen = document.getElementById('start-screen');
  if (startScreen) {
    startScreen.style.display = 'none';
  }
  
  init();
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 THE LUCID PROTOCOL loaded');
  
  const startButton = document.getElementById('start-button');
  if (startButton) {
    startButton.addEventListener('click', startGame);
  }
  
  document.addEventListener('keydown', (e) => {
    const startScreen = document.getElementById('start-screen');
    if (startScreen && startScreen.style.display !== 'none') {
      startGame();
    }
  });
});

window.startGame = startGame;
