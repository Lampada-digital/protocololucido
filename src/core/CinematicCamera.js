import * as THREE from 'three';

/**
 * CinematicCamera - First-person controller with cinematic feel
 * Features:
 * - Weighted head bob (heavy, not bouncy)
 * - Volumetric flashlight with god rays
 * - Sanity-based camera shake
 * - Smooth movement with acceleration/deceleration
 * - Interaction raycasting
 */
export class CinematicCamera {
  constructor(camera, scene, game) {
    this.camera = camera;
    this.scene = scene;
    this.game = game;
    
    // Movement state
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.position = new THREE.Vector3(0, 1.7, 0);
    
    // Movement parameters (cinematic feel)
    this.maxSpeed = 3.5;
    this.accelerationRate = 8;
    this.decelerationRate = 10;
    this.mouseSensitivity = 0.0015;
    
    // Head bob (weighted, heavy)
    this.bobTimer = 0;
    this.bobAmplitude = 0.04; // Subtle
    this.bobFrequency = 6; // Slow, heavy
    this.bobOffset = new THREE.Vector3();
    
    // Camera shake
    this.shakeIntensity = 0;
    this.shakeDecay = 0.95;
    this.shakeOffset = new THREE.Vector3();
    
    // Flashlight
    this.flashlight = null;
    this.flashlightOn = false;
    this.flashlightBattery = 100;
    this.flashlightDrainRate = 1.5; // Per second
    this.godRayMesh = null;
    
    // Camera rig (for head bob and shake)
    this.cameraRig = new THREE.Object3D();
    this.cameraRig.add(this.camera);
    
    this.yawObject = new THREE.Object3D();
    this.yawObject.add(this.cameraRig);
    this.yawObject.position.copy(this.position);
    this.scene.add(this.yawObject);
    
    // Input state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isSprinting = false;
    this.isCrouching = false;
    this.isPointerLocked = false;
    
    // Stamina
    this.stamina = 100;
    this.staminaDrain = 12;
    this.staminaRegen = 8;
    
    // Combat
    this.health = 100;
    this.maxHealth = 100;
    this.ammo = 12;
    this.maxAmmo = 30;
    this.reserveAmmo = 48;
    this.isReloading = false;
    
    // Interaction
    this.interactionRaycaster = new THREE.Raycaster();
    this.interactionDistance = 3;
    
    this.initControls();
    this.initFlashlight();
  }
  
