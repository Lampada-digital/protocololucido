import * as THREE from 'three';

// Enemy states
const ENEMY_STATE = {
  IDLE: 'IDLE',
  PATROL: 'PATROL',
  ALERT: 'ALERT',
  CHASE: 'CHASE',
  ATTACK: 'ATTACK',
  RETREAT: 'RETREAT'
};

class Enemy {
  constructor(position, game) {
    this.game = game;
    this.mesh = null;
    this.health = 3;
    this.maxHealth = 3;
    this.speed = 0.02;
    this.state = ENEMY_STATE.PATROL;
    
    // Position and movement
    this.position = position.clone();
    this.targetPosition = null;
    this.lastKnownPlayerPos = null;
    
    // AI parameters
    this.detectionRange = 15;
    this.attackRange = 2;
    this.alertTimer = 0;
    this.attackCooldown = 0;
    this.stateTimer = 0;
    
    // Patrol
    this.patrolPoints = [];
    this.currentPatrolIndex = 0;
    this.generatePatrolPoints();
    
    // Communication
    this.alertedAllies = false;
    
    // Visual
    this.createMesh();
  }
  
  createMesh() {
    // Creepy humanoid shape
    const group = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a0a0a,
      roughness: 0.9,
      metalness: 0.1,
      emissive: 0x330000,
      emissiveIntensity: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.75;
    group.add(body);
    
    // Head
    const headGeo = new THREE.SphereGeometry(0.25, 6, 6);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x2a1a1a,
      roughness: 0.8,
      emissive: 0x440000,
      emissiveIntensity: 0.3
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.7;
    group.add(head);
    
    // Eyes (glowing)
    const eyeGeo = new THREE.SphereGeometry(0.05, 4, 4);
    const eyeMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      emissive: 0xff0000
    });
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08, 1.75, -0.2);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08, 1.75, -0.2);
    group.add(rightEye);
    
    // Arms
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 4);
    const armMat = bodyMat.clone();
    
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.4, 1.0, 0);
    leftArm.rotation.z = 0.3;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.4, 1.0, 0);
    rightArm.rotation.z = -0.3;
    group.add(rightArm);
    
    group.position.copy(this.position);
    this.game.scene.add(group);
    this.mesh = group;
    
    // Add to game enemies list
    this.game.enemies.push(this);
  }
  
  generatePatrolPoints() {
    // Generate random patrol points around spawn
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const dist = 5 + Math.random() * 5;
      this.patrolPoints.push(new THREE.Vector3(
        this.position.x + Math.cos(angle) * dist,
        0,
        this.position.z + Math.sin(angle) * dist
      ));
    }
  }
  
  update(delta, playerPosition) {
    this.stateTimer += delta;
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    
    const distToPlayer = this.position.distanceTo(playerPosition);
    
    // State machine
    switch (this.state) {
      case ENEMY_STATE.PATROL:
        this.updatePatrol(delta, playerPosition, distToPlayer);
        break;
      case ENEMY_STATE.ALERT:
        this.updateAlert(delta, playerPosition, distToPlayer);
        break;
      case ENEMY_STATE.CHASE:
        this.updateChase(delta, playerPosition, distToPlayer);
        break;
      case ENEMY_STATE.ATTACK:
        this.updateAttack(delta, playerPosition, distToPlayer);
        break;
      case ENEMY_STATE.RETREAT:
        this.updateRetreat(delta, playerPosition);
        break;
    }
    
    // Update mesh position
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      
      // Look at player when chasing
      if (this.state === ENEMY_STATE.CHASE || this.state === ENEMY_STATE.ATTACK) {
        this.mesh.lookAt(playerPosition.x, this.position.y, playerPosition.z);
      }
      
      // Bobbing animation
      this.mesh.position.y = 0 + Math.sin(Date.now() * 0.003 + this.position.x) * 0.1;
    }
    
    // Radio static effect (proximity to player)
    if (distToPlayer < 10 && this.game.audioSystem) {
      const intensity = 1 - (distToPlayer / 10);
      this.game.audioSystem.updateRadioStatic(intensity);
    }
  }
  
  updatePatrol(delta, playerPosition, distToPlayer) {
    // Check if player is in detection range
    if (distToPlayer < this.detectionRange) {
      this.state = ENEMY_STATE.ALERT;
      this.lastKnownPlayerPos = playerPosition.clone();
      this.alertTimer = 0;
      
      // Alert nearby enemies
      this.alertNearbyEnemies();
      return;
    }
    
    // Move to next patrol point
    if (!this.targetPosition || this.position.distanceTo(this.targetPosition) < 1) {
      this.targetPosition = this.patrolPoints[this.currentPatrolIndex].clone();
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    }
    
    this.moveTowards(this.targetPosition, this.speed * 0.5, delta);
  }
  
  updateAlert(delta, playerPosition, distToPlayer) {
    this.alertTimer += delta;
    
    // Look at last known player position
    if (this.lastKnownPlayerPos) {
      this.moveTowards(this.lastKnownPlayerPos, this.speed * 0.7, delta);
    }
    
    // Transition to chase if player is still visible
    if (distToPlayer < this.detectionRange) {
      this.state = ENEMY_STATE.CHASE;
      this.lastKnownPlayerPos = playerPosition.clone();
    }
    
    // Return to patrol after investigating
    if (this.alertTimer > 5) {
      this.state = ENEMY_STATE.PATROL;
    }
  }
  
  updateChase(delta, playerPosition, distToPlayer) {
    this.lastKnownPlayerPos = playerPosition.clone();
    
    // Move towards player
    this.moveTowards(playerPosition, this.speed, delta);
    
    // Check if in attack range
    if (distToPlayer < this.attackRange) {
      this.state = ENEMY_STATE.ATTACK;
    }
    
    // Check if player escaped
    if (distToPlayer > this.detectionRange * 1.5) {
      this.state = ENEMY_STATE.ALERT;
      this.alertTimer = 0;
    }
    
    // Trigger narrative event on first enemy sighted
    if (this.game.narrativeEngine && !this.game.narrativeEngine.eventTriggers.get('first_enemy_sighted').triggered) {
      this.game.narrativeEngine.triggerEvent('first_enemy_sighted');
    }
    
    // Play chase audio
    if (this.game.audioSystem && Math.random() < 0.01) {
      this.game.audioSystem.playEnemyGroan();
    }
  }
  
  updateAttack(delta, playerPosition, distToPlayer) {
    // Attack player
    if (this.attackCooldown <= 0 && distToPlayer < this.attackRange) {
      this.game.player.takeDamage(15);
      this.attackCooldown = 2; // 2 second cooldown
      
      // Play attack sound
      if (this.game.audioSystem) {
        this.game.audioSystem.playEnemyAttack();
      }
    }
    
    // Return to chase if player moves away
    if (distToPlayer > this.attackRange * 1.5) {
      this.state = ENEMY_STATE.CHASE;
    }
    
    // Retreat if low health
    if (this.health < this.maxHealth * 0.3) {
      this.state = ENEMY_STATE.RETREAT;
    }
  }
  
  updateRetreat(delta, playerPosition) {
    // Move away from player
    const awayDir = new THREE.Vector3()
      .subVectors(this.position, playerPosition)
      .normalize();
    
    const retreatTarget = this.position.clone().add(awayDir.multiplyScalar(5));
    this.moveTowards(retreatTarget, this.speed * 1.2, delta);
    
    // Return to patrol after retreating
    if (this.stateTimer > 3) {
      this.state = ENEMY_STATE.PATROL;
      this.stateTimer = 0;
    }
  }
  
  moveTowards(target, speed, delta) {
    const direction = new THREE.Vector3()
      .subVectors(target, this.position)
      .normalize();
    
    direction.y = 0; // Keep on ground
    
    this.position.add(direction.multiplyScalar(speed * delta * 60));
    
    // Keep in bounds
    this.position.x = Math.max(-18, Math.min(18, this.position.x));
    this.position.z = Math.max(-18, Math.min(18, this.position.z));
  }
  
  alertNearbyEnemies() {
    if (this.alertedAllies) return;
    this.alertedAllies = true;
    
    this.game.enemies.forEach(enemy => {
      if (enemy !== this) {
        const dist = this.position.distanceTo(enemy.position);
        if (dist < 20) {
          enemy.state = ENEMY_STATE.ALERT;
          enemy.lastKnownPlayerPos = this.lastKnownPlayerPos.clone();
          enemy.alertTimer = 0;
        }
      }
    });
  }
  
  takeDamage(amount) {
    this.health -= amount;
    
    // Flash red
    if (this.mesh) {
      this.mesh.traverse(child => {
        if (child.isMesh && child.material) {
          const origColor = child.material.color.clone();
          child.material.emissive.set(0xff0000);
          child.material.emissiveIntensity = 1;
          
          setTimeout(() => {
            if (child.material) {
              child.material.emissive.set(0x330000);
              child.material.emissiveIntensity = 0.2;
            }
          }, 200);
        }
      });
    }
    
    // Play hit sound
    if (this.game.audioSystem) {
      this.game.audioSystem.playEnemyHit();
    }
  }
  
  destroy() {
    if (this.mesh) {
      this.game.scene.remove(this.mesh);
    }
    
    const idx = this.game.enemies.indexOf(this);
    if (idx >= 0) {
      this.game.enemies.splice(idx, 1);
    }
  }
}

