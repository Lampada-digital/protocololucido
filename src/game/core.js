import * as THREE from 'three';
import { Player } from './player.js';
import { SanitySystem } from './sanitySystem.js';
import { AudioSystem } from './audioSystem.js';

// PS1-style vertex shader with vertex snapping
const ps1VertexShader = `
  uniform float u_snapResolution;
  uniform float u_jitterIntensity;
  uniform float u_time;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vFogDepth;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vFogDepth = -mvPosition.z;
    
    vec4 projected = projectionMatrix * mvPosition;
    
    // Vertex snapping (PS1 had no sub-pixel precision)
    float snap = u_snapResolution;
    projected.xyz = floor(projected.xyz * snap / projected.w) * projected.w / snap;
    
    // Sanity-based vertex jitter
    float jitter = u_jitterIntensity * 0.015;
    projected.x += sin(u_time * 12.0 + position.y * 5.0) * jitter;
    projected.y += cos(u_time * 9.0 + position.x * 4.0) * jitter;
    
    gl_Position = projected;
  }
`;

// PS1-style fragment shader with affine texturing and dithering
const ps1FragmentShader = `
  uniform sampler2D u_texture;
  uniform float u_time;
  uniform float u_textureSwim;
  uniform float u_colorShift;
  uniform float u_ditherStrength;
  uniform vec3 u_fogColor;
  uniform float u_fogNear;
  uniform float u_fogFar;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vFogDepth;
  
  // 4x4 Bayer dithering matrix
  const mat4 bayerMatrix = mat4(
     0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
    12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
     3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
    15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
  );
  
  void main() {
    // Affine texture mapping (no perspective correction)
    vec2 uv = vUv;
    float swim = u_textureSwim * 0.008;
    uv.x += sin(u_time * 2.0 + vUv.y * 3.0) * swim;
    uv.y += cos(u_time * 1.5 + vUv.x * 2.0) * swim;
    
    // Low-res texture sampling
    vec2 texRes = vec2(64.0);
    uv = floor(uv * texRes) / texRes;
    
    vec4 texColor = texture2D(u_texture, uv);
    
    // Simple directional lighting
    vec3 lightDir = normalize(vec3(0.3, 1.0, 0.5));
    float diffuse = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.12;
    vec3 lit = texColor.rgb * (ambient + diffuse * 0.5);
    
    // Color quantization (15-bit color like PS1)
    float levels = 24.0;
    lit = floor(lit * levels) / levels;
    
    // Sanity color shift
    lit.r += sin(u_time * 0.5) * u_colorShift * 0.15;
    lit.b += cos(u_time * 0.7) * u_colorShift * 0.1;
    
    // Ordered dithering
    ivec2 pixel = ivec2(mod(gl_FragCoord.xy, 4.0));
    float threshold = bayerMatrix[pixel.x][pixel.y];
    float dither = (threshold - 0.5) * u_ditherStrength;
    lit += dither;
    
    // Fog
    float fogFactor = smoothstep(u_fogNear, u_fogFar, vFogDepth);
    lit = mix(lit, u_fogColor, fogFactor);
    
    gl_FragColor = vec4(lit, texColor.a);
  }
`;

