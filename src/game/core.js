import * as THREE from 'three';
import { CinematicCamera } from '../core/CinematicCamera.js';
import { SanitySystem } from './sanitySystem.js';
import { AdvancedAudio } from '../systems/AdvancedAudio.js';
import { NarrativeEngine } from '../systems/NarrativeEngine.js';
import { EnemyAI } from './enemyAI.js';
import { InventorySystem } from './inventory.js';
import { HallucinationSystem } from './hallucinations.js';
import { EnvironmentBuilder } from './environment.js';

// PS1-style shaders with enhanced horror effects
const ps1VertexShader = `
  uniform float u_snapResolution;
  uniform float u_jitterIntensity;
  uniform float u_time;
  uniform float u_otherworldIntensity;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vFogDepth;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    
    vec4 mvPosition = viewMatrix * worldPos;
    vFogDepth = -mvPosition.z;
    
    vec4 projected = projectionMatrix * mvPosition;
    
    // Vertex snapping (PS1 style)
    float snap = u_snapResolution;
    projected.xyz = floor(projected.xyz * snap / projected.w) * projected.w / snap;
    
    // Sanity-based vertex jitter
    float jitter = u_jitterIntensity * 0.02;
    projected.x += sin(u_time * 12.0 + position.y * 5.0) * jitter;
    projected.y += cos(u_time * 9.0 + position.x * 4.0) * jitter;
    
    // Otherworld distortion
    if (u_otherworldIntensity > 0.0) {
      projected.x += sin(u_time * 3.0 + position.x * 2.0) * u_otherworldIntensity * 0.05;
      projected.y += cos(u_time * 2.5 + position.z * 2.0) * u_otherworldIntensity * 0.05;
    }
    
    gl_Position = projected;
  }
`;