  initControls() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mousedown', (e) => this.onMouseDown(e));
    
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement !== null;
    });
    
    // Click to lock pointer
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        canvas.requestPointerLock();
      }
    });
  }
  
  initFlashlight() {
    // Main flashlight (SpotLight) - starts ON for visibility
    this.flashlight = new THREE.SpotLight(0xfff5e0, 4, 25, Math.PI / 5, 0.4, 1.5);
    this.flashlight.position.set(0, 0, 0);
    this.flashlight.target.position.set(0, 0, -1);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 512;
    this.flashlight.shadow.mapSize.height = 512;
    this.flashlight.shadow.camera.near = 0.5;
    this.flashlight.shadow.camera.far = 25;
    this.scene.add(this.flashlight);
    this.scene.add(this.flashlight.target);
    
    // Volumetric god rays (cone mesh with additive blending)
    const coneGeo = new THREE.ConeGeometry(3, 20, 32, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff5e0,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    this.godRayMesh = new THREE.Mesh(coneGeo, coneMat);
    this.godRayMesh.rotation.x = Math.PI / 2;
    this.godRayMesh.position.z = -10;
    this.godRayMesh.visible = true; // Start visible
    this.scene.add(this.godRayMesh);
    
    // Flashlight starts ON
    this.flashlightOn = true;
  }
  
  toggleFlashlight() {
    if (this.flashlightBattery <= 0) return;
    
    this.flashlightOn = !this.flashlightOn;
    
    if (this.flashlightOn) {
      this.flashlight.intensity = 3;
      this.godRayMesh.visible = true;
    } else {
      this.flashlight.intensity = 0;
      this.godRayMesh.visible = false;
    }
    
    if (window.gameState) {
      window.gameState.flashlightOn = this.flashlightOn;
    }
  }
  
  updateFlashlight(delta) {
    if (this.flashlightOn) {
      // Drain battery
      this.flashlightBattery = Math.max(0, this.flashlightBattery - this.flashlightDrainRate * delta);
      
      if (this.flashlightBattery <= 0) {
        this.toggleFlashlight();
        return;
      }
      
      // Update flashlight position and direction
      const playerPos = this.getPosition();
      const playerRot = this.getRotation();
      
      this.flashlight.position.copy(playerPos);
      
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyEuler(new THREE.Euler(playerRot.x, playerRot.y, 0, 'YXZ'));
      
      this.flashlight.target.position.copy(playerPos).add(direction);
      
      // Update god ray mesh
      this.godRayMesh.position.copy(playerPos);
      this.godRayMesh.lookAt(this.flashlight.target.position);
      
      // Flicker when battery low
      if (this.flashlightBattery < 20) {
        const flicker = Math.random() > 0.9 ? 0.5 : 1.0;
        this.flashlight.intensity = 3 * flicker;
        this.godRayMesh.material.opacity = 0.03 * flicker;
      }
      
      // Fade as battery dies
      const batteryFactor = this.flashlightBattery / 100;
      this.flashlight.intensity = 3 * batteryFactor;
      this.godRayMesh.material.opacity = 0.03 * batteryFactor;
    }
    
    if (window.gameState) {
      window.gameState.battery = this.flashlightBattery;
    }
  }
  
  shoot() {
    if (this.ammo <= 0 || this.isReloading) return;
    
    this.ammo--;
    
    // Raycast from camera center
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    // Notify game of shot
    if (this.game && this.game.onShoot) {
      this.game.onShoot(raycaster);
    }
    
    // Camera recoil
    this.camera.rotation.x += 0.015;
    
    // Auto-reload when empty
    if (this.ammo <= 0) {
      setTimeout(() => this.reload(), 500);
    }
  }
  
  reload() {
    if (this.isReloading || this.ammo >= this.maxAmmo || this.reserveAmmo <= 0) return;
    
    this.isReloading = true;
    
    setTimeout(() => {
      const needed = this.maxAmmo - this.ammo;
      const available = Math.min(needed, this.reserveAmmo);
      
      this.ammo += available;
      this.reserveAmmo -= available;
      
      this.isReloading = false;
    }, 1500);
  }
  
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    
    if (this.game && this.game.cameraShake) {
      this.game.cameraShake(0.1, 200);
    }
    
    if (this.health <= 0) {
      this.onDeath();
    }
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  onDeath() {
    const deathScreen = document.getElementById('death-screen');
    if (deathScreen) {
      deathScreen.style.display = 'flex';
    }
    
    if (this.game) {
      this.game.isRunning = false;
    }
    
    // Respawn button
    const respawnButton = document.getElementById('respawn-button');
    if (respawnButton) {
      respawnButton.onclick = () => {
        if (deathScreen) deathScreen.style.display = 'none';
        this.health = this.maxHealth;
        this.ammo = 12;
        this.reserveAmmo = 48;
        this.yawObject.position.set(0, 1.7, 0);
        if (this.game) {
          this.game.isRunning = true;
          if (this.game.sanitySystem) {
            this.game.sanitySystem.reset();
          }
        }
      };
    }
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
      case 'KeyF':
        this.toggleFlashlight();
        break;
      case 'KeyE':
        this.interact();
        break;
      case 'KeyR':
        this.reload();
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
    }
  }
  
  onMouseMove(event) {
    if (!this.isPointerLocked) return;
    
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    this.yawObject.rotation.y -= movementX * this.mouseSensitivity;
    this.camera.rotation.x -= movementY * this.mouseSensitivity;
    
    // Clamp pitch
    this.camera.rotation.x = Math.max(
      -Math.PI / 2 + 0.01,
      Math.min(Math.PI / 2 - 0.01, this.camera.rotation.x)
    );
  }
  
  onMouseDown(event) {
    if (!this.isPointerLocked) return;
    
    if (event.button === 0) {
      this.shoot();
    }
  }
  
  interact() {
    // Raycast forward to find interactable objects
    this.interactionRaycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    this.interactionRaycaster.far = this.interactionDistance;
    
    const interactables = this.scene.children.filter(obj => obj.userData.interactable);
    const intersects = this.interactionRaycaster.intersectObjects(interactables, true);
    
    if (intersects.length > 0) {
      const target = intersects[0].object;
      const interactable = target.userData.interactable ? target : target.parent;
      
      if (interactable && interactable.userData.onInteract) {
        interactable.userData.onInteract(this.game);
      }
    }
  }
  
  updateHeadBob(delta) {
    const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
    
    if (isMoving && !this.isCrouching) {
      this.bobTimer += delta * this.bobFrequency;
      
      // Weighted bob (sin for vertical, cos for horizontal)
      const bobY = Math.sin(this.bobTimer) * this.bobAmplitude;
      const bobX = Math.cos(this.bobTimer * 0.5) * this.bobAmplitude * 0.5;
      
      this.bobOffset.y = bobY;
      this.bobOffset.x = bobX;
      
      this.cameraRig.position.copy(this.bobOffset);
    } else {
      // Smooth return to center
      this.bobOffset.multiplyScalar(0.9);
      this.cameraRig.position.copy(this.bobOffset);
    }
  }
  
  updateCameraShake(delta) {
    // Apply shake
    this.shakeOffset.set(
      (Math.random() - 0.5) * this.shakeIntensity,
      (Math.random() - 0.5) * this.shakeIntensity,
      0
    );
    
    this.cameraRig.position.add(this.shakeOffset);
    
    // Decay shake
    this.shakeIntensity *= this.shakeDecay;
    if (this.shakeIntensity < 0.001) {
      this.shakeIntensity = 0;
    }
  }
  
  addCameraShake(intensity) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
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
    
    // Calculate target speed
    let targetSpeed = this.maxSpeed;
    if (this.isSprinting) targetSpeed *= 1.8;
    if (this.isCrouching) targetSpeed *= 0.5;
    
    // Calculate movement direction
    const inputDir = new THREE.Vector3();
    inputDir.z = Number(this.moveForward) - Number(this.moveBackward);
    inputDir.x = Number(this.moveRight) - Number(this.moveLeft);
    inputDir.normalize();
    
    // Get camera-relative directions
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.yawObject.quaternion);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(this.yawObject.quaternion);
    right.y = 0;
    right.normalize();
    
    // Calculate desired velocity
    const desiredVelocity = new THREE.Vector3();
    desiredVelocity.add(forward.multiplyScalar(inputDir.z * targetSpeed));
    desiredVelocity.add(right.multiplyScalar(inputDir.x * targetSpeed));
    
    // Smooth acceleration/deceleration
    this.velocity.lerp(desiredVelocity, this.accelerationRate * delta);
    
    // Apply velocity
    this.yawObject.position.x += this.velocity.x * delta;
    this.yawObject.position.z += this.velocity.z * delta;
    
    // Keep in bounds
    this.yawObject.position.x = Math.max(-19, Math.min(19, this.yawObject.position.x));
    this.yawObject.position.z = Math.max(-19, Math.min(19, this.yawObject.position.z));
    
    // Update cinematic effects
    this.updateHeadBob(delta);
    this.updateCameraShake(delta);
    this.updateFlashlight(delta);
    
    // Sanity-based camera shake
    if (this.game.sanitySystem) {
      const sanity = this.game.sanitySystem.getEffectiveSanity();
      if (sanity < 40) {
        const shakeAmount = (40 - sanity) / 40 * 0.02;
        this.addCameraShake(shakeAmount);
      }
    }
  }
  
  getPosition() {
    return this.yawObject.position.clone();
  }
  
  getRotation() {
    return {
      x: this.camera.rotation.x,
      y: this.yawObject.rotation.y
    };
  }
  
  getForwardDirection() {
    const dir = new THREE.Vector3(0, 0, -1);
    const rot = this.getRotation();
    dir.applyEuler(new THREE.Euler(rot.x, rot.y, 0, 'YXZ'));
    return dir;
  }
}
