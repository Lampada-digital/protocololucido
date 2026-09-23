/**
 * @fileoverview Neural Degradation Manager - The central orchestrator for systemic horror.
 * 
 * This module monitors the player's "Neural Rejection Level" (NRL) and triggers
 * coordinated responses across environment, UI, audio, and AI systems. It is the
 * backbone of the "Systemic Dread" philosophy: horror emerges from the player's
 * loss of agency over predictable systems.
 * 
 * Architecture:
 * - Data-driven via JSON config (PhobiaEngineConfig)
 * - Event-based for loose coupling between systems
 * - Strategy pattern for environment mutations
 * - Observer pattern for system notifications
 * 
 * @author The Lucid Protocol Team
 * @version 1.0.0
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════

/**
 * Neural Rejection Level - the core metric driving all horror systems.
 * Range: 0 (calm) to 100 (total breakdown)
 */
export type NRL = number & { readonly __brand: unique symbol };

/**
 * Environment mutation types - each represents a distinct visual/spatial change
 */
export type EnvironmentMutationType =
  | 'corridorElongation'
  | 'wallTextureSwap'
  | 'doorRelocation'
  | 'lightingShift'
  | 'fogDensity'
  | 'geometryWarp'
  | 'otherworldTransition';

/**
 * UI deception types - ways the interface can lie to the player
 */
export type UIDeceptionType =
  | 'compassSpin'
  | 'healthInversion'
  | 'ammoDrift'
  | 'objectiveRedirect'
  | 'fakeWarning'
  | 'controlInversion';

/**
 * Audio distortion parameters
 */
export interface AudioDistortionParams {
  reverbMix: number;      // 0-1
  pitchShift: number;     // semitones, -12 to +12
  distortionAmount: number; // 0-1
  lowpassCutoff: number;  // Hz, 20-20000
  staticIntensity: number; // 0-1
}

/**
 * Environment mutation configuration - data-driven
 */
export interface EnvironmentMutation {
  id: string;
  type: EnvironmentMutationType;
  nrlThreshold: number;
  parameters: Record<string, unknown>;
  duration?: number; // ms, undefined = permanent until next threshold
  reversible: boolean;
  priority: number; // Higher = takes precedence
}

/**
 * Phobia Engine Configuration - loaded from JSON
 */
export interface PhobiaEngineConfig {
  version: string;
  nrlThresholds: {
    mildDistortion: number;
    moderate: number;
    severe: number;
    critical: number;
    psychoticBreak: number;
  };
  mutations: EnvironmentMutation[];
  uiDeceptions: Array<{
    type: UIDeceptionType;
    nrlThreshold: number;
    intensity: number;
  }>;
  audioDistortionCurve: Array<{
    nrl: number;
    params: AudioDistortionParams;
  }>;
}

/**
 * Event types emitted by the Neural Degradation Manager
 */
export type NDMEventType =
  | 'nrl:changed'
  | 'nrl:threshold:crossed'
  | 'environment:mutation:start'
  | 'environment:mutation:end'
  | 'ui:deception:activate'
  | 'ui:deception:deactivate'
  | 'audio:distortion:update'
  | 'ai:behavior:modulate'
  | 'psychoticBreak:start'
  | 'psychoticBreak:end';

/**
 * Event payload for NRL changes
 */
export interface NRLEventPayload {
  previousNRL: number;
  currentNRL: number;
  delta: number;
  source: 'proximity' | 'fear' | 'damage' | 'environment' | 'narrative';
  timestamp: number;
}

/**
 * Event payload for threshold crossings
 */
export interface ThresholdEventPayload {
  threshold: keyof PhobiaEngineConfig['nrlThresholds'];
  nrl: number;
  direction: 'ascending' | 'descending';
}

// ═══════════════════════════════════════════════════════════
// CORE MANAGER CLASS
// ═══════════════════════════════════════════════════════════

/**
 * Neural Degradation Manager - Orchestrates all horror systems based on NRL.
 * 
 * @example
 * ```typescript
 * const ndm = new NeuralDegradationManager(config);
 * ndm.on('nrl:threshold:crossed', (payload) => {
 *   console.log(`Crossed ${payload.threshold} at ${payload.nrl}%`);
 * });
 * ndm.updateNRL(15, 'proximity');
 * ```
 */