const ps1FragmentShader = `
  uniform sampler2D u_texture;
  uniform float u_time;
  uniform float u_textureSwim;
  uniform float u_colorShift;
  uniform float u_ditherStrength;
  uniform vec3 u_fogColor;
  uniform float u_fogNear;
  uniform float u_fogFar;
  uniform float u_otherworldIntensity;
  uniform vec3 u_flashlightDir;
  uniform vec3 u_flashlightPos;
  uniform float u_flashlightIntensity;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vFogDepth;
  
  const mat4 bayerMatrix = mat4(
     0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
    12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
     3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
    15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
  );
  
  void main() {
    // Affine texture mapping
    vec2 uv = vUv;
    float swim = u_textureSwim * 0.01;
    uv.x += sin(u_time * 2.0 + vUv.y * 3.0) * swim;
    uv.y += cos(u_time * 1.5 + vUv.x * 2.0) * swim;
    
    // Low-res texture sampling
    vec2 texRes = vec2(64.0);
    uv = floor(uv * texRes) / texRes;
    
    vec4 texColor = texture2D(u_texture, uv);
    
    // Lighting calculation - balanced for horror readability
    vec3 lightDir = normalize(vec3(0.3, 1.0, 0.5));
    float diffuse = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.35; // Increased for base visibility
    
    // Flashlight cone lighting
    vec3 toFragment = vWorldPos - u_flashlightPos;
    float dist = length(toFragment);
    vec3 fragDir = normalize(toFragment);
    float angle = dot(fragDir, u_flashlightDir);
    
    float flashlight = 0.0;
    if (angle > 0.7 && dist < 20.0) { // 45-degree cone
      flashlight = smoothstep(0.7, 0.9, angle) * (1.0 - dist / 20.0);
      flashlight *= u_flashlightIntensity;
    }
    
    vec3 lit = texColor.rgb * (ambient + diffuse * 0.5 + flashlight * 1.2);
    
    // Color quantization (15-bit color)
    float levels = 24.0;
    lit = floor(lit * levels) / levels;
    
    // Sanity color shift
    lit.r += sin(u_time * 0.5) * u_colorShift * 0.15;
    lit.b += cos(u_time * 0.7) * u_colorShift * 0.1;
    
    // Otherworld red tint
    if (u_otherworldIntensity > 0.0) {
      lit.r += u_otherworldIntensity * 0.3;
      lit.g *= 1.0 - u_otherworldIntensity * 0.5;
      lit.b *= 1.0 - u_otherworldIntensity * 0.5;
    }
    
    // Ordered dithering
    ivec2 pixel = ivec2(mod(gl_FragCoord.xy, 4.0));
    float threshold = bayerMatrix[pixel.x][pixel.y];
    float dither = (threshold - 0.5) * u_ditherStrength;
    lit += dither;
    
    // Controlled fog - readable darkness with depth
    float fogFactor = 1.0 - exp(-vFogDepth * 0.03);
    fogFactor = clamp(fogFactor, 0.0, 0.85); // Never fully opaque
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
    
    // Systems
    this.player = null;
    this.sanitySystem = null;
    this.audioSystem = null;
    this.enemyAI = null;
    this.inventorySystem = null;
    this.hallucinationSystem = null;
    this.environmentBuilder = null;
    
    // Game state
    this.enemies = [];
    this.hallucinations = [];
    this.ps1Materials = [];
    this.isRunning = false;
    this.isOtherworld = false;
    this.otherworldTransition = 0;
    
    // Flashlight
    this.flashlight = null;
    this.flashlightBattery = 100;
    this.flashlightOn = false;
    
    // Lighting
    this.ambientLight = null;
    this.emergencyLights = [];
    this.flickeringLights = [];
    
    // PS1 shaders (accessible by EnvironmentBuilder)
    this.ps1VertexShader = ps1VertexShader;
    this.ps1FragmentShader = ps1FragmentShader;
    
    // PS1 shader uniforms
    this.ps1Uniforms = {
      u_snapResolution: { value: 150.0 },
      u_jitterIntensity: { value: 0.0 },
      u_time: { value: 0.0 },
      u_texture: { value: null },
      u_textureSwim: { value: 0.0 },
      u_colorShift: { value: 0.0 },
      u_ditherStrength: { value: 0.04 },
      u_fogColor: { value: new THREE.Color(0x1a1a1a) },
      u_fogNear: { value: 5.0 },
      u_fogFar: { value: 25.0 },
      u_otherworldIntensity: { value: 0.0 },
      u_flashlightDir: { value: new THREE.Vector3(0, 0, -1) },
      u_flashlightPos: { value: new THREE.Vector3(0, 0, 0) },
      u_flashlightIntensity: { value: 0.0 }
    };
    
    this.init();
  }
  
  init() {
    console.log('[Game] Initializing...');
    const canvas = document.getElementById('game-canvas');
    
    if (!canvas) {
      console.error('[Game] Canvas not found!');
      return;
    }
    
    // Renderer with horror-optimized settings
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance'
    });
    console.log('[Game] Renderer created');
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap; // Performance
    this.renderer.shadowMap.autoUpdate = false; // Manual updates
    this.renderer.setClearColor(0x080810);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0; // Balanced exposure - dark but readable
    
    // Scene with controlled fog - readable darkness
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a12, 0.035); // Reduced density for visibility
    
    // Initialization protection
    this.isInitialized = false;
    this.initTimer = 0;
    this.INVULNERABILITY_TIME = 5; // 5 seconds of safety
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    
    // Lighting setup
    this.setupLighting();
    console.log('[Game] Lighting setup complete');
    
    // Build environment - Laboratory facility
    try {
      this.environmentBuilder = new EnvironmentBuilder(this);
      this.environmentBuilder.buildLaboratory();
      console.log('[Game] Environment built successfully');
    } catch (error) {
      console.error('[Game] Failed to build environment:', error);
    }
    
    // Initialize systems
    try {
      this.player = new CinematicCamera(this.camera, this.scene, this);
      console.log('[Game] Player initialized');
      this.sanitySystem = new SanitySystem(this);
      console.log('[Game] Sanity system initialized');
      this.audioSystem = new AdvancedAudio(this);
      console.log('[Game] Audio system initialized');
      this.narrativeEngine = new NarrativeEngine(this);
      console.log('[Game] Narrative engine initialized');
      this.enemyAI = new EnemyAI(this);
      console.log('[Game] Enemy AI initialized');
      this.inventorySystem = new InventorySystem(this);
      console.log('[Game] Inventory system initialized');
      this.hallucinationSystem = new HallucinationSystem(this);
      console.log('[Game] Hallucination system initialized');
    } catch (error) {
      console.error('[Game] Failed to initialize systems:', error);
    }
    
    // Spawn initial enemies - delayed to prevent immediate combat
    setTimeout(() => {
      if (this.isRunning) {
        this.enemyAI.spawnInitialEnemies(2);
      }
    }, 8000); // 8 second grace period
    
    // Event listeners
    window.addEventListener('resize', () => this.onResize());
    
    // Start game loop
    this.isRunning = true;
    this.animate();
    
    // Expose game state for React HUD - using NRL (Neural Rejection Level)
    window.gameState = {
      nrl: 0, // Neural Rejection Level - 0 is stable, 100 is collapse
      health: 100,
      ammo: 12, // Current magazine
      maxAmmo: 30, // Magazine capacity
      reserveAmmo: 48, // Reserve ammunition
      battery: 100,
      flashlightOn: true, // Start with flashlight ON
      hasWeapon: false, // Weapon not picked up yet
      showWeaponInfo: false, // Show weapon info briefly
      enemyCount: this.enemies.length,
      isMicActive: false,
      fearLevel: 0,
      isOtherworld: false,
      objective: 'Find a way out',
      isInvulnerable: true // Protection during initialization
    };
    
    // Mark as initialized after a short delay
    setTimeout(() => {
      this.isInitialized = true;
      if (window.gameState) {
        window.gameState.isInvulnerable = false;
      }
    }, this.INVULNERABILITY_TIME * 1000);
    
    console.log('[Game] Initialization complete');
  }
  
  setupLighting() {
    // LAYERED LIGHTING SYSTEM
    // Layer 1: World ambient - provides base visibility
    this.ambientLight = new THREE.AmbientLight(0x334455, 0.6);
    this.scene.add(this.ambientLight);
    
    // Layer 2: Hemisphere light for subtle sky/ground color
    const hemiLight = new THREE.HemisphereLight(0x334466, 0x111122, 0.4);
    this.scene.add(hemiLight);
    
    // Layer 3: Practical fluorescent lights (main visibility sources)
    const fluorescentPositions = [
      { x: 0, y: 3.8, z: 0 },
      { x: -8, y: 3.8, z: -8 },
      { x: 8, y: 3.8, z: -8 },
      { x: -8, y: 3.8, z: 8 },
      { x: 8, y: 3.8, z: 8 },
      { x: 0, y: 3.8, z: -12 },
      { x: 0, y: 3.8, z: 12 },
      { x: -12, y: 3.8, z: 0 },
      { x: 12, y: 3.8, z: 0 }
    ];
    
    fluorescentPositions.forEach((pos, i) => {
      const light = new THREE.PointLight(0xddeeff, 1.2, 12, 1.5);
      light.position.set(pos.x, pos.y, pos.z);
      light.castShadow = i < 3; // Only first 3 cast shadows for performance
      if (light.castShadow) {
        light.shadow.mapSize.width = 256;
        light.shadow.mapSize.height = 256;
      }
      this.scene.add(light);
      this.flickeringLights.push({
        light,
        baseIntensity: 1.2,
        nextFlicker: Date.now() + Math.random() * 5000,
        isFluorescent: true
      });
    });
    
    // Layer 4: Emergency red lights (atmospheric)
    const emergencyPositions = [
      { x: -10, y: 3, z: -10 },
      { x: 10, y: 3, z: 10 },
      { x: -10, y: 3, z: 10 },
      { x: 10, y: 3, z: -10 }
    ];
    
    emergencyPositions.forEach(pos => {
      const light = new THREE.PointLight(0xff2200, 0.8, 15);
      light.position.set(pos.x, pos.y, pos.z);
      this.scene.add(light);
      this.emergencyLights.push({
        light,
        baseIntensity: 0.8,
        phase: Math.random() * Math.PI * 2
      });
    });
    
    // Layer 5: Cyan accent lights (sci-fi feel)
    const accentPositions = [
      { x: -5, y: 0.5, z: -5 },
      { x: 5, y: 0.5, z: 5 },
      { x: -15, y: 0.5, z: 0 },
      { x: 15, y: 0.5, z: 0 }
    ];
    
    accentPositions.forEach(pos => {
      const light = new THREE.PointLight(0x00aaff, 0.4, 8);
      light.position.set(pos.x, pos.y, pos.z);
      this.scene.add(light);
    });
    
    // Layer 6: Player flashlight (managed by CinematicCamera)
    // Note: The CinematicCamera creates its own flashlight
  }
  
  toggleFlashlight() {
    this.flashlightOn = !this.flashlightOn;
    
    if (this.flashlightOn && this.flashlightBattery > 0) {
      this.flashlight.intensity = 2;
      this.ps1Uniforms.u_flashlightIntensity.value = 1.0;
    } else {
      this.flashlight.intensity = 0;
      this.ps1Uniforms.u_flashlightIntensity.value = 0.0;
      this.flashlightOn = false;
    }
    
    if (window.gameState) {
      window.gameState.flashlightOn = this.flashlightOn;
    }
  }
  
  updateFlashlight(delta) {
    if (this.flashlightOn) {
      // Drain battery
      this.flashlightBattery = Math.max(0, this.flashlightBattery - delta * 2);
      
      if (this.flashlightBattery <= 0) {
        this.toggleFlashlight();
      }
      
      // Update flashlight position and direction
      const playerPos = this.player.getPosition();
      const playerRot = this.player.getRotation();
      
      this.flashlight.position.copy(playerPos);
      
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyEuler(new THREE.Euler(playerRot.x, playerRot.y, 0, 'YXZ'));
      
      this.flashlight.target.position.copy(playerPos).add(direction);
      
      // Update shader uniforms
      this.ps1Uniforms.u_flashlightPos.value.copy(playerPos);
      this.ps1Uniforms.u_flashlightDir.value.copy(direction);
      
      // Flicker when battery low
      if (this.flashlightBattery < 20) {
        const flicker = Math.random() > 0.9 ? 0.5 : 1.0;
        this.flashlight.intensity = 2 * flicker;
        this.ps1Uniforms.u_flashlightIntensity.value = flicker;
      }
    }
    
    if (window.gameState) {
      window.gameState.battery = this.flashlightBattery;
    }
  }
  
  updateLighting(delta) {
    // Update emergency lights (pulsing)
    this.emergencyLights.forEach(emergency => {
      emergency.phase += delta * 2;
      emergency.light.intensity = emergency.baseIntensity * (0.5 + Math.sin(emergency.phase) * 0.5);
    });
    
    // Update flickering lights
    const now = Date.now();
    this.flickeringLights.forEach(flicker => {
      if (now > flicker.nextFlicker) {
        // Random flicker
        const shouldFlicker = Math.random() > 0.7;
        if (shouldFlicker) {
          flicker.light.intensity = Math.random() * 0.3;
          flicker.nextFlicker = now + 50 + Math.random() * 100;
        } else {
          flicker.light.intensity = flicker.baseIntensity;
          flicker.nextFlicker = now + 2000 + Math.random() * 5000;
        }
      }
    });
  }
  
  updateOtherworld(delta) {
    // NRL-based transitions (inverted from sanity)
    const nrl = this.sanitySystem ? (100 - this.sanitySystem.getEffectiveSanity()) : 0;
    
    // Transition triggers at NRL thresholds
    let targetIntensity = 0;
    if (nrl > 25) targetIntensity = 0.3;  // Minor anomalies
    if (nrl > 50) targetIntensity = 0.6;  // Psychological instability
    if (nrl > 75) targetIntensity = 1.0;  // Severe degradation
    
    // Smooth transition
    this.otherworldTransition += (targetIntensity - this.otherworldTransition) * delta * 2;
    
    // Update shader
    this.ps1Uniforms.u_otherworldIntensity.value = this.otherworldTransition;
    
    // Update fog color based on otherworld state
    const normalFog = new THREE.Color(0x1a1a1a);
    const otherworldFog = new THREE.Color(0x2d1f1f);
    this.scene.fog.color.lerpColors(normalFog, otherworldFog, this.otherworldTransition);
    this.ps1Uniforms.u_fogColor.value.copy(this.scene.fog.color);
    
    // Update ambient light
    this.ambientLight.color.lerpColors(
      new THREE.Color(0x222233),
      new THREE.Color(0x331111),
      this.otherworldTransition
    );
    
    // Trigger transition effect at thresholds
    if (this.otherworldTransition > 0.5 && !this.isOtherworld) {
      this.isOtherworld = true;
      this.triggerOtherworldTransition();
    } else if (this.otherworldTransition < 0.3 && this.isOtherworld) {
      this.isOtherworld = false;
    }
    
    if (window.gameState) {
      window.gameState.isOtherworld = this.isOtherworld;
    }
  }
  
  triggerOtherworldTransition() {
    // Visual effect
    const transition = document.getElementById('otherworld-transition');
    transition.style.opacity = '1';
    setTimeout(() => {
      transition.style.opacity = '0';
    }, 500);
    
    // Audio effect (siren)
    if (this.audioSystem) {
      this.audioSystem.playSiren();
    }
    
    // Screen shake
    this.cameraShake(0.2, 1000);
    
    // Spawn more aggressive enemies
    this.enemyAI.spawnInitialEnemies(2);
  }
  
  cameraShake(intensity, duration) {
    const startTime = Date.now();
    const originalPos = this.camera.position.clone();
    
    const shake = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        const progress = elapsed / duration;
        const shakeIntensity = intensity * (1 - progress);
        
        this.camera.position.x = originalPos.x + (Math.random() - 0.5) * shakeIntensity;
        this.camera.position.y = originalPos.y + (Math.random() - 0.5) * shakeIntensity;
        
        requestAnimationFrame(shake);
      } else {
        this.camera.position.copy(originalPos);
      }
    };
    shake();
  }
  
  updatePostProcessing(sanityEffects) {
    // Blood vignette (increases with low health/high NRL)
    const bloodVignette = document.getElementById('blood-vignette');
    const playerHealth = this.player?.health ?? 100;
    const vignetteIntensity = Math.max(
      sanityEffects.vignette,
      1 - (playerHealth / 100)
    );
    if (bloodVignette) {
      bloodVignette.style.opacity = vignetteIntensity * 0.6;
    }
    
    // Chromatic aberration (when NRL > 40%)
    const chromatic = document.getElementById('chromatic-aberration');
    if (chromatic) {
      if (sanityEffects.chromatic > 0.3) {
        chromatic.style.opacity = sanityEffects.chromatic * 0.4;
      } else {
        chromatic.style.opacity = '0';
      }
    }
    
    // Film grain (always present, increases with high NRL)
    const grain = document.getElementById('film-grain');
    if (grain) {
      grain.style.opacity = 0.12 + sanityEffects.colorShift * 0.15;
    }
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
  }
  
  animate() {
    if (!this.isRunning) return;
    
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    
    // Update systems
    try {
      if (this.player) this.player.update(delta);
      if (this.sanitySystem) this.sanitySystem.update(delta);
      if (this.narrativeEngine) this.narrativeEngine.update(delta);
      if (this.audioSystem) this.audioSystem.update(delta);
      if (this.enemyAI) this.enemyAI.update(delta);
      if (this.hallucinationSystem) this.hallucinationSystem.update(delta);
      this.updateLighting(delta);
      this.updateOtherworld(delta);
    } catch (error) {
      console.error('[Game] Error in update loop:', error);
    }
    
    // Update PS1 shader effects
    const sanityEffects = this.sanitySystem.getEffects();
    this.updatePS1Effects(sanityEffects);
    this.updatePostProcessing(sanityEffects);
    
    // Update React HUD state - safe number handling
    if (window.gameState) {
      // NRL: Inverted from sanity (0 = stable, 100 = collapse)
      const sanityValue = this.sanitySystem ? this.sanitySystem.getEffectiveSanity() : 100;
      window.gameState.nrl = Math.max(0, Math.min(100, 100 - sanityValue));
      
      // Safe number validation - prevent NaN/undefined
      window.gameState.health = Number.isFinite(this.player?.health) ? this.player.health : 100;
      window.gameState.ammo = Number.isFinite(this.player?.ammo) ? this.player.ammo : 12;
      window.gameState.reserveAmmo = Number.isFinite(this.player?.reserveAmmo) ? this.player.reserveAmmo : 48;
      window.gameState.maxAmmo = Number.isFinite(this.player?.maxAmmo) ? this.player.maxAmmo : 30;
      window.gameState.battery = Number.isFinite(this.flashlightBattery) ? this.flashlightBattery : 100;
      window.gameState.flashlightOn = this.player?.flashlightOn ?? true;
      window.gameState.hasWeapon = this.player?.hasWeapon ?? false;
      window.gameState.showWeaponInfo = this.player?.showWeaponInfo ?? false;
      window.gameState.fearLevel = this.audioSystem ? this.audioSystem.getFearLevel() : 0;
      window.gameState.isMicActive = this.audioSystem ? this.audioSystem.isActive : false;
      window.gameState.enemyCount = this.enemies.length;
      
      window.dispatchEvent(new CustomEvent('gameStateUpdate', {
        detail: { ...window.gameState }
      }));
    }
    
    // Render
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('[Game] Render error:', error);
    }
  }
  
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  onShoot(raycaster) {
    const intersects = raycaster.intersectObjects(
      this.enemies.map(e => e.mesh).filter(m => m),
      true
    );
    
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      
      // Find enemy that owns this mesh
      const enemy = this.enemies.find(e => {
        if (e.mesh === hit) return true;
        let found = false;
        e.mesh.traverse(child => {
          if (child === hit) found = true;
        });
        return found;
      });
      
      if (enemy) {
        enemy.takeDamage(1);
        
        if (enemy.health <= 0) {
          this.enemyAI.removeEnemy(enemy);
        }
      }
    }
  }
  
  onScream(intensity) {
    this.sanitySystem.onFearSpike(intensity);
    this.enemyAI.spawnEnemyNearPlayer();
    
    // Trigger narrative response to fear
    if (this.narrativeEngine) {
      const sanity = this.sanitySystem.getEffectiveSanity();
      if (sanity < 25 && !this.narrativeEngine.eventTriggers.get('low_sanity_25').triggered) {
        this.narrativeEngine.triggerEvent('low_sanity_25');
      }
    }
  }
  
  triggerHallucination(type, intensity) {
    this.hallucinationSystem.spawnHallucination(type, intensity);
  }
  
  triggerJumpScare() {
    const flash = document.getElementById('jumpscare-flash');
    flash.style.opacity = '1';
    setTimeout(() => {
      flash.style.opacity = '0';
    }, 100);
    
    this.cameraShake(0.3, 500);
    
    if (this.audioSystem) {
      this.audioSystem.playJumpScare();
    }
  }
}

export function initGame() {
  return new Game();
}
