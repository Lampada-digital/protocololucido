import * as THREE from 'three';

export class HallucinationSystem {
  constructor(game) {
    this.game = game;
    this.hallucinations = [];
    this.jumpScareCooldown = 0;
    this.jumpScareInterval = 300; // 5 minutes in seconds
    
    // Hallucination types
    this.types = {
      corpse: this.spawnCorpse.bind(this),
      figure: this.spawnPeripheralFigure.bind(this),
      wallText: this.spawnWallText.bind(this),
      phoneRing: this.spawnPhoneRing.bind(this),
      shadow: this.spawnShadow.bind(this),
      fakeEnemy: this.spawnFakeEnemy.bind(this)
    };
  }
  
  update(delta) {
    this.jumpScareCooldown = Math.max(0, this.jumpScareCooldown - delta);
    
    // Update existing hallucinations
    this.hallucinations.forEach(halluc => {
      if (halluc.update) {
        halluc.update(delta);
      }
    });
    
    // Remove expired hallucinations
    this.hallucinations = this.hallucinations.filter(h => !h.expired);
    
    // Random hallucination spawns based on sanity
    const sanity = this.game.sanitySystem.getEffectiveSanity();
    if (sanity < 50 && Math.random() < 0.001) {
      this.triggerRandomHallucination();
    }
  }
  
  triggerRandomHallucination() {
    const types = Object.keys(this.types);
    const type = types[Math.floor(Math.random() * types.length)];
    this.spawnHallucination(type, 1);
  }
  
  spawnHallucination(type, intensity) {
    if (this.types[type]) {
      this.types[type](intensity);
    }
  }
  
  spawnCorpse(intensity) {
    const playerPos = this.game.player.getPosition();
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 5;
    
    const pos = new THREE.Vector3(
      playerPos.x + Math.cos(angle) * dist,
      0,
      playerPos.z + Math.sin(angle) * dist
    );
    
    // Create corpse mesh
    const group = new THREE.Group();
    
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2a1a1a,
      transparent: true,
      opacity: 0.7
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.3;
    group.add(body);
    
    group.position.copy(pos);
    this.game.scene.add(group);
    
    const halluc = {
      mesh: group,
      type: 'corpse',
      lifetime: 5,
      age: 0,
      expired: false,
      update: (delta) => {
        this.age += delta;
        
        // Disappear when looked at directly
        const toCorpse = new THREE.Vector3().subVectors(pos, playerPos).normalize();
        const playerForward = new THREE.Vector3(0, 0, -1);
        const playerRot = this.game.player.getRotation();
        playerForward.applyEuler(new THREE.Euler(playerRot.x, playerRot.y, 0, 'YXZ'));
        
        const dot = toCorpse.dot(playerForward);
        if (dot > 0.9) {
          // Looking directly at it
          bodyMat.opacity -= delta * 2;
          if (bodyMat.opacity <= 0) {
            this.expired = true;
          }
        }
        
        if (this.age > this.lifetime) {
          this.expired = true;
        }
      },
      cleanup: () => {
        this.game.scene.remove(group);
      }
    };
    
    this.hallucinations.push(halluc);
  }
  
  spawnPeripheralFigure(intensity) {
    const playerPos = this.game.player.getPosition();
    const playerRot = this.game.player.getRotation();
    
    // Spawn at edge of vision
    const side = Math.random() > 0.5 ? 1 : -1;
    const angle = playerRot.y + (side * Math.PI / 3);
    const dist = 8;
    
    const pos = new THREE.Vector3(
      playerPos.x + Math.cos(angle) * dist,
      1.5,
      playerPos.z + Math.sin(angle) * dist
    );
    
    // Tall shadowy figure
    const geo = new THREE.CylinderGeometry(0.2, 0.3, 2, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.game.scene.add(mesh);
    
    const halluc = {
      mesh,
      type: 'figure',
      lifetime: 3,
      age: 0,
      expired: false,
      update: (delta) => {
        this.age += delta;
        
        // Fade out over time
        mat.opacity = 0.5 * (1 - this.age / this.lifetime);
        
        if (this.age > this.lifetime) {
          this.expired = true;
        }
      },
      cleanup: () => {
        this.game.scene.remove(mesh);
      }
    };
    
    this.hallucinations.push(halluc);
  }
  
  spawnWallText(intensity) {
    // This would require text rendering - simplified version
    // In production, use troika-three-text or similar
    
    const messages = ['GET OUT', 'HELP ME', 'DIE', 'BEHIND YOU', 'RUN'];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    // Show as UI notification instead
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Special Elite', cursive;
      font-size: 3rem;
      color: #8b0000;
      text-shadow: 0 0 20px rgba(139, 0, 0, 0.8);
      opacity: 0;
      animation: textFade 3s ease-in-out forwards;
      pointer-events: none;
      z-index: 50;
    `;
    notification.textContent = message;
    document.getElementById('react-root').appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }
  
  spawnPhoneRing(intensity) {
    // Play phone ringing sound from random location
    if (this.game.audioSystem) {
      this.game.audioSystem.playPhoneRing();
    }
  }
  
  spawnShadow(intensity) {
    // Quick shadow flash across screen
    const shadow = document.createElement('div');
    shadow.style.cssText = `
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(0,0,0,0.8), transparent);
      animation: shadowPass 0.5s linear forwards;
      pointer-events: none;
      z-index: 40;
    `;
    document.getElementById('react-root').appendChild(shadow);
    
    setTimeout(() => shadow.remove(), 500);
  }
  
  spawnFakeEnemy(intensity) {
    // Spawn enemy that disappears when approached
    const playerPos = this.game.player.getPosition();
    const angle = Math.random() * Math.PI * 2;
    const dist = 10;
    
    const pos = new THREE.Vector3(
      playerPos.x + Math.cos(angle) * dist,
      0,
      playerPos.z + Math.sin(angle) * dist
    );
    
    // Simple enemy shape
    const group = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a0a0a,
      transparent: true,
      opacity: 0.6
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.75;
    group.add(body);
    
    group.position.copy(pos);
    this.game.scene.add(group);
    
    const halluc = {
      mesh: group,
      type: 'fakeEnemy',
      lifetime: 10,
      age: 0,
      expired: false,
      update: (delta) => {
        this.age += delta;
        
        const distToPlayer = pos.distanceTo(playerPos);
        
        // Disappear when player gets close
        if (distToPlayer < 5) {
          bodyMat.opacity -= delta * 3;
          if (bodyMat.opacity <= 0) {
            this.expired = true;
          }
        }
        
        if (this.age > this.lifetime) {
          this.expired = true;
        }
      },
      cleanup: () => {
        this.game.scene.remove(group);
      }
    };
    
    this.hallucinations.push(halluc);
  }
  
  triggerJumpScare() {
    if (this.jumpScareCooldown > 0) return;
    
    this.jumpScareCooldown = this.jumpScareInterval;
    
    // Spawn enemy right in front of player
    const playerPos = this.game.player.getPosition();
    const playerRot = this.game.player.getRotation();
    
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(new THREE.Euler(0, playerRot.y, 0, 'YXZ'));
    
    const spawnPos = playerPos.clone().add(forward.multiplyScalar(2));
    
    // Create scary enemy
    const group = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.5, 2, 6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x330000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1;
    group.add(body);
    
    group.position.copy(spawnPos);
    this.game.scene.add(group);
    
    // Trigger jump scare effect
    this.game.triggerJumpScare();
    
    // Remove after 2 seconds
    setTimeout(() => {
      this.game.scene.remove(group);
    }, 2000);
  }
}