export class NeuralDegradationManager extends EventEmitter {
  /** Current NRL value (0-100) */
  private currentNRL: number = 0;
  
  /** Target NRL for smooth interpolation */
  private targetNRL: number = 0;
  
  /** Interpolation speed (units per second) */
  private readonly interpolationSpeed: number = 5;
  
  /** Phobia engine configuration */
  private readonly config: PhobiaEngineConfig;
  
  /** Active environment mutations */
  private activeMutations: Map<string, { mutation: EnvironmentMutation; startTime: number }> = new Map();
  
  /** Active UI deceptions */
  private activeDeceptions: Set<UIDeceptionType> = new Set();
  
  /** Current audio distortion parameters */
  private currentAudioParams: AudioDistortionParams = {
    reverbMix: 0,
    pitchShift: 0,
    distortionAmount: 0,
    lowpassCutoff: 20000,
    staticIntensity: 0
  };
  
  /** Last crossed thresholds (to avoid re-triggering) */
  private crossedThresholds: Set<keyof PhobiaEngineConfig['nrlThresholds']> = new Set();
  
  /** Whether psychotic break is active */
  private psychoticBreakActive: boolean = false;
  
  /** Timestamp of last update */
  private lastUpdateTime: number = Date.now();
  
  /**
   * Creates a new Neural Degradation Manager.
   * 
   * @param config - Phobia engine configuration (typically loaded from JSON)
   * @throws {Error} If config is invalid
   */
  constructor(config: PhobiaEngineConfig) {
    super();
    this.validateConfig(config);
    this.config = config;
  }
  
  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Updates the target NRL. The actual NRL will interpolate smoothly.
   * 
   * @param delta - Change in NRL (-100 to +100)
   * @param source - What caused the change (for analytics)
   */
  public updateNRL(delta: number, source: NRLEventPayload['source']): void {
    const previousNRL = this.targetNRL;
    this.targetNRL = Math.max(0, Math.min(100, this.targetNRL + delta));
    
    // Emit change event
    this.emit('nrl:changed', {
      previousNRL,
      currentNRL: this.targetNRL,
      delta,
      source,
      timestamp: Date.now()
    } satisfies NRLEventPayload);
    
    // Check thresholds
    this.checkThresholds(previousNRL, this.targetNRL);
  }
  
  /**
   * Sets NRL directly (for testing or narrative triggers).
   * 
   * @param value - Target NRL (0-100)
   */
  public setNRL(value: number): void {
    const previousNRL = this.targetNRL;
    this.targetNRL = Math.max(0, Math.min(100, value));
    this.currentNRL = this.targetNRL; // Immediate for set
    
    this.emit('nrl:changed', {
      previousNRL,
      currentNRL: this.targetNRL,
      delta: this.targetNRL - previousNRL,
      source: 'narrative',
      timestamp: Date.now()
    } satisfies NRLEventPayload);
    
    this.checkThresholds(previousNRL, this.targetNRL);
  }
  
  /**
   * Gets the current interpolated NRL value.
   * Call this every frame for smooth transitions.
   * 
   * @returns Current NRL (0-100)
   */
  public getCurrentNRL(): number {
    return this.currentNRL;
  }
  
  /**
   * Gets the target NRL (before interpolation).
   * 
   * @returns Target NRL (0-100)
   */
  public getTargetNRL(): number {
    return this.targetNRL;
  }
  
  /**
   * Per-frame update. Call from game loop.
   * Handles interpolation, mutation timing, and continuous effects.
   * 
   * @param deltaTime - Time since last frame (seconds)
   */
  public update(deltaTime: number): void {
    // Smooth interpolation toward target
    if (Math.abs(this.currentNRL - this.targetNRL) > 0.01) {
      const direction = Math.sign(this.targetNRL - this.currentNRL);
      const step = this.interpolationSpeed * deltaTime;
      const distance = Math.abs(this.targetNRL - this.currentNRL);
      
      if (distance < step) {
        this.currentNRL = this.targetNRL;
      } else {
        this.currentNRL += direction * step;
      }
    }
    
    // Update active mutations
    this.updateMutations();
    
    // Update audio distortion
    this.updateAudioDistortion();
    
    // Update UI deceptions
    this.updateUIDeceptions();
    
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Gets all active environment mutations.
   * 
   * @returns Array of active mutations with their progress
   */
  public getActiveMutations(): Array<{
    mutation: EnvironmentMutation;
    progress: number; // 0-1
    remaining: number; // ms
  }> {
    const result: Array<{ mutation: EnvironmentMutation; progress: number; remaining: number }> = [];
    const now = Date.now();
    
    this.activeMutations.forEach(({ mutation, startTime }) => {
      if (mutation.duration) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / mutation.duration);
        const remaining = Math.max(0, mutation.duration - elapsed);
        result.push({ mutation, progress, remaining });
      } else {
        result.push({ mutation, progress: 1, remaining: Infinity });
      }
    });
    
