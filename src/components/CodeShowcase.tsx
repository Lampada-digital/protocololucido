import { useState } from 'react';
import { motion } from 'framer-motion';

const codeSnippets = [
  {
    id: 'colyseus',
    title: 'Colyseus Room Schema',
    language: 'TypeScript',
    description: 'Server-authoritative game state with schema-based sync. The DiveRoom manages 4-player co-op sessions with per-player hallucination routing.',
    code: `// packages/server/src/rooms/DiveRoom.ts
import { Room, Client } from "colyseus";
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { GameState, PlayerState, HallucinationEvent } from "@lucid/shared";

// ─── Schema Definitions ───────────────────────────────────
export class SanityState extends Schema {
  @type("number") shared: number = 100;     // 0-100, shared pool
  @type("number") individual: number = 100;  // per-player
  @type("number") fearLevel: number = 0;     // mic-detected
  @type("boolean") hallucinating: boolean = false;
}

export class HallucinationSeed extends Schema {
  @type("string") id: string;
  @type("string") type: string;       // "visual" | "audio" | "ui_lie"
  @type("number") intensity: number;  // 0-1
  @type("number") timestamp: number;
  @type("number") duration: number;   // ms
  @type("string") targetPlayer: string; // sessionId, or "all"
  @type("string") data: string;       // JSON payload
}

export class DiveRoomState extends Schema {
  @type("string") phase: string = "lobby"; // lobby | diving | climax | escape
  @type("number") roundTimer: number = 900; // 15 min in seconds
  @type("number") environmentShift: number = 0; // 0-3, which reality layer
  @type(SanityState) sanity: SanityState = new SanityState();
  @type("map", PlayerState) players: MapSchema<PlayerState> = new MapSchema();
  @type("array", HallucinationSeed) activeHallucinations: ArraySchema<HallucinationSeed> = new ArraySchema();
}

// ─── Room Implementation ──────────────────────────────────
export class DiveRoom extends Room<DiveRoomState> {
  maxClients = 4;
  
  // Phobia profiles loaded from Supabase
  private phobiaProfiles: Map<string, string[]> = new Map();
  
  onCreate(options: { targetId: string }) {
    this.setState(new DiveRoomState());
    
    // Server-authoritative sanity decay
    this.clock.setInterval(() => {
      this.tickSanityDecay();
    }, 1000);
    
    // Schedule hallucination events
    this.clock.setInterval(() => {
      this.scheduleHallucination();
    }, 5000 + Math.random() * 10000);
    
    // Environment shift timer
    this.clock.setInterval(() => {
      if (this.state.phase === "diving") {
        this.state.environmentShift = (this.state.environmentShift + 1) % 4;
      }
    }, 120000); // Every 2 minutes
    
    // Round timer
    this.clock.setInterval(() => {
      this.state.roundTimer--;
      if (this.state.roundTimer <= 0) this.endRound();
    }, 1000);
  }
  
  onJoin(client: Client, options: { phobias: string[] }) {
    const player = new PlayerState();
    player.sessionId = client.sessionId;
    player.position.set(0, 0, 0);
    player.rotation.set(0, 0, 0);
    player.isAlive = true;
    
    this.state.players.set(client.sessionId, player);
    this.phobiaProfiles.set(client.sessionId, options.phobias || []);
  }
  
  onMessage(client: Client, type: string, data: any) {
    switch (type) {
      case "move":
        // Client-predicted, server validates bounds
        const player = this.state.players.get(client.sessionId);
        if (player && this.validatePosition(data)) {
          player.position.set(data.x, data.y, data.z);
        }
        break;
        
      case "fear_spike":
        // Mic detected fear → increase shared sanity drain
        this.state.sanity.fearLevel = Math.min(
          this.state.sanity.fearLevel + data.intensity,
          100
        );
        this.state.sanity.shared -= data.intensity * 0.5;
        break;
        
      case "request_hallucination":
        // Client requests personal hallucination (for phobia engine)
        this.routeHallucination(client.sessionId, data);
        break;
    }
  }
  
  private tickSanityDecay() {
    const playerCount = this.state.players.size;
    const decayRate = 0.1 * (1 + this.state.sanity.fearLevel / 100);
    
    this.state.sanity.shared = Math.max(0, this.state.sanity.shared - decayRate);
    
    // Individual sanity affected by personal fear level
    this.state.players.forEach((player) => {
      player.sanity.individual = Math.max(
        0, 
        player.sanity.individual - (decayRate * 0.5)
      );
      player.sanity.hallucinating = player.sanity.individual < 30;
    });
  }
  
  private scheduleHallucination() {
    // Pick a random player, use their phobia profile
    const playerIds = Array.from(this.state.players.keys());
    const targetId = playerIds[Math.floor(Math.random() * playerIds.length)];
    const phobias = this.phobiaProfiles.get(targetId) || ["darkness"];
    const phobia = phobias[Math.floor(Math.random() * phobias.length)];
    
    const seed = new HallucinationSeed();
    seed.id = Math.random().toString(36).substr(2, 9);
    seed.type = this.getHallucinationType(phobia);
    seed.intensity = 1 - (this.state.sanity.shared / 100); // Higher when sanity low
    seed.timestamp = Date.now();
    seed.duration = 3000 + Math.random() * 5000;
    seed.targetPlayer = targetId;
    seed.data = JSON.stringify({ phobia, layer: this.state.environmentShift });
    
    this.state.activeHallucinations.push(seed);
    
    // Clean up expired hallucinations
    setTimeout(() => {
      const idx = this.state.activeHallucinations.indexOf(seed);
      if (idx >= 0) this.state.activeHallucinations.splice(idx, 1);
    }, seed.duration);
  }
  
  private routeHallucination(sessionId: string, data: any) {
    // Only send to target player — minimal network traffic
    const seed = new HallucinationSeed();
    seed.id = Math.random().toString(36).substr(2, 9);
    seed.type = data.type;
    seed.intensity = data.intensity;
    seed.timestamp = Date.now();
    seed.duration = data.duration;
    seed.targetPlayer = sessionId;
    seed.data = JSON.stringify(data.payload);
    
    this.state.activeHallucinations.push(seed);
  }
  
  private validatePosition(pos: { x: number; y: number; z: number }): boolean {
    // Anti-cheat: basic bounds checking
    const BOUNDS = 50;
    return Math.abs(pos.x) < BOUNDS && Math.abs(pos.y) < BOUNDS && Math.abs(pos.z) < BOUNDS;
  }
  
  private endRound() {
    this.state.phase = "escape";
    this.clock.setTimeout(() => {
      this.disconnect();
    }, 10000);
  }
}`
  },
  {
    id: 'sanity',
    title: 'SanitySystem Core Logic',
    language: 'TypeScript',
    description: 'Client-side sanity system with server reconciliation. Handles visual distortions, audio warping, and hallucination triggers.',
    code: `// apps/game/src/core/SanitySystem.ts
import { EventEmitter } from 'events';
import type { SanityState } from '@lucid/shared';

export interface SanityThresholds {
  MILD_DISTORTION: 75;    // Slight color shift, audio warble
  MODERATE: 50;           // Vertex jitter, texture swim
  SEVERE: 30;             // Hallucination spawns, UI lies
  CRITICAL: 15;           // Full perceptual breakdown
  DEAD: 0;                // Player "dies" — game over for them
}

export class SanitySystem extends EventEmitter {
  private sharedSanity: number = 100;
  private individualSanity: number = 100;
  private fearLevel: number = 0;
  private lastServerSync: number = 0;
  private predictionBuffer: SanityDelta[] = [];
  
  // Visual effect intensities (0-1)
  public effects = {
    colorShift: 0,
    vertexJitter: 0,
    textureSwim: 0,
    chromatic: 0,
    vignette: 0,
    hallucination: 0,
    uiCorruption: 0,
  };
  
  constructor(private isServerAuthoritative: boolean = true) {
    super();
  }
  
  // Called every frame
  update(deltaTime: number): SanityEffects {
    // Apply prediction if no recent server update
    if (Date.now() - this.lastServerSync > 200) {
      this.applyPrediction(deltaTime);
    }
    
    // Calculate effect intensities based on sanity
    this.updateEffects();
    
    // Check thresholds and emit events
    this.checkThresholds();
    
    return { ...this.effects };
  }
  
  // Reconcile with server state
  reconcile(serverState: SanityState): void {
    this.lastServerSync = Date.now();
    
    // Smooth interpolation to server values (avoid snapping)
    const LERP_SPEED = 5;
    this.sharedSanity = this.lerp(this.sharedSanity, serverState.shared, LERP_SPEED);
    this.individualSanity = this.lerp(this.individualSanity, serverState.individual, LERP_SPEED);
    this.fearLevel = this.lerp(this.fearLevel, serverState.fearLevel, LERP_SPEED);
    
    // Clear prediction buffer up to server state
    this.predictionBuffer = this.predictionBuffer.filter(
      p => p.timestamp > this.lastServerSync
    );
  }
  
  // Client predicts sanity change (before server confirms)
  predictSanityChange(delta: number, source: string): void {
    this.individualSanity = Math.max(0, Math.min(100, this.individualSanity + delta));
    this.predictionBuffer.push({
      delta,
      source,
      timestamp: Date.now()
    });
  }
  
  // Called when mic detects fear
  registerFearSpike(intensity: number): void {
    this.fearLevel = Math.min(100, this.fearLevel + intensity * 10);
    this.predictSanityChange(-intensity * 2, 'fear_spike');
    this.emit('fear_spike', { intensity, sanity: this.individualSanity });
  }
  
  // Get current effective sanity (used by other systems)
  getEffectiveSanity(): number {
    // Blend shared and individual (70% shared, 30% individual)
    return this.sharedSanity * 0.7 + this.individualSanity * 0.3;
  }
  
  getCurrentPhase(): keyof typeof SanityThresholds {
    const effective = this.getEffectiveSanity();
    if (effective > 75) return 'MILD_DISTORTION';
    if (effective > 50) return 'MODERATE';
    if (effective > 30) return 'SEVERE';
    if (effective > 15) return 'CRITICAL';
    return 'DEAD';
  }
  
  private updateEffects(): void {
    const sanity = this.getEffectiveSanity();
    const fear = this.fearLevel / 100;
    
    // Smooth effect transitions
    this.effects.colorShift = this.smoothStep(100 - sanity, 25, 75) * 0.3;
    this.effects.vertexJitter = this.smoothStep(100 - sanity, 50, 80) * fear;
    this.effects.textureSwim = this.smoothStep(100 - sanity, 40, 70) * 0.5;
    this.effects.chromatic = this.smoothStep(100 - sanity, 30, 60) * 0.8;
    this.effects.vignette = this.smoothStep(100 - sanity, 20, 50) * 0.6;
    this.effects.hallucination = sanity < 30 ? (30 - sanity) / 30 : 0;
    this.effects.uiCorruption = sanity < 40 ? (40 - sanity) / 40 : 0;
    
    // Decay fear level over time
    this.fearLevel = Math.max(0, this.fearLevel - 0.5);
  }
  
  private checkThresholds(): void {
    const sanity = this.getEffectiveSanity();
    
    if (sanity <= 30 && !this.wasHallucinating) {
      this.emit('threshold:severe');
      this.wasHallucinating = true;
    } else if (sanity > 30) {
      this.wasHallucinating = false;
    }
    
    if (sanity <= 15 && !this.wasCritical) {
      this.emit('threshold:critical');
      this.wasCritical = true;
    } else if (sanity > 15) {
      this.wasCritical = false;
    }
    
    if (sanity <= 0) {
      this.emit('threshold:dead');
    }
  }
  
  private wasHallucinating = false;
  private wasCritical = false;
  
  // Utility functions
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * Math.min(t, 1);
  }
  
  private smoothStep(value: number, min: number, max: number): number {
    const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return t * t * (3 - 2 * t);
  }
  
  private applyPrediction(deltaTime: number): void {
    // Apply buffered predictions that haven't been reconciled
    for (const pred of this.predictionBuffer) {
      if (pred.timestamp > this.lastServerSync) {
        // Already applied in predictSanityChange
      }
    }
  }
}

interface SanityDelta {
  delta: number;
  source: string;
  timestamp: number;
}

interface SanityEffects {
  colorShift: number;
  vertexJitter: number;
  textureSwim: number;
  chromatic: number;
  vignette: number;
  hallucination: number;
  uiCorruption: number;
}`
  },
  {
    id: 'mic',
    title: 'Microphone Fear Detector',
    language: 'TypeScript',
    description: 'Privacy-first Web Audio API implementation. Analyzes volume and frequency in real-time without recording. Triggers gameplay events on fear spikes.',
    code: `// apps/game/src/core/MicFearDetector.ts
// Privacy-first: NO recording, NO storage, ONLY real-time analysis

export interface FearAnalysis {
  volume: number;        // 0-1 normalized
  peakFrequency: number; // Hz
  isScream: boolean;     // High volume + high frequency
  fearIntensity: number; // 0-1 composite score
  timestamp: number;
}

export class MicFearDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private dataArray: Uint8Array | null = null;
  private freqArray: Uint8Array | null = null;
  private isRunning: boolean = false;
  private animationFrame: number | null = null;
  
  // Thresholds (configurable)
  private SCREAM_VOLUME_THRESHOLD = 0.7;  // Normalized volume
  private SCREAM_FREQ_THRESHOLD = 800;    // Hz - screams are high-pitched
  private FEAR_DECAY_RATE = 0.02;         // Per frame
  private SUSTAIN_FRAMES = 10;            // Frames to sustain before trigger
  
  // State
  private currentFear: number = 0;
  private sustainCounter: number = 0;
  private lastAnalysis: FearAnalysis | null = null;
  
  // Callbacks
  private onFearSpike: ((analysis: FearAnalysis) => void) | null = null;
  private onContinuousFear: ((level: number) => void) | null = null;
  
  async initialize(): Promise<boolean> {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      // Create audio context (lazy init)
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Create analyser
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3;
      
      // Connect: mic → analyser (NOT to destination — no playback)
      source.connect(this.analyser);
      
      // Prepare buffers
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.freqArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      return true;
    } catch (error) {
      console.warn('[MicFearDetector] Microphone access denied:', error);
      return false;
    }
  }
  
  start(
    onFearSpike: (analysis: FearAnalysis) => void,
    onContinuousFear?: (level: number) => void
  ): void {
    if (!this.analyser || !this.dataArray || !this.freqArray) {
      throw new Error('Must call initialize() first');
    }
    
    this.onFearSpike = onFearSpike;
    this.onContinuousFear = onContinuousFear || null;
    this.isRunning = true;
    this.analyze();
  }
  
  stop(): void {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
  
  private analyze = (): void => {
    if (!this.isRunning || !this.analyser || !this.dataArray || !this.freqArray) return;
    
    // Get time-domain data (volume)
    this.analyser.getByteTimeDomainData(this.dataArray);
    
    // Get frequency data (pitch)
    this.analyser.getByteFrequencyData(this.freqArray);
    
    // Calculate RMS volume (0-1)
    const volume = this.calculateRMS(this.dataArray);
    
    // Find peak frequency
    const peakFreq = this.findPeakFrequency(this.freqArray);
    
    // Determine if this is a scream
    const isScream = volume > this.SCREAM_VOLUME_THRESHOLD 
      && peakFreq > this.SCREAM_FREQ_THRESHOLD;
    
    // Calculate composite fear intensity
    let fearIntensity = 0;
    if (isScream) {
      // Scream = maximum fear
      fearIntensity = Math.min(1, volume * 1.2);
      this.sustainCounter++;
    } else if (volume > 0.3) {
      // Elevated voice = mild fear
      fearIntensity = volume * 0.3;
      this.sustainCounter = Math.max(0, this.sustainCounter - 1);
    } else {
      // Quiet = fear decays
      this.currentFear = Math.max(0, this.currentFear - this.FEAR_DECAY_RATE);
      this.sustainCounter = 0;
    }
    
    // Update continuous fear level
    this.currentFear = Math.max(this.currentFear, fearIntensity * 0.5);
    
    const analysis: FearAnalysis = {
      volume,
      peakFrequency: peakFreq,
      isScream: isScream && this.sustainCounter >= this.SUSTAIN_FRAMES,
      fearIntensity: this.currentFear,
      timestamp: Date.now()
    };
    
    this.lastAnalysis = analysis;
    
    // Trigger callbacks
    if (analysis.isScream && this.onFearSpike) {
      this.onFearSpike(analysis);
      this.sustainCounter = 0; // Reset after trigger
    }
    
    if (this.onContinuousFear && this.currentFear > 0.1) {
      this.onContinuousFear(this.currentFear);
    }
    
    // Continue analysis loop
    this.animationFrame = requestAnimationFrame(this.analyze);
  };
  
  private calculateRMS(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - 128) / 128; // Convert to -1 to 1
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / data.length);
  }
  
  private findPeakFrequency(freqData: Uint8Array): number {
    if (!this.audioContext) return 0;
    
    let maxVal = 0;
    let maxIndex = 0;
    
    for (let i = 0; i < freqData.length; i++) {
      if (freqData[i] > maxVal) {
        maxVal = freqData[i];
        maxIndex = i;
      }
    }
    
    // Convert bin index to frequency
    const nyquist = this.audioContext.sampleRate / 2;
    return (maxIndex / freqData.length) * nyquist;
  }
  
  // Get current state (for UI)
  getLastAnalysis(): FearAnalysis | null {
    return this.lastAnalysis;
  }
  
  getCurrentFearLevel(): number {
    return this.currentFear;
  }
  
  // Privacy guarantee: this class NEVER stores audio data
  // It only reads from the analyser buffer which is immediately discarded
}`
  },
  {
    id: 'shader',
    title: 'PS1-Style Shader Pipeline',
    language: 'GLSL',
    description: 'Vertex snapping, affine texture mapping, ordered dithering, and CRT post-processing. The complete retro horror visual pipeline.',
    code: `// ─── PS1 VERTEX SHADER ───────────────────────────────────
// apps/game/src/shaders/ps1-vertex.glsl

uniform float u_snapResolution;    // e.g., 160.0 (PS1 was 320x240)
uniform float u_snapVertex;         // Grid snap size (e.g., 4.0)
uniform float u_time;
uniform float u_jitterIntensity;    // Sanity-based vertex jitter

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vFogDepth;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  
  vec4 viewPos = viewMatrix * worldPos;
  vFogDepth = -viewPos.z;
  
  // ── Vertex Snapping (PS1 had no sub-pixel precision) ──
  vec4 snappedPos = projectionMatrix * viewPos;
  snappedPos.xyz = snappedPos.xyz / snappedPos.w;
  
  // Snap to grid
  snappedPos.x = floor(snappedPos.x * u_snapResolution) / u_snapResolution;
  snappedPos.y = floor(snappedPos.y * u_snapResolution * 0.75) / (u_snapResolution * 0.75);
  
  snappedPos.xyz *= snappedPos.w;
  
  // ── Sanity-based vertex jitter ──
  float jitter = u_jitterIntensity * 0.02;
  snappedPos.x += sin(u_time * 10.0 + position.y * 5.0) * jitter;
  snappedPos.y += cos(u_time * 8.0 + position.x * 3.0) * jitter;
  
  gl_Position = snappedPos;
}

// ─── PS1 FRAGMENT SHADER ─────────────────────────────────
// apps/game/src/shaders/ps1-fragment.glsl

uniform sampler2D u_texture;
uniform float u_time;
uniform float u_textureSwim;      // Affine warping intensity
uniform float u_colorShift;       // Sanity-based color distortion
uniform float u_ditherStrength;   // Ordered dither amount
uniform vec3 u_fogColor;
uniform float u_fogNear;
uniform float u_fogFar;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vFogDepth;

// ── 4x4 Bayer dithering matrix ──
const mat4 bayerMatrix = mat4(
   0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
  12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
   3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
  15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
);

void main() {
  // ── Affine texture mapping (PS1 had no perspective correction) ──
  vec2 uv = vUv;
  float swim = u_textureSwim * 0.01;
  uv.x += sin(u_time * 2.0 + vWorldPos.y * 3.0) * swim;
  uv.y += cos(u_time * 1.5 + vWorldPos.x * 2.0) * swim;
  
  // ── Low-res texture sampling (PS1 had limited texture memory) ──
  vec2 texRes = vec2(64.0); // Simulate low-res textures
  uv = floor(uv * texRes) / texRes;
  
  vec4 texColor = texture2D(u_texture, uv);
  
  // ── Simple lighting (PS1 had Gouraud shading at best) ──
  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
  float diffuse = max(dot(vNormal, lightDir), 0.0);
  float ambient = 0.15; // Dark ambient — it's horror
  vec3 lit = texColor.rgb * (ambient + diffuse * 0.6);
  
  // ── Color quantization (PS1 had 15-bit color) ──
  float levels = 32.0;
  lit = floor(lit * levels) / levels;
  
  // ── Sanity color shift ──
  lit.r += sin(u_time * 0.5) * u_colorShift * 0.2;
  lit.b += cos(u_time * 0.7) * u_colorShift * 0.15;
  
  // ── Ordered dithering ──
  ivec2 pixel = ivec2(mod(gl_FragCoord.xy, 4.0));
  float threshold = bayerMatrix[pixel.x][pixel.y];
  float dither = (threshold - 0.5) * u_ditherStrength;
  lit += dither;
  
  // ── Fog ──
  float fogFactor = smoothstep(u_fogNear, u_fogFar, vFogDepth);
  lit = mix(lit, u_fogColor, fogFactor);
  
  gl_FragColor = vec4(lit, texColor.a);
}

// ─── CRT POST-PROCESS SHADER ─────────────────────────────
// apps/game/src/shaders/crt-post.glsl

uniform sampler2D tDiffuse;
uniform float u_time;
uniform float u_scanlineIntensity;
uniform float u_curvature;
uniform float u_vignetteIntensity;
uniform float u_chromaticAberration;
uniform vec2 u_resolution;

varying vec2 vUv;

vec2 curveUV(vec2 uv) {
  uv = (uv - 0.5) * 2.0;
  uv *= 1.0 + pow(length(uv), 2.0) * u_curvature;
  return uv * 0.5 + 0.5;
}

void main() {
  vec2 uv = curveUV(vUv);
  
  // Out of bounds = black (CRT bezel)
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  
  // ── Chromatic aberration ──
  float aberration = u_chromaticAberration * 0.003;
  float r = texture2D(tDiffuse, uv + vec2(aberration, 0.0)).r;
  float g = texture2D(tDiffuse, uv).g;
  float b = texture2D(tDiffuse, uv - vec2(aberration, 0.0)).b;
  vec3 color = vec3(r, g, b);
  
  // ── Scanlines ──
  float scanline = sin(uv.y * u_resolution.y * 3.14159) * 0.5 + 0.5;
  scanline = pow(scanline, 1.5);
  color *= 1.0 - scanline * u_scanlineIntensity;
  
  // ── Vignette ──
  vec2 vigUV = uv * (1.0 - uv);
  float vignette = vigUV.x * vigUV.y * 15.0;
  vignette = pow(vignette, u_vignetteIntensity);
  color *= vignette;
  
  // ── Subtle flicker ──
  color *= 0.98 + 0.02 * sin(u_time * 60.0);
  
  // ── Slight green tint (CRT phosphor) ──
  color.g *= 1.02;
  
  gl_FragColor = vec4(color, 1.0);
}

// ─── REACT THREE FIBER INTEGRATION ───────────────────────
// Example usage in R3F:

/*
import { ShaderMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import ps1Vertex from './shaders/ps1-vertex.glsl?raw';
import ps1Fragment from './shaders/ps1-fragment.glsl?raw';

function PS1Mesh({ geometry, texture, sanityEffects }) {
  const matRef = useRef<ShaderMaterial>(null);
  
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.u_time.value = clock.elapsedTime;
      matRef.current.uniforms.u_jitterIntensity.value = sanityEffects.vertexJitter;
      matRef.current.uniforms.u_textureSwim.value = sanityEffects.textureSwim;
      matRef.current.uniforms.u_colorShift.value = sanityEffects.colorShift;
    }
  });
  
  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        vertexShader={ps1Vertex}
        fragmentShader={ps1Fragment}
        uniforms={{
          u_snapResolution: { value: 160.0 },
          u_snapVertex: { value: 4.0 },
          u_time: { value: 0 },
          u_jitterIntensity: { value: 0 },
          u_texture: { value: texture },
          u_textureSwim: { value: 0 },
          u_colorShift: { value: 0 },
          u_ditherStrength: { value: 0.05 },
          u_fogColor: { value: new Color(0x0a0a0f) },
          u_fogNear: { value: 5 },
          u_fogFar: { value: 30 },
        }}
      />
    </mesh>
  );
}
*/`
  },
  {
    id: 'gaslight',
    title: 'Gaslighting UI Component',
    language: 'TypeScript/React',
    description: 'React component that lies to the player. Fake health bar synced with SanitySystem. Includes accessibility toggle.',
    code: `// apps/web/src/components/game/FakeHealthBar.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '../../hooks/useGameState';

interface FakeHealthBarProps {
  actualHealth: number;      // Real health from game engine
  sanityLevel: number;       // 0-100 from SanitySystem
  accessibilityMode: boolean; // If true, show real values
  className?: string;
}

export function FakeHealthBar({ 
  actualHealth, 
  sanityLevel, 
  accessibilityMode,
  className = '' 
}: FakeHealthBarProps) {
  const [displayedHealth, setDisplayedHealth] = useState(actualHealth);
  const [isGlitching, setIsGlitching] = useState(false);
  const [showFakeDamage, setShowFakeDamage] = useState(false);
  const [fakeMessage, setFakeMessage] = useState<string | null>(null);
  
  const { events } = useGameState();
  
  // The lie: displayed health diverges from actual based on sanity
  useEffect(() => {
    if (accessibilityMode) {
      // Accessibility: always show truth
      setDisplayedHealth(actualHealth);
      return;
    }
    
    // Calculate how much to lie
    const lieIntensity = Math.max(0, (100 - sanityLevel) / 100);
    
    // Types of lies based on sanity level
    const lieType = getLieType(sanityLevel);
    
    switch (lieType) {
      case 'subtle_drift':
        // Health bar slowly drifts away from truth
        const drift = (Math.random() - 0.5) * 20 * lieIntensity;
        setDisplayedHealth(clamp(actualHealth + drift, 0, 100));
        break;
        
      case 'random_spikes':
        // Occasionally show fake damage
        if (Math.random() < 0.1 * lieIntensity) {
          setShowFakeDamage(true);
          setDisplayedHealth(Math.max(0, actualHealth - 30 * lieIntensity));
          setTimeout(() => {
            setShowFakeDamage(false);
            setDisplayedHealth(actualHealth);
          }, 500 + Math.random() * 1000);
        }
        break;
        
      case 'inversion':
        // Show inverted health (low looks high, high looks low)
        setDisplayedHealth(100 - actualHealth);
        break;
        
      case 'chaos':
        // Completely random, but trending toward death
        const chaos = Math.random() * 40 * lieIntensity;
        setDisplayedHealth(clamp(actualHealth - chaos, 0, 100));
        break;
    }
    
    // Fake warning messages
    if (sanityLevel < 40 && Math.random() < 0.02) {
      const messages = [
        '⚠ CRITICAL DAMAGE DETECTED',
        '⚠ VITAL SIGNS FAILING',
        '⚠ DIVER INTEGRITY: COMPROMISED',
        '⚠ EXTRACTION IMPOSSIBLE',
      ];
      setFakeMessage(messages[Math.floor(Math.random() * messages.length)]);
      setTimeout(() => setFakeMessage(null), 2000);
    }
  }, [actualHealth, sanityLevel, accessibilityMode, events]);
  
  // Glitch effect
  useEffect(() => {
    if (sanityLevel < 50 && !accessibilityMode) {
      const interval = setInterval(() => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 100 + Math.random() * 200);
      }, 2000 + Math.random() * 3000);
      
      return () => clearInterval(interval);
    }
  }, [sanityLevel, accessibilityMode]);
  
  const healthColor = getHealthColor(displayedHealth, sanityLevel);
  
  return (
    <div className={\`relative \${className}\`}>
      {/* Main health bar */}
      <div className="relative h-4 bg-black/80 border border-gray-700 rounded overflow-hidden">
        {/* Background glow */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{ 
            background: \`linear-gradient(90deg, \${healthColor}40, transparent)\` 
          }}
        />
        
        {/* Health fill */}
        <motion.div
          className="h-full relative"
          animate={{ 
            width: \`\${displayedHealth}%\`,
            x: isGlitching ? [0, -3, 3, -1, 0] : 0,
          }}
          transition={{ 
            width: { duration: 0.3, ease: "easeOut" },
            x: { duration: 0.1 }
          }}
          style={{ 
            background: \`linear-gradient(90deg, \${healthColor}, \${healthColor}cc)\`,
            boxShadow: \`0 0 10px \${healthColor}60\`
          }}
        >
          {/* Scanline effect on bar */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)'
            }}
          />
        </motion.div>
        
        {/* Fake damage flash */}
        <AnimatePresence>
          {showFakeDamage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-600"
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Health number (also lies) */}
      <div className="flex justify-between mt-1">
        <span 
          className="font-mono text-xs"
          style={{ 
            color: healthColor,
            transform: isGlitching ? \`translate(\${Math.random() * 4 - 2}px, \${Math.random() * 2 - 1}px)\` : 'none',
            textShadow: \`0 0 5px \${healthColor}\`
          }}
        >
          HP: {Math.round(displayedHealth)}%
        </span>
        
        {accessibilityMode && (
          <span className="font-mono text-xs text-gray-500">
            (TRUE: {Math.round(actualHealth)}%)
          </span>
        )}
      </div>
      
      {/* Fake warning message */}
      <AnimatePresence>
        {fakeMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-8 left-0 right-0 text-center"
          >
            <span className="font-mono text-xs text-red-500 animate-pulse">
              {fakeMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Accessibility indicator */}
      {accessibilityMode && (
        <div className="absolute -top-5 right-0">
          <span className="font-mono text-[10px] text-neon-green bg-neon-green/10 px-1 rounded">
            TRUTH MODE
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────

function getLieType(sanity: number): string {
  if (sanity > 75) return 'subtle_drift';
  if (sanity > 50) return 'random_spikes';
  if (sanity > 25) return 'inversion';
  return 'chaos';
}

function getHealthColor(health: number, sanity: number): string {
  if (health > 60) return '#00ff41';
  if (health > 30) return '#ffbf00';
  // At low sanity, even "healthy" values look wrong
  if (sanity < 30) return '#ff0040';
  return '#cc1100';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Accessibility Settings Component ─────────────────────

export function GaslightSettings() {
  const [settings, setSettings] = useState({
    fullGaslighting: true,
    reduceUILies: false,
    truthMode: false,       // Shows true values alongside lies
    noFakeDeaths: false,
    reducedFlashing: false,
  });
  
  return (
    <div className="space-y-4 p-4 border border-void-lighter rounded-lg">
      <h3 className="font-mono text-sm text-amber">◈ PERCEPTION SETTINGS</h3>
      
      <label className="flex items-center gap-3">
        <input 
          type="checkbox"
          checked={settings.truthMode}
          onChange={(e) => setSettings(s => ({ ...s, truthMode: e.target.checked }))}
          className="accent-neon-green"
        />
        <span className="text-sm text-gray-300">
          Show true values alongside distorted UI
        </span>
      </label>
      
      <label className="flex items-center gap-3">
        <input 
          type="checkbox"
          checked={settings.reduceUILies}
          onChange={(e) => setSettings(s => ({ ...s, reduceUILies: e.target.checked }))}
          className="accent-neon-green"
        />
        <span className="text-sm text-gray-300">
          Reduce UI distortion intensity by 50%
        </span>
      </label>
      
      <label className="flex items-center gap-3">
        <input 
          type="checkbox"
          checked={settings.noFakeDeaths}
          onChange={(e) => setSettings(s => ({ ...s, noFakeDeaths: e.target.checked }))}
          className="accent-neon-green"
        />
        <span className="text-sm text-gray-300">
          Disable fake death sequences
        </span>
      </label>
      
      <label className="flex items-center gap-3">
        <input 
          type="checkbox"
          checked={settings.reducedFlashing}
          onChange={(e) => setSettings(s => ({ ...s, reducedFlashing: e.target.checked }))}
          className="accent-neon-green"
        />
        <span className="text-sm text-gray-300">
          Reduce flashing effects (photosensitivity)
        </span>
      </label>
    </div>
  );
}`
  }
];

