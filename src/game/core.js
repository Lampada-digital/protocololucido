import * as THREE from 'three';
import { Player } from './player.js';
import { SanitySystem } from './sanitySystem.js';
import { AudioSystem } from './audioSystem.js';
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
    
    // Lighting calculation
    vec3 lightDir = normalize(vec3(0.3, 1.0, 0.5));
    float diffuse = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.15;
    
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
    
    vec3 lit = texColor.rgb * (ambient + diffuse * 0.4 + flashlight * 0.8);
    
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
    
    // Dense fog (Silent Hill style)
    float fogFactor = 1.0 - exp(-vFogDepth * 0.05);
    fogFactor = clamp(fogFactor, 0.0, 1.0);
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
    const canvas = document.getElementById('game-canvas');
    
    // Renderer with horror-optimized settings
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap; // Performance
    this.renderer.shadowMap.autoUpdate = false; // Manual updates
    this.renderer.setClearColor(0x0a0a0a);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.6; // Dark exposure
    
    // Scene with dense fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x1a1a1a, 0.05); // Exponential fog
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    
    // Lighting setup
    this.setupLighting();
    
    // Build environment
    this.environmentBuilder = new EnvironmentBuilder(this);
    this.environmentBuilder.build();
    
    // Initialize systems
    this.player = new Player(this.camera, this.scene, this);
    this.sanitySystem = new SanitySystem(this);
    this.audioSystem = new AudioSystem(this);
    this.enemyAI = new EnemyAI(this);
    this.inventorySystem = new InventorySystem(this);
    this.hallucinationSystem = new HallucinationSystem(this);
    
    // Spawn initial enemies
    this.enemyAI.spawnInitialEnemies(3);
    
    // Event listeners
    window.addEventListener('resize', () => this.onResize());
    
    // Start game loop
    this.isRunning = true;
    this.animate();
    
    // Expose game state for React HUD
    window.gameState = {
      sanity: 100,
      health: 100,
      ammo: 12, // Start with limited ammo
      maxAmmo: 30,
      battery: 100,
      flashlightOn: false,
      enemyCount: this.enemies.length,
      isMicActive: false,
      fearLevel: 0,
      isOtherworld: false,
      objective: 'Find a way out'
    };
  }
  
  setupLighting() {
    // Dim ambient light
    this.ambientLight = new THREE.AmbientLight(0x222233, 0.2);
    this.scene.add(this.ambientLight);
    
    // Flashlight (SpotLight)
    this.flashlight = new THREE.SpotLight(0xffffee, 0, 20, Math.PI / 4, 0.5, 1);
    this.flashlight.position.set(0, 0, 0);
    this.flashlight.target.position.set(0, 0, -1);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 512;
    this.flashlight.shadow.mapSize.height = 512;
    this.flashlight.shadow.camera.near = 0.5;
    this.flashlight.shadow.camera.far = 20;
    this.scene.add(this.flashlight);
    this.scene.add(this.flashlight.target);
    
    // Emergency red lights (pulsing)
    const emergencyPositions = [
      { x: -10, y: 3, z: -10 },
      { x: 10, y: 3, z: 10 },
      { x: -10, y: 3, z: 10 },
      { x: 10, y: 3, z: -10 }
    ];
    
    emergencyPositions.forEach(pos => {
      const light = new THREE.PointLight(0xff0000, 0.5, 15);
      light.position.set(pos.x, pos.y, pos.z);
      this.scene.add(light);
      this.emergencyLights.push({
        light,
        baseIntensity: 0.5,
        phase: Math.random() * Math.PI * 2
      });
    });
    
    // Flickering fluorescent lights
    const flickerPositions = [
      { x: 0, y: 3.5, z: 0 },
      { x: -5, y: 3.5, z: -5 },
      { x: 5, y: 3.5, z: 5 }
    ];
    
    flickerPositions.forEach(pos => {
      const light = new THREE.PointLight(0xccffcc, 0.8, 10);
      light.position.set(pos.x, pos.y, pos.z);
      light.castShadow = true;
      light.shadow.mapSize.width = 256;
      light.shadow.mapSize.height = 256;
      this.scene.add(light);
      this.flickeringLights.push({
        light,
        baseIntensity: 0.8,
        nextFlicker: Date.now() + Math.random() * 5000
      });
    });
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
    const sanity = this.sanitySystem.getEffectiveSanity();
    
    // Transition triggers at sanity thresholds
    let targetIntensity = 0;
    if (sanity < 75) targetIntensity = 0.3;
    if (sanity < 50) targetIntensity = 0.6;
    if (sanity < 25) targetIntensity = 1.0;
    
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
    // Blood vignette (increases with low health/sanity)
    const bloodVignette = document.getElementById('blood-vignette');
    const vignetteIntensity = Math.max(
      sanityEffects.vignette,
      1 - (this.player.health / 100)
    );
    bloodVignette.style.opacity = vignetteIntensity * 0.8;
    
    // Chromatic aberration (when sanity < 40%)
    const chromatic = document.getElementById('chromatic-aberration');
    if (sanityEffects.chromatic > 0.3) {
      chromatic.style.opacity = sanityEffects.chromatic * 0.5;
    } else {
      chromatic.style.opacity = '0';
    }
    
    // Film grain (always present, increases with low sanity)
    const grain = document.getElementById('film-grain');
    grain.style.opacity = 0.15 + sanityEffects.colorShift * 0.2;
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
    this.player.update(delta);
    this.sanitySystem.update(delta);
    this.enemyAI.update(delta);
    this.hallucinationSystem.update(delta);
    this.updateFlashlight(delta);
    this.updateLighting(delta);
    this.updateOtherworld(delta);
    
    // Update PS1 shader effects
    const sanityEffects = this.sanitySystem.getEffects();
    this.updatePS1Effects(sanityEffects);
    this.updatePostProcessing(sanityEffects);
    
    // Update React HUD state
    if (window.gameState) {
      window.gameState.sanity = this.sanitySystem.getEffectiveSanity();
      window.gameState.health = this.player.health;
      window.gameState.ammo = this.player.ammo;
      window.gameState.fearLevel = this.audioSystem.getFearLevel();
      window.gameState.isMicActive = this.audioSystem.isActive;
      window.gameState.enemyCount = this.enemies.length;
      
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