    return result;
  }
  
  /**
   * Gets current UI deception state.
   * 
   * @returns Object with deception types and their intensities
   */
  public getUIDeceptionState(): Record<UIDeceptionType, number> {
    const state: Record<string, number> = {};
    
    for (const deception of this.config.uiDeceptions) {
      if (this.currentNRL >= deception.nrlThreshold) {
        // Intensity scales with how far above threshold
        const overshoot = (this.currentNRL - deception.nrlThreshold) / (100 - deception.nrlThreshold);
        state[deception.type] = Math.min(1, deception.intensity * (1 + overshoot));
      } else {
        state[deception.type] = 0;
      }
    }
    
    return state as Record<UIDeceptionType, number>;
  }
  
  /**
   * Gets current audio distortion parameters.
   * 
   * @returns Audio distortion parameters interpolated from config curve
   */
  public getAudioDistortion(): AudioDistortionParams {
    return { ...this.currentAudioParams };
  }
  
  /**
   * Checks if psychotic break is currently active.
   * 
   * @returns True if psychotic break is active
   */
  public isPsychoticBreakActive(): boolean {
    return this.psychoticBreakActive;
  }
  
  /**
   * Gets the current NRL phase (for UI/audio systems).
   * 
   * @returns Current phase name
   */
  public getCurrentPhase(): keyof PhobiaEngineConfig['nrlThresholds'] | 'normal' {
    const thresholds = this.config.nrlThresholds;
    
    if (this.currentNRL >= thresholds.psychoticBreak) return 'psychoticBreak';
    if (this.currentNRL >= thresholds.critical) return 'critical';
    if (this.currentNRL >= thresholds.severe) return 'severe';
    if (this.currentNRL >= thresholds.moderate) return 'moderate';
    if (this.currentNRL >= thresholds.mildDistortion) return 'mildDistortion';
    return 'normal';
  }
  
  /**
   * Resets the manager to initial state.
   */
  public reset(): void {
    this.currentNRL = 0;
    this.targetNRL = 0;
    this.activeMutations.clear();
    this.activeDeceptions.clear();
    this.crossedThresholds.clear();
    this.psychoticBreakActive = false;
    this.currentAudioParams = {
      reverbMix: 0,
      pitchShift: 0,
      distortionAmount: 0,
      lowpassCutoff: 20000,
      staticIntensity: 0
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // PRIVATE IMPLEMENTATION
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Validates the phobia engine configuration.
   * 
   * @param config - Config to validate
   * @throws {Error} If config is invalid
   */
  private validateConfig(config: PhobiaEngineConfig): void {
    if (!config.version) {
      throw new Error('PhobiaEngineConfig: version is required');
    }
    
    if (!config.nrlThresholds) {
      throw new Error('PhobiaEngineConfig: nrlThresholds is required');
    }
    
    const requiredThresholds: Array<keyof PhobiaEngineConfig['nrlThresholds']> = [
      'mildDistortion', 'moderate', 'severe', 'critical', 'psychoticBreak'
    ];
    
    for (const key of requiredThresholds) {
      if (typeof config.nrlThresholds[key] !== 'number') {
        throw new Error(`PhobiaEngineConfig: nrlThresholds.${key} must be a number`);
      }
    }
    
    // Ensure thresholds are in ascending order
    const values = requiredThresholds.map(k => config.nrlThresholds[k]);
    for (let i = 1; i < values.length; i++) {
      if (values[i] <= values[i - 1]) {
        throw new Error(`PhobiaEngineConfig: thresholds must be in ascending order`);
      }
    }
  }
  
  /**
   * Checks if any thresholds were crossed and emits events.
   * 
   * @param previousNRL - NRL before change
   * @param currentNRL - NRL after change
   */
  private checkThresholds(previousNRL: number, currentNRL: number): void {
    const thresholds = this.config.nrlThresholds;
    const direction = currentNRL > previousNRL ? 'ascending' : 'descending';
    
    for (const [key, value] of Object.entries(thresholds)) {
      const thresholdKey = key as keyof PhobiaEngineConfig['nrlThresholds'];
      const crossed = direction === 'ascending'
        ? (previousNRL < value && currentNRL >= value)
        : (previousNRL >= value && currentNRL < value);
      
      if (crossed) {
        this.emit('nrl:threshold:crossed', {
          threshold: thresholdKey,
          nrl: currentNRL,
          direction
        } satisfies ThresholdEventPayload);
        
        // Trigger mutations for this threshold
        if (direction === 'ascending') {
          this.triggerMutationsForThreshold(value);
        }
        
        // Handle psychotic break
        if (thresholdKey === 'psychoticBreak') {
          if (direction === 'ascending') {
            this.startPsychoticBreak();
          } else {
            this.endPsychoticBreak();
          }
        }
        
        this.crossedThresholds.add(thresholdKey);
      }
    }
  }
  
  /**
   * Triggers environment mutations for a given NRL threshold.
   * 
   * @param threshold - NRL value that was crossed
   */
  private triggerMutationsForThreshold(threshold: number): void {
    const applicableMutations = this.config.mutations
      .filter(m => m.nrlThreshold === threshold)
      .sort((a, b) => b.priority - a.priority);
    
    for (const mutation of applicableMutations) {
      this.activateMutation(mutation);
    }
  }
  
  /**
   * Activates an environment mutation.
   * 
   * @param mutation - Mutation to activate
   */
  private activateMutation(mutation: EnvironmentMutation): void {
    // Check if higher priority mutation of same type is active
    const existing = this.activeMutations.get(mutation.type);
    if (existing && existing.mutation.priority > mutation.priority) {
      return;
    }
    
    this.activeMutations.set(mutation.id, {
      mutation,
      startTime: Date.now()
    });
    
    this.emit('environment:mutation:start', {
      mutation,
      timestamp: Date.now()
    });
  }
  
  /**
   * Updates active mutations, removing expired ones.
   */
  private updateMutations(): void {
    const now = Date.now();
    const toRemove: string[] = [];
    
    this.activeMutations.forEach(({ mutation, startTime }, id) => {
      if (mutation.duration) {
        const elapsed = now - startTime;
        if (elapsed >= mutation.duration) {
          if (mutation.reversible) {
            toRemove.push(id);
            this.emit('environment:mutation:end', {
              mutation,
              timestamp: now
            });
          }
        }
      }
    });
    
    for (const id of toRemove) {
      this.activeMutations.delete(id);
    }
  }
  
  /**
   * Updates UI deceptions based on current NRL.
   */
  private updateUIDeceptions(): void {
    const newDeceptions = new Set<UIDeceptionType>();
    
    for (const deception of this.config.uiDeceptions) {
      if (this.currentNRL >= deception.nrlThreshold) {
        newDeceptions.add(deception.type);
      }
    }
    
    // Detect newly activated deceptions
    for (const type of newDeceptions) {
      if (!this.activeDeceptions.has(type)) {
        this.activeDeceptions.add(type);
        this.emit('ui:deception:activate', { type, intensity: 1 });
      }
    }
    
    // Detect deactivated deceptions
    for (const type of this.activeDeceptions) {
      if (!newDeceptions.has(type)) {
        this.activeDeceptions.delete(type);
        this.emit('ui:deception:deactivate', { type });
      }
    }
  }
  
  /**
   * Updates audio distortion parameters by interpolating the config curve.
   */
  private updateAudioDistortion(): void {
    const curve = this.config.audioDistortionCurve;
    if (curve.length === 0) return;
    
    // Find the two points we're between
    let lower = curve[0];
    let upper = curve[curve.length - 1];
    
    for (let i = 0; i < curve.length - 1; i++) {
      if (this.currentNRL >= curve[i].nrl && this.currentNRL <= curve[i + 1].nrl) {
        lower = curve[i];
        upper = curve[i + 1];
        break;
      }
    }
    
    // Interpolate
    const t = upper.nrl === lower.nrl ? 0 : 
      (this.currentNRL - lower.nrl) / (upper.nrl - lower.nrl);
    
    this.currentAudioParams = {
      reverbMix: this.lerp(lower.params.reverbMix, upper.params.reverbMix, t),
      pitchShift: this.lerp(lower.params.pitchShift, upper.params.pitchShift, t),
      distortionAmount: this.lerp(lower.params.distortionAmount, upper.params.distortionAmount, t),
      lowpassCutoff: this.lerp(lower.params.lowpassCutoff, upper.params.lowpassCutoff, t),
      staticIntensity: this.lerp(lower.params.staticIntensity, upper.params.staticIntensity, t)
    };
    
    this.emit('audio:distortion:update', this.currentAudioParams);
  }
  
  /**
   * Starts the psychotic break sequence.
   */
  private startPsychoticBreak(): void {
    this.psychoticBreakActive = true;
    this.emit('psychoticBreak:start', { timestamp: Date.now() });
  }
  
  /**
   * Ends the psychotic break sequence.
   */
  private endPsychoticBreak(): void {
    this.psychoticBreakActive = false;
    this.emit('psychoticBreak:end', { timestamp: Date.now() });
  }
  
  /**
   * Linear interpolation helper.
   * 
   * @param a - Start value
   * @param b - End value
   * @param t - Interpolation factor (0-1)
   * @returns Interpolated value
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }
}

// ═══════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════

/**
 * Default phobia engine configuration.
 * Can be overridden by loading a JSON file.
 */
export const DEFAULT_PHOBIA_CONFIG: PhobiaEngineConfig = {
  version: '1.0.0',
  nrlThresholds: {
    mildDistortion: 25,
    moderate: 40,
    severe: 60,
    critical: 75,
    psychoticBreak: 90
  },
  mutations: [
    {
      id: 'corridor_elongation_1',
      type: 'corridorElongation',
      nrlThreshold: 40,
      parameters: { factor: 1.3, axis: 'z' },
      duration: undefined,
      reversible: true,
      priority: 1
    },
    {
      id: 'wall_texture_swap_1',
      type: 'wallTextureSwap',
      nrlThreshold: 60,
      parameters: { from: 'concrete', to: 'flesh' },
      duration: undefined,
      reversible: true,
      priority: 2
    },
    {
      id: 'lighting_shift_1',
      type: 'lightingShift',
      nrlThreshold: 75,
      parameters: { color: '#ff2200', intensity: 0.5 },
      duration: undefined,
      reversible: true,
      priority: 3
    },
    {
      id: 'otherworld_transition',
      type: 'otherworldTransition',
      nrlThreshold: 90,
      parameters: { duration: 3000, intensity: 1.0 },
      duration: 3000,
      reversible: false,
      priority: 10
    }
  ],
  uiDeceptions: [
    { type: 'compassSpin', nrlThreshold: 50, intensity: 0.5 },
    { type: 'healthInversion', nrlThreshold: 60, intensity: 0.7 },
    { type: 'ammoDrift', nrlThreshold: 55, intensity: 0.4 },
    { type: 'objectiveRedirect', nrlThreshold: 70, intensity: 0.8 },
    { type: 'fakeWarning', nrlThreshold: 65, intensity: 0.6 },
    { type: 'controlInversion', nrlThreshold: 80, intensity: 0.9 }
  ],
  audioDistortionCurve: [
    { nrl: 0, params: { reverbMix: 0, pitchShift: 0, distortionAmount: 0, lowpassCutoff: 20000, staticIntensity: 0 } },
    { nrl: 25, params: { reverbMix: 0.1, pitchShift: -1, distortionAmount: 0.05, lowpassCutoff: 15000, staticIntensity: 0.1 } },
    { nrl: 50, params: { reverbMix: 0.3, pitchShift: -3, distortionAmount: 0.15, lowpassCutoff: 8000, staticIntensity: 0.3 } },
    { nrl: 75, params: { reverbMix: 0.6, pitchShift: -6, distortionAmount: 0.4, lowpassCutoff: 3000, staticIntensity: 0.6 } },
    { nrl: 100, params: { reverbMix: 0.9, pitchShift: -12, distortionAmount: 0.8, lowpassCutoff: 500, staticIntensity: 1.0 } }
  ]
};
