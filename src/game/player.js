import * as THREE from 'three';

export class Player {
  constructor(camera, scene, game) {
    this.camera = camera;
    this.scene = scene;
    this.game = game;
    
    // Movement state
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.position = new THREE.Vector3(0, 1.6, 0);
    
    // Player stats
    this.health = 100;
    this.ammo = 30;
    this.maxAmmo = 30;
    this.isReloading = false;
    
    // Movement settings
    this.walkSpeed = 5;
    this.sprintSpeed = 8;
    this.crouchSpeed = 2.5;
    this.jumpForce = 5;
    this.gravity = 10;
    this.mouseSensitivity = 0.002;
    
    // State flags
    this.isSprinting = false;
    this.isCrouching = false;
    this.isGrounded = true;
    this.canJump = true;
    
    // Camera rotation
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.pitchObject = new THREE.Object3D();
    this.pitchObject.add(this.camera);
    
    this.yawObject = new THREE.Object3D();
    this.yawObject.add(this.pitchObject);
    this.yawObject.position.copy(this.position);
    this.scene.add(this.yawObject);
    
    // Input state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isPointerLocked = false;
    
    // Raycaster for shooting
    this.raycaster = new THREE.Raycaster();
    
    // Weapon bob
    this.bobTimer = 0;
    this.bobAmount = 0;
    
    // Muzzle flash
    this.muzzleFlashTime = 0;
    
    this.initControls();
    this.initPointerLock();
  }
  
  initControls() {
    // Keyboard
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    
    // Mouse
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mousedown', (e) => this.onMouseDown(e));
    
    // Pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement !== null;
    });
  }
  
  initPointerLock() {
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        canvas.requestPointerLock();
      }
    });
  }
  
  onKeyDown(event) {
    switch (event.code) {
      case 'KeyW': this.moveForward = true; break;
      case 'KeyS': this.moveBackward = true; break;
      case 'KeyA': this.moveLeft = true; break;
      case 'KeyD': this.moveRight = true; break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = true;
        break;
      case 'ControlLeft':
      case 'ControlRight':
        this.isCrouching = true;
        break;
      case 'Space':
        if (this.canJump && this.isGrounded) {
          this.velocity.y = this.jumpForce;
          this.isGrounded = false;
          this.canJump = false;
        }
        break;
      case 'KeyR':
        this.reload();
        break;
      case 'KeyF':
        // Panic button (fallback for no mic)
        if (this.game.audioSystem && !this.game.audioSystem.isActive) {
          this.game.onScream(0.5);
        }
        break;
    }
  }
  
  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW': this.moveForward = false; break;
      case 'KeyS': this.moveBackward = false; break;
      case 'KeyA': this.moveLeft = false; break;
      case 'KeyD': this.moveRight = false; break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = false;
        break;
      case 'ControlLeft':
      case 'ControlRight':
        this.isCrouching = false;
        break;
      case 'Space':
        this.canJump = true;
        break;
    }
  }
  
  onMouseMove(event) {
    if (!this.isPointerLocked) return;
    
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    this.yawObject.rotation.y -= movementX * this.mouseSensitivity;
    this.pitchObject.rotation.x -= movementY * this.mouseSensitivity;
    
    // Clamp pitch
    this.pitchObject.rotation.x = Math.max(
      -Math.PI / 2 + 0.01,
      Math.min(Math.PI / 2 - 0.01, this.pitchObject.rotation.x)
    );
  }
  
  onMouseDown(event) {
    if (!this.isPointerLocked) return;
    
    if (event.button === 0) {
      this.shoot();
    }
  }
  
  shoot() {
    if (this.ammo <= 0 || this.isReloading) return;
    
    this.ammo--;
    this.muzzleFlashTime = Date.now();
    
    // Setup raycaster from camera center
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    // Notify game of shot
    this.game.onShoot(this.raycaster);
    
    // Auto-reload when empty
    if (this.ammo <= 0) {
      setTimeout(() => this.reload(), 500);
    }
  }
  
  reload() {
    if (this.isReloading || this.ammo >= this.maxAmmo) return;
    
    this.isReloading = true;
    
    // Reload takes 2 seconds
    setTimeout(() => {
      this.ammo = this.maxAmmo;
      this.isReloading = false;
    }, 2000);
  }
  
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    
    // Screen shake effect
    this.cameraShake(0.1, 200);
    
    if (this.health <= 0) {
      this.onDeath();
    }
  }
  
  cameraShake(intensity, duration) {
    const startTime = Date.now();
    const shake = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        const progress = elapsed / duration;
        const shakeIntensity = intensity * (1 - progress);
        
        this.camera.position.x += (Math.random() - 0.5) * shakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * shakeIntensity;
        
        requestAnimationFrame(shake);
      }
    };
    shake();
  }
  
  onDeath() {
    // Game over logic
    console.log('Player died');
    // Reset after delay
    setTimeout(() => {
      this.health = 100;
      this.ammo = this.maxAmmo;
      this.position.set(0, 1.6, 0);
      this.yawObject.position.copy(this.position);
    }, 3000);
  }
  
  update(delta) {
    if (!this.isPointerLocked) return;
    
    // Calculate movement speed
    let speed = this.walkSpeed;
    if (this.isSprinting && !this.isCrouching) speed = this.sprintSpeed;
    if (this.isCrouching) speed = this.crouchSpeed;
    
    // Apply gravity
    this.velocity.y -= this.gravity * delta;
    
    // Calculate movement direction
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();
    
    // Apply movement relative to camera direction
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.yawObject.quaternion);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(this.yawObject.quaternion);
    right.y = 0;
    right.normalize();
    
    // Apply velocity
    const moveX = (forward.x * this.direction.z + right.x * this.direction.x) * speed * delta;
    const moveZ = (forward.z * this.direction.z + right.z * this.direction.x) * speed * delta;
    
    this.yawObject.position.x += moveX;
    this.yawObject.position.z += moveZ;
    this.yawObject.position.y += this.velocity.y * delta;
    
    // Ground collision
    const groundHeight = this.isCrouching ? 1.0 : 1.6;
    if (this.yawObject.position.y < groundHeight) {
      this.yawObject.position.y = groundHeight;
      this.velocity.y = 0;
      this.isGrounded = true;
    }
    
    // Wall collision (simple bounds)
    this.yawObject.position.x = Math.max(-19, Math.min(19, this.yawObject.position.x));
    this.yawObject.position.z = Math.max(-19, Math.min(19, this.yawObject.position.z));
    
    // Weapon bob when moving
    const isMoving = this.direction.length() > 0;
    if (isMoving && this.isGrounded) {
      this.bobTimer += delta * (this.isSprinting ? 12 : 8);
      this.bobAmount = Math.sin(this.bobTimer) * 0.03;
      this.camera.position.y = this.bobAmount;
    } else {
      this.bobAmount *= 0.9;
      this.camera.position.y = this.bobAmount;
    }
    
    // Muzzle flash decay
    if (Date.now() - this.muzzleFlashTime > 50) {
      this.muzzleFlashTime = 0;
    }
  }
  
  getPosition() {
    return this.yawObject.position.clone();
  }
  
  getRotation() {
    return {
      x: this.pitchObject.rotation.x,
      y: this.yawObject.rotation.y
    };
  }
}
