export class SanitySystem {
  constructor(game) {
    this.game = game;
    
    // Sanity values
    this.sharedSanity = 100;
    this.individualSanity = 100;
    this.fearLevel = 0;
    
    // Decay rates
    this.baseDecayRate = 0.1; // Per second
    this.proximityDrain = 0;
    this.fearDrain = 0;
    
    // Effect intensities (0-1)
    this.effects = {
      colorShift: 0,
      vertexJitter: 0,
      textureSwim: 0,
      chromatic: 0,
      vignette: 0,
      hallucination: 0,
      uiCorruption: 0
    };
    
    // Thresholds
    this.MILD_DISTORTION = 75;
    this.MODERATE = 50;
    this.SEVERE = 30;
    this.CRITICAL = 15;
    this.DEAD = 0;
    
    // Gaslighting state
    this.isGaslighting = false;
    this.gaslightTimer = 0;
    this.lastHallucinationTime = 0;
    
    // Event callbacks
    this.onThresholdCross = null;
  }
  
  update(delta) {
    // Calculate total decay
    const totalDecay = (
      this.baseDecayRate +
      this.proximityDrain +
      this.fearDrain
    ) * delta;
    
    // Apply decay
    this.sharedSanity = Math.max(0, this.sharedSanity - totalDecay * 0.7);
    this.individualSanity = Math.max(0, this.individualSanity - totalDecay);
    
    // Decay temporary drains
    this.proximityDrain *= 0.95;
    this.fearDrain *= 0.9;
    this.fearLevel *= 0.98;
    
    // Update visual effects
    this.updateEffects();
    
    // Check thresholds
    this.checkThresholds();
    
    // Gaslighting logic
    this.updateGaslighting(delta);
    
    // Natural recovery (very slow)
    if (this.proximityDrain < 0.1 && this.fearDrain < 0.1) {
      this.sharedSanity = Math.min(100, this.sharedSanity + 0.02 * delta);
      this.individualSanity = Math.min(100, this.individualSanity + 0.01 * delta);
    }
  }
  
  updateEffects() {
    const sanity = this.getEffectiveSanity();
    const fear = this.fearLevel / 100;
    
    // Smooth effect transitions based on sanity
    this.effects.colorShift = this.smoothStep(100 - sanity, 25, 75) * 0.4;
    this.effects.vertexJitter = this.smoothStep(100 - sanity, 50, 85) * (0.5 + fear * 0.5);
    this.effects.textureSwim = this.smoothStep(100 - sanity, 40, 70) * 0.6;
    this.effects.chromatic = this.smoothStep(100 - sanity, 30, 60) * 0.8;
    this.effects.vignette = this.smoothStep(100 - sanity, 20, 50) * 0.7;
    this.effects.hallucination = sanity < this.SEVERE ? (this.SEVERE - sanity) / this.SEVERE : 0;
    this.effects.uiCorruption = sanity < 40 ? (40 - sanity) / 40 : 0;
  }
  
  checkThresholds() {
    const sanity = this.getEffectiveSanity();
    let threshold = null;
    
    if (sanity <= this.DEAD) {
      threshold = 'DEAD';
    } else if (sanity <= this.CRITICAL) {
      threshold = 'CRITICAL';
    } else if (sanity <= this.SEVERE) {
      threshold = 'SEVERE';
    } else if (sanity <= this.MODERATE) {
      threshold = 'MODERATE';
    }
    
    if (threshold && this.onThresholdCross) {
      this.onThresholdCross(threshold, sanity);
    }
    
    // Enable gaslighting below 50%
    this.isGaslighting = sanity < this.MODERATE;
  }
  
  updateGaslighting(delta) {
    if (!this.isGaslighting) return;
    
    this.gaslightTimer += delta;
    
    // Trigger hallucinations based on sanity
    const hallucinationChance = this.effects.hallucination * 0.01;
    if (Math.random() < hallucinationChance && Date.now() - this.lastHallucinationTime > 5000) {
      this.game.triggerHallucination('visual', this.effects.hallucination);
      this.lastHallucinationTime = Date.now();
    }
  }
  