export class EnemyAI {
  constructor(game) {
    this.game = game;
    this.maxEnemies = 4;
    this.spawnCooldown = 0;
    this.spawnInterval = 10; // Seconds between spawn attempts
  }
  
  update(delta) {
    const playerPos = this.game.player.getPosition();
    
    // Update all enemies
    this.game.enemies.forEach(enemy => {
      enemy.update(delta, playerPos);
    });
    
    // Spawn management
    this.spawnCooldown -= delta;
    if (this.spawnCooldown <= 0 && this.game.enemies.length < this.maxEnemies) {
      this.trySpawnEnemy();
      this.spawnCooldown = this.spawnInterval;
    }
    
    // Despawn far enemies
    this.despawnFarEnemies(playerPos);
  }
  
  spawnInitialEnemies(count) {
    for (let i = 0; i < count; i++) {
      this.spawnEnemy();
    }
  }
  
  spawnEnemy(position = null) {
    if (this.game.enemies.length >= this.maxEnemies) return null;
    
    let spawnPos;
    if (position) {
      spawnPos = position.clone();
    } else {
      // Spawn outside player view
      const playerPos = this.game.player.getPosition();
      const angle = Math.random() * Math.PI * 2;
      const dist = 15 + Math.random() * 5;
      
      spawnPos = new THREE.Vector3(
        playerPos.x + Math.cos(angle) * dist,
        0,
        playerPos.z + Math.sin(angle) * dist
      );
      
      // Keep in bounds
      spawnPos.x = Math.max(-18, Math.min(18, spawnPos.x));
      spawnPos.z = Math.max(-18, Math.min(18, spawnPos.z));
    }
    
    const enemy = new Enemy(spawnPos, this.game);
    
    // Play spawn sound
    if (this.game.audioSystem) {
      this.game.audioSystem.playEnemySpawn();
    }
    
    return enemy;
  }
  