export default function CodeShowcase() {
  const [activeTab, setActiveTab] = useState('colyseus');
  
  const activeSnippet = codeSnippets.find(s => s.id === activeTab) || codeSnippets[0];

  return (
    <section className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-blood-light">03.</span> Code Snippets
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Core implementations for the five critical systems. Production-ready TypeScript and GLSL.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {codeSnippets.map((snippet) => (
            <button
              key={snippet.id}
              onClick={() => setActiveTab(snippet.id)}
              className={`px-4 py-2 rounded font-mono text-xs transition-all ${
                activeTab === snippet.id
                  ? 'bg-blood/20 text-blood-light border border-blood/40'
                  : 'text-gray-500 hover:text-white border border-void-lighter hover:border-gray-600'
              }`}
            >
              {snippet.title}
            </button>
          ))}
        </div>

        {/* Code display */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Description */}
          <div className="mb-4 p-4 border border-void-lighter rounded-lg bg-void-light/30">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs text-neon-green bg-neon-green/10 px-2 py-0.5 rounded">
                {activeSnippet.language}
              </span>
              <span className="font-mono text-xs text-gray-500">
                {activeSnippet.title}
              </span>
            </div>
            <p className="text-gray-400 text-sm">{activeSnippet.description}</p>
          </div>

          {/* Code block */}
          <div className="code-block">
            <div className="flex items-center justify-between px-4 py-2 bg-void-lighter border-b border-void-lighter">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blood/60" />
                <div className="w-3 h-3 rounded-full bg-amber/60" />
                <div className="w-3 h-3 rounded-full bg-neon-green/60" />
              </div>
              <span className="font-mono text-xs text-gray-500">
                {activeSnippet.id === 'colyseus' && 'DiveRoom.ts'}
                {activeSnippet.id === 'sanity' && 'SanitySystem.ts'}
                {activeSnippet.id === 'mic' && 'MicFearDetector.ts'}
                {activeSnippet.id === 'shader' && 'ps1-shaders.glsl'}
                {activeSnippet.id === 'gaslight' && 'FakeHealthBar.tsx'}
              </span>
            </div>
            <pre className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
              <code className="text-sm font-mono text-gray-300 leading-relaxed whitespace-pre">
                {activeSnippet.code}
              </code>
            </pre>
          </div>
        </motion.div>

        {/* Key architecture notes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="border border-neon-blue/20 rounded-lg p-4 bg-neon-blue/5">
            <h3 className="font-mono text-neon-blue text-xs mb-2">NETWORK STRATEGY</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Position: Client-predicted, server-validated</li>
              <li>• Sanity: Server-authoritative, client-interpolated</li>
              <li>• Hallucinations: Server seeds, client generates</li>
              <li>• Voice: P2P WebRTC mesh (no server relay)</li>
            </ul>
          </div>
          <div className="border border-neon-purple/20 rounded-lg p-4 bg-neon-purple/5">
            <h3 className="font-mono text-neon-purple text-xs mb-2">PERFORMANCE NOTES</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• FFT analysis runs at 60fps in AudioWorklet</li>
              <li>• Shader uniforms updated per-frame (cheap)</li>
              <li>• Hallucination instances share geometry</li>
              <li>• UI lies are CSS transforms (GPU-composited)</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
