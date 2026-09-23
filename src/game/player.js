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
    
    // Survival stats
    this.health = 100;
    this.ammo = 12; // Start with limited ammo
    this.maxAmmo = 30;
    this.isReloading = false;
    
    // Movement settings
    this.walkSpeed = 4;
    this.sprintSpeed = 7;
    this.crouchSpeed = 2;
    this.jumpForce = 4;
    this.gravity = 12;
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
    
    // Footstep timer
    this.footstepTimer = 0;
    this.footstepInterval = 0.5;
    
    // Breathing/heartbeat
    this.breathTimer = 0;
    this.heartbeatIntensity = 0;
    
    // Stamina
    this.stamina = 100;
    this.staminaDrain = 15; // Per second while sprinting
    this.staminaRegen = 10; // Per second while not sprinting
    
    this.initControls();
    this.initPointerLock();
  }
  
  initControls() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mousedown', (e) => this.onMouseDown(e));
    
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
        if (this.stamina > 10) {
          this.isSprinting = true;
        }
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
        this.game.toggleFlashlight();
        break;
      case 'KeyE':
        this.interact();
        break;
      case 'KeyI':
        this.toggleInventory();
        break;
      case 'KeyM':
        if (this.game.audioSystem) {
          this.game.audioSystem.toggleMicrophone();
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
    
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    this.game.onShoot(this.raycaster);
    
    // Play gunshot sound
    if (this.game.audioSystem) {
      this.game.audioSystem.playGunshot();
    }
    
    // Camera recoil
    this.pitchObject.rotation.x += 0.02;
    
    if (this.ammo <= 0) {
      setTimeout(() => this.reload(), 500);
    }
  }
  
  reload() {
    if (this.isReloading || this.ammo >= this.maxAmmo) return;
    
    // Check if we have ammo in inventory
    const ammoItem = this.game.inventorySystem.getItem('ammo');
    if (!ammoItem || ammoItem.count <= 0) return;
    
    this.isReloading = true;
    
    setTimeout(() => {
      const needed = this.maxAmmo - this.ammo;
      const available = Math.min(needed, ammoItem.count);
      
      this.ammo += available;
      ammoItem.count -= available;
      
      if (ammoItem.count <= 0) {
        this.game.inventorySystem.removeItem('ammo');
      }
      
      this.isReloading = false;
    }, 2000);
  }
  
  interact() {
    // Raycast forward to find interactable objects
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    raycaster.far = 3;
    
    const interactables = this.scene.children.filter(obj => obj.userData.interactable);
    const intersects = raycaster.intersectObjects(interactables, true);
    
    if (intersects.length > 0) {
      const target = intersects[0].object;
      const interactable = target.userData.interactable ? target : target.parent;
      
      if (interactable && interactable.userData.onInteract) {
        interactable.userData.onInteract(this.game);
      }
    }
  }
  
  toggleInventory() {
    if (this.game.inventorySystem) {
      this.game.inventorySystem.toggleUI();
    }
  }
  
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    
    this.game.cameraShake(0.15, 300);
    
    if (this.game.audioSystem) {
      this.game.audioSystem.playPain();
    }
    
    if (this.health <= 0) {
      this.onDeath();
    }
  }
  
  heal(amount) {
    this.health = Math.min(100, this.health + amount);
  }
  
  onDeath() {
    const deathScreen = document.getElementById('death-screen');
    deathScreen.style.display = 'flex';
    
    this.game.isRunning = false;
    
    if (this.game.audioSystem) {
      this.game.audioSystem.playDeath();
    }
    
    // Respawn button
    document.getElementById('respawn-button').onclick = () => {
      deathScreen.style.display = 'none';
      this.health = 100;
      this.ammo = 12;
      this.position.set(0, 1.6, 0);
      this.yawObject.position.copy(this.position);
      this.game.isRunning = true;
      this.game.sanitySystem.reset();
    };
  }
  
  update(delta) {
    if (!this.isPointerLocked) return;
    
    // Update stamina
    if (this.isSprinting && (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight)) {
      this.stamina = Math.max(0, this.stamina - this.staminaDrain * delta);
      if (this.stamina <= 0) {
        this.isSprinting = false;
      }
    } else {
      this.stamina = Math.min(100, this.stamina + this.staminaRegen * delta);
    }
    
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
    
    // Wall collision (bounds)
    this.yawObject.position.x = Math.max(-19, Math.min(19, this.yawObject.position.x));
    this.yawObject.position.z = Math.max(-19, Math.min(19, this.yawObject.position.z));
    
    // Footsteps
    const isMoving = this.direction.length() > 0 && this.isGrounded;
    if (isMoving) {
      this.footstepTimer += delta;
      const interval = this.isSprinting ? 0.35 : 0.5;
      
      if (this.footstepTimer >= interval) {
        this.footstepTimer = 0;
        if (this.game.audioSystem) {
          this.game.audioSystem.playFootstep(this.isSprinting);
        }
      }
      
      // Weapon bob
      this.bobTimer += delta * (this.isSprinting ? 12 : 8);
      this.bobAmount = Math.sin(this.bobTimer) * 0.03;
      this.camera.position.y = this.bobAmount;
    } else {
      this.bobAmount *= 0.9;
      this.camera.position.y = this.bobAmount;
    }
    
    // Breathing/heartbeat based on state
    this.updateBreathing(delta);
  }
  
  updateBreathing(delta) {
    const sanity = this.game.sanitySystem.getEffectiveSanity();
    
    // Heavy breathing when sprinting or low sanity
    const shouldBreatheHeavy = this.isSprinting || sanity < 40;
    
    if (shouldBreatheHeavy && this.game.audioSystem) {
      this.breathTimer += delta;
      if (this.breathTimer > 2) {
        this.breathTimer = 0;
        this.game.audioSystem.playBreathing(sanity < 30);
      }
    }
    
    // Heartbeat when sanity is very low
    if (sanity < 30 && this.game.audioSystem) {
      this.heartbeatIntensity = (30 - sanity) / 30;
      this.game.audioSystem.updateHeartbeat(this.heartbeatIntensity);
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