  spawnEnemyNearPlayer() {
    // Spawn close to player (triggered by scream)
    const playerPos = this.game.player.getPosition();
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 3;
    
    const spawnPos = new THREE.Vector3(
      playerPos.x + Math.cos(angle) * dist,
      0,
      playerPos.z + Math.sin(angle) * dist
    );
    
    spawnPos.x = Math.max(-18, Math.min(18, spawnPos.x));
    spawnPos.z = Math.max(-18, Math.min(18, spawnPos.z));
    
    this.spawnEnemy(spawnPos);
  }
  
  trySpawnEnemy() {
    // Only spawn if player can't see the spawn point
    const playerPos = this.game.player.getPosition();
    const playerRot = this.game.player.getRotation();
    
    // Try multiple spawn locations
    for (let attempt = 0; attempt < 5; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 15 + Math.random() * 5;
      
      const spawnPos = new THREE.Vector3(
        playerPos.x + Math.cos(angle) * dist,
        0,
        playerPos.z + Math.sin(angle) * dist
      );
      
      spawnPos.x = Math.max(-18, Math.min(18, spawnPos.x));
      spawnPos.z = Math.max(-18, Math.min(18, spawnPos.z));
      
      // Check if spawn is behind player or around corners
      const toSpawn = new THREE.Vector3().subVectors(spawnPos, playerPos).normalize();
      const playerForward = new THREE.Vector3(0, 0, -1);
      playerForward.applyEuler(new THREE.Euler(playerRot.x, playerRot.y, 0, 'YXZ'));
      
      const dot = toSpawn.dot(playerForward);
      
      // Spawn if behind player (dot < 0) or to the side
      if (dot < 0.5) {
        this.spawnEnemy(spawnPos);
        return;
      }
    }
  }
  
  despawnFarEnemies(playerPos) {
    const despawnDist = 30;
    
    this.game.enemies.forEach(enemy => {
      const dist = enemy.position.distanceTo(playerPos);
      if (dist > despawnDist) {
        enemy.destroy();
      }
    });
  }
  
  removeEnemy(enemy) {
    enemy.destroy();
    
    // Respawn after delay
    setTimeout(() => {
      if (this.game.isRunning) {
        this.spawnEnemy();
      }
    }, 8000 + Math.random() * 7000);
  }
}