  // Called when player is near enemy
  addProximityDrain(intensity) {
    this.proximityDrain = Math.max(this.proximityDrain, intensity * 0.5);
  }
  
  // Called when mic detects fear/scream
  onFearSpike(intensity) {
    this.fearLevel = Math.min(100, this.fearLevel + intensity * 30);
    this.fearDrain = intensity * 2;
    
    // Immediate sanity hit
    this.individualSanity = Math.max(0, this.individualSanity - intensity * 5);
  }
  
  // Get effective sanity (blend of shared and individual)
  getEffectiveSanity() {
    return this.sharedSanity * 0.6 + this.individualSanity * 0.4;
  }
  
  // Get current effects for rendering
  getEffects() {
    return { ...this.effects };
  }
  
  // Get current phase
  getCurrentPhase() {
    const sanity = this.getEffectiveSanity();
    if (sanity > this.MILD_DISTORTION) return 'NORMAL';
    if (sanity > this.MODERATE) return 'MILD_DISTORTION';
    if (sanity > this.SEVERE) return 'MODERATE';
    if (sanity > this.CRITICAL) return 'SEVERE';
    if (sanity > this.DEAD) return 'CRITICAL';
    return 'DEAD';
  }
  
  // Check if UI should lie (gaslighting active)
  shouldGaslight() {
    return this.isGaslighting;
  }
  
  // Get corrupted UI values (for HUD)
  getCorruptedValues(realHealth, realAmmo) {
    if (!this.isGaslighting) {
      return { health: realHealth, ammo: realAmmo };
    }
    
    const corruption = this.effects.uiCorruption;
    const lieType = this.getLieType();
    
    let fakeHealth = realHealth;
    let fakeAmmo = realAmmo;
    
    switch (lieType) {
      case 'subtle_drift':
        // Slowly drift away from truth
        fakeHealth = realHealth + (Math.random() - 0.5) * 20 * corruption;
        fakeAmmo = realAmmo + Math.floor((Math.random() - 0.5) * 10 * corruption);
        break;
        
      case 'random_spikes':
        // Occasionally show fake damage
        if (Math.random() < 0.1 * corruption) {
          fakeHealth = Math.max(0, realHealth - 30 * corruption);
        }
        break;
        
      case 'inversion':
        // Show inverted values
        fakeHealth = 100 - realHealth;
        fakeAmmo = 30 - realAmmo;
        break;
        
      case 'chaos':
        // Completely random but trending toward death
        fakeHealth = Math.max(0, realHealth - Math.random() * 40 * corruption);
        fakeAmmo = Math.max(0, realAmmo - Math.floor(Math.random() * 15 * corruption));
        break;
    }
    
    return {
      health: Math.max(0, Math.min(100, fakeHealth)),
      ammo: Math.max(0, Math.min(30, fakeAmmo))
    };
  }
  
  getLieType() {
    const sanity = this.getEffectiveSanity();
    if (sanity > 40) return 'subtle_drift';
    if (sanity > 30) return 'random_spikes';
    if (sanity > 20) return 'inversion';
    return 'chaos';
  }
  
  // Utility functions
  smoothStep(value, min, max) {
    const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return t * t * (3 - 2 * t);
  }
  
  lerp(a, b, t) {
    return a + (b - a) * Math.min(t, 1);
  }
  
  // Manual sanity adjustment (for pickups, events)
  adjustSanity(amount) {
    this.individualSanity = Math.max(0, Math.min(100, this.individualSanity + amount));
    this.sharedSanity = Math.max(0, Math.min(100, this.sharedSanity + amount * 0.5));
  }
  
  // Reset sanity (for new round)
  reset() {
    this.sharedSanity = 100;
    this.individualSanity = 100;
    this.fearLevel = 0;
    this.proximityDrain = 0;
    this.fearDrain = 0;
    this.isGaslighting = false;
  }
}