export class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.player = null;
    this.sanitySystem = null;
    this.audioSystem = null;
    this.enemies = [];
    this.hallucinations = [];
    this.ps1Materials = [];
    this.isRunning = false;
    
    // PS1 shader uniforms (shared reference)
    this.ps1Uniforms = {
      u_snapResolution: { value: 150.0 },
      u_jitterIntensity: { value: 0.0 },
      u_time: { value: 0.0 },
      u_texture: { value: null },
      u_textureSwim: { value: 0.0 },
      u_colorShift: { value: 0.0 },
      u_ditherStrength: { value: 0.04 },
      u_fogColor: { value: new THREE.Color(0x050510) },
      u_fogNear: { value: 8.0 },
      u_fogFar: { value: 35.0 }
    };
    
    this.init();
  }
  
  init() {
    const canvas = document.getElementById('game-canvas');
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // PS1 had no AA
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = false; // Performance
    this.renderer.setClearColor(0x050510);
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x050510, 8, 35);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    
    // Lighting (dim, horror atmosphere)
    const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
    this.scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xff4444, 0.8, 15);
    pointLight.position.set(0, 3, 0);
    this.scene.add(pointLight);
    this.mainLight = pointLight;
    
    // Secondary eerie light
    const pointLight2 = new THREE.PointLight(0x4400ff, 0.4, 20);
    pointLight2.position.set(-5, 2, -5);
    this.scene.add(pointLight2);
    
    // Build environment
    this.buildEnvironment();
    
    // Initialize systems
    this.player = new Player(this.camera, this.scene, this);
    this.sanitySystem = new SanitySystem(this);
    this.audioSystem = new AudioSystem(this);
    
    // Spawn initial enemies
    this.spawnEnemies(3);
    
    // Event listeners
    window.addEventListener('resize', () => this.onResize());
    
    // Start game loop
    this.isRunning = true;
    this.animate();
    
    // Expose game state for React HUD
    window.gameState = {
      sanity: 100,
      health: 100,
      ammo: 30,
      maxAmmo: 30,
      enemyCount: this.enemies.length,
      isMicActive: false,
      fearLevel: 0
    };
  }
  
  buildEnvironment() {
    // Create procedural textures
    const wallTexture = this.createProceduralTexture('wall');
    const floorTexture = this.createProceduralTexture('floor');
    const ceilingTexture = this.createProceduralTexture('ceiling');
    
    // Floor
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = this.createPS1Material(floorTexture);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);
    
    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(40, 40);
    const ceilingMat = this.createPS1Material(ceilingTexture);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4;
    this.scene.add(ceiling);
    
    // Walls (corridor-like environment)
    const wallMat = this.createPS1Material(wallTexture);
    
    // Create maze-like corridors
    const wallPositions = [
      { pos: [0, 2, -20], size: [40, 4, 0.5], rot: [0, 0, 0] },
      { pos: [0, 2, 20], size: [40, 4, 0.5], rot: [0, 0, 0] },
      { pos: [-20, 2, 0], size: [0.5, 4, 40], rot: [0, 0, 0] },
      { pos: [20, 2, 0], size: [0.5, 4, 40], rot: [0, 0, 0] },
      // Internal walls for maze
      { pos: [-8, 2, -5], size: [0.5, 4, 10], rot: [0, 0, 0] },
      { pos: [8, 2, 5], size: [0.5, 4, 10], rot: [0, 0, 0] },
      { pos: [0, 2, -10], size: [12, 4, 0.5], rot: [0, 0, 0] },
      { pos: [-5, 2, 8], size: [10, 4, 0.5], rot: [0, 0, 0] },
      { pos: [12, 2, -8], size: [0.5, 4, 8], rot: [0, 0, 0] },
      { pos: [-12, 2, 12], size: [8, 4, 0.5], rot: [0, 0, 0] },
    ];
    
    wallPositions.forEach(w => {
      const geo = new THREE.BoxGeometry(w.size[0], w.size[1], w.size[2]);
      const mesh = new THREE.Mesh(geo, wallMat.clone());
      mesh.position.set(w.pos[0], w.pos[1], w.pos[2]);
      mesh.rotation.set(w.rot[0], w.rot[1], w.rot[2]);
      this.scene.add(mesh);
      this.ps1Materials.push(mesh.material);
    });
    
    // Add some creepy props
    this.addProps();
  }
  
  addProps() {
    // Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 6); // Low-poly
    const pillarMat = this.createPS1Material(this.createProceduralTexture('stone'));
    
    const pillarPositions = [
      [-5, 2, -5], [5, 2, -5], [-5, 2, 5], [5, 2, 5],
      [-15, 2, -15], [15, 2, -15], [-15, 2, 15], [15, 2, 15]
    ];
    
    pillarPositions.forEach(pos => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat.clone());
      pillar.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(pillar);
      this.ps1Materials.push(pillar.material);
    });
  }
  
  createProceduralTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    switch (type) {
      case 'wall':
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 64, 64);
        // Brick pattern
        for (let y = 0; y < 64; y += 8) {
          for (let x = 0; x < 64; x += 16) {
            const offset = (y / 8) % 2 === 0 ? 0 : 8;
            ctx.fillStyle = `rgb(${20 + Math.random() * 15}, ${15 + Math.random() * 10}, ${30 + Math.random() * 15})`;
            ctx.fillRect(x + offset, y, 14, 6);
          }
        }
        // Add grime
        for (let i = 0; i < 50; i++) {
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
          ctx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
        }
        break;
        
      case 'floor':
        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(0, 0, 64, 64);
        // Tile pattern
        for (let y = 0; y < 64; y += 16) {
          for (let x = 0; x < 64; x += 16) {
            ctx.fillStyle = `rgb(${10 + Math.random() * 8}, ${8 + Math.random() * 6}, ${15 + Math.random() * 10})`;
            ctx.fillRect(x + 1, y + 1, 14, 14);
          }
        }
        // Blood stains
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = `rgba(80, 0, 0, ${0.2 + Math.random() * 0.3})`;
          ctx.beginPath();
          ctx.arc(Math.random() * 64, Math.random() * 64, 2 + Math.random() * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
        
      case 'ceiling':
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, 64, 64);
        for (let i = 0; i < 100; i++) {
          ctx.fillStyle = `rgba(${Math.random() * 20}, ${Math.random() * 10}, ${Math.random() * 30}, 0.5)`;
          ctx.fillRect(Math.random() * 64, Math.random() * 64, 1 + Math.random() * 3, 1 + Math.random() * 3);
        }
        break;
        
      case 'stone':
        ctx.fillStyle = '#1a1a25';
        ctx.fillRect(0, 0, 64, 64);
        for (let i = 0; i < 200; i++) {
          const shade = 15 + Math.random() * 20;
          ctx.fillStyle = `rgb(${shade}, ${shade - 3}, ${shade + 5})`;
          ctx.fillRect(Math.random() * 64, Math.random() * 64, 1 + Math.random() * 2, 1 + Math.random() * 2);
        }
        break;
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter; // PS1 nearest-neighbor
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    this.ps1Uniforms.u_texture.value = texture;
    
    return texture;
  }
  
  createPS1Material(texture) {
    const material = new THREE.ShaderMaterial({
      vertexShader: ps1VertexShader,
      fragmentShader: ps1FragmentShader,
      uniforms: {
        u_snapResolution: { value: 150.0 },
        u_jitterIntensity: { value: 0.0 },
        u_time: { value: 0.0 },
        u_texture: { value: texture },
        u_textureSwim: { value: 0.0 },
        u_colorShift: { value: 0.0 },
        u_ditherStrength: { value: 0.04 },
        u_fogColor: { value: new THREE.Color(0x050510) },
        u_fogNear: { value: 8.0 },
        u_fogFar: { value: 35.0 }
      }
    });
    
    this.ps1Materials.push(material);
    return material;
  }
  
  spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
      this.spawnEnemy();
    }
  }
  
  spawnEnemy(position = null) {
    // Low-poly nightmare creature
    const bodyGeo = new THREE.ConeGeometry(0.4, 1.5, 5);
    const headGeo = new THREE.SphereGeometry(0.3, 4, 4);
    
    const enemyMat = new THREE.MeshBasicMaterial({
      color: 0x330011,
      wireframe: false
    });
    
    const body = new THREE.Mesh(bodyGeo, enemyMat);
    const head = new THREE.Mesh(headGeo, enemyMat.clone());
    head.position.y = 1.0;
    
    const enemy = new THREE.Group();
    enemy.add(body);
    enemy.add(head);
    
    // Position
    if (position) {
      enemy.position.copy(position);
    } else {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 10;
      enemy.position.set(
        Math.cos(angle) * dist,
        0.75,
        Math.sin(angle) * dist
      );
    }
    
    enemy.userData = {
      speed: 0.01 + Math.random() * 0.015,
      health: 3,
      isHallucination: false,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: 0
    };
    
    this.scene.add(enemy);
    this.enemies.push(enemy);
    
    if (window.gameState) {
      window.gameState.enemyCount = this.enemies.length;
    }
    
    return enemy;
  }
  
  spawnHallucination(position) {
    const hallucination = this.spawnEnemy(position);
    hallucination.userData.isHallucination = true;
    hallucination.userData.lifetime = 5000 + Math.random() * 5000;
    hallucination.userData.spawnTime = Date.now();
    
    // Make it flicker
    hallucination.traverse(child => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
      }
    });
    
    this.hallucinations.push(hallucination);
    return hallucination;
  }
  
  removeEnemy(enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx >= 0) this.enemies.splice(idx, 1);
    
    const hIdx = this.hallucinations.indexOf(enemy);
    if (hIdx >= 0) this.hallucinations.splice(hIdx, 1);
    
    this.scene.remove(enemy);
    
    if (window.gameState) {
      window.gameState.enemyCount = this.enemies.length;
    }
  }
  
  updateEnemies(delta) {
    const playerPos = this.camera.position;
    
    this.enemies.forEach(enemy => {
      const dist = enemy.position.distanceTo(playerPos);
      
      // Hallucination lifetime
      if (enemy.userData.isHallucination) {
        const age = Date.now() - enemy.userData.spawnTime;
        if (age > enemy.userData.lifetime) {
          this.removeEnemy(enemy);
          return;
        }
        // Flicker effect
        const flicker = Math.sin(age * 0.01) * 0.3 + 0.7;
        enemy.traverse(child => {
          if (child.isMesh) {
            child.material.opacity = flicker;
          }
        });
      }
      
      // Movement AI
      if (dist < 20) {
        // Chase player if close
        const dir = new THREE.Vector3()
          .subVectors(playerPos, enemy.position)
          .normalize();
        dir.y = 0;
        
        enemy.position.add(dir.multiplyScalar(enemy.userData.speed * delta * 60));
        enemy.lookAt(playerPos.x, enemy.position.y, playerPos.z);
      } else {
        // Wander
        enemy.userData.wanderTimer += delta;
        if (enemy.userData.wanderTimer > 2 + Math.random() * 3) {
          enemy.userData.wanderAngle += (Math.random() - 0.5) * 2;
          enemy.userData.wanderTimer = 0;
        }
        
        const wanderDir = new THREE.Vector3(
          Math.cos(enemy.userData.wanderAngle),
          0,
          Math.sin(enemy.userData.wanderAngle)
        );
        enemy.position.add(wanderDir.multiplyScalar(enemy.userData.speed * 0.5 * delta * 60));
      }
      
      // Keep in bounds
      enemy.position.x = Math.max(-19, Math.min(19, enemy.position.x));
      enemy.position.z = Math.max(-19, Math.min(19, enemy.position.z));
      
      // Proximity sanity drain
      if (dist < 5) {
        this.sanitySystem.addProximityDrain(1 - dist / 5);
      }
      
      // Bobbing animation
      enemy.position.y = 0.75 + Math.sin(Date.now() * 0.003 + enemy.id) * 0.1;
    });
  }
  
  updatePS1Effects(sanityEffects) {
    this.ps1Materials.forEach(mat => {
      if (mat.uniforms) {
        mat.uniforms.u_jitterIntensity.value = sanityEffects.vertexJitter;
        mat.uniforms.u_textureSwim.value = sanityEffects.textureSwim;
        mat.uniforms.u_colorShift.value = sanityEffects.colorShift;
        mat.uniforms.u_time.value = this.clock.elapsedTime;
      }
    });
    
    // Update fog based on sanity
    const fogDensity = 1 - (sanityEffects.vignette * 0.5);
    this.scene.fog.far = 35 * fogDensity;
    
    // Main light flickers with low sanity
    if (this.mainLight) {
      const flicker = sanityEffects.vignette > 0.3 
        ? 0.5 + Math.random() * 0.5 
        : 0.8;
      this.mainLight.intensity = flicker;
    }
  }
  
  animate() {
    if (!this.isRunning) return;
    
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    
    // Update systems
    this.player.update(delta);
    this.sanitySystem.update(delta);
    this.updateEnemies(delta);
    
    // Update PS1 shader effects based on sanity
    const sanityEffects = this.sanitySystem.getEffects();
    this.updatePS1Effects(sanityEffects);
    
    // Update React HUD state
    if (window.gameState) {
      window.gameState.sanity = this.sanitySystem.getEffectiveSanity();
      window.gameState.health = this.player.health;
      window.gameState.ammo = this.player.ammo;
      window.gameState.fearLevel = this.audioSystem.getFearLevel();
      window.gameState.isMicActive = this.audioSystem.isActive;
      
      // Dispatch event for React
      window.dispatchEvent(new CustomEvent('gameStateUpdate', {
        detail: { ...window.gameState }
      }));
    }
    
    // Render
    this.renderer.render(this.scene, this.camera);
  }
  
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  // Called by player when shooting
  onShoot(raycaster) {
    const intersects = raycaster.intersectObjects(
      this.enemies.map(e => e.children).flat(),
      false
    );
    
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const enemy = hit.parent;
      
      if (enemy && enemy.userData) {
        enemy.userData.health--;
        
        // Flash red
        enemy.traverse(child => {
          if (child.isMesh) {
            const origColor = child.material.color.clone();
            child.material.color.set(0xff0000);
            setTimeout(() => {
              if (child.material) child.material.color.copy(origColor);
            }, 100);
          }
        });
        
        if (enemy.userData.health <= 0) {
          this.removeEnemy(enemy);
          
          // Spawn new enemy after delay
          setTimeout(() => {
            if (this.isRunning) this.spawnEnemy();
          }, 5000 + Math.random() * 10000);
        }
      }
    }
  }
  
  // Called by audio system on scream
  onScream(intensity) {
    this.sanitySystem.onFearSpike(intensity);
    
    // Spawn enemy near player
    const playerPos = this.camera.position.clone();
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 5;
    const spawnPos = new THREE.Vector3(
      playerPos.x + Math.cos(angle) * dist,
      0.75,
      playerPos.z + Math.sin(angle) * dist
    );
    
    // Keep in bounds
    spawnPos.x = Math.max(-18, Math.min(18, spawnPos.x));
    spawnPos.z = Math.max(-18, Math.min(18, spawnPos.z));
    
    this.spawnEnemy(spawnPos);
  }
  
  // Trigger a hallucination (from server or local)
  triggerHallucination(type, intensity) {
    const playerPos = this.camera.position.clone();
    const angle = Math.random() * Math.PI * 2;
    const dist = 3 + Math.random() * 6;
    const pos = new THREE.Vector3(
      playerPos.x + Math.cos(angle) * dist,
      0.75,
      playerPos.z + Math.sin(angle) * dist
    );
    
    pos.x = Math.max(-18, Math.min(18, pos.x));
    pos.z = Math.max(-18, Math.min(18, pos.z));
    
    this.spawnHallucination(pos);
  }
}

export function initGame() {
  return new Game();
}
