import React, { useState, useEffect } from 'react';

// Safe number formatting utility
function safeNumber(value, fallback = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return value;
}

function safePercentage(current, maximum) {
  const c = safeNumber(current, 0);
  const m = safeNumber(maximum, 1);
  if (m <= 0) return 0;
  return Math.max(0, Math.min(100, (c / m) * 100));
}

export default function HUD({ gameState }) {
  const [displayValues, setDisplayValues] = useState({
    health: 100,
    nrl: 0,
    ammo: 12,
    reserveAmmo: 48
  });
  
  const [isGlitching, setIsGlitching] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningText, setWarningText] = useState('');
  
  // Safe value extraction
  const health = safeNumber(gameState.health, 100);
  const nrl = safeNumber(gameState.nrl, 0);
  const ammo = safeNumber(gameState.ammo, 12);
  const maxAmmo = safeNumber(gameState.maxAmmo, 30);
  const reserveAmmo = safeNumber(gameState.reserveAmmo, 48);
  const battery = safeNumber(gameState.battery, 100);
  const flashlightOn = gameState.flashlightOn ?? true;
  const fearLevel = safeNumber(gameState.fearLevel, 0);
  const enemyCount = safeNumber(gameState.enemyCount, 0);
  const isOtherworld = gameState.isOtherworld ?? false;
  const objective = gameState.objective || 'Explore the facility';
  
  // Gaslighting logic - NRL > 50 means UI becomes unreliable
  const isGaslighting = nrl > 50;
  const corruptionLevel = Math.max(0, (nrl - 50) / 50);
  
  useEffect(() => {
    if (!isGaslighting) {
      setDisplayValues({
        health,
        nrl,
        ammo,
        reserveAmmo
      });
      return;
    }
    
    // Gaslighting: lie to the player based on NRL
    const lieType = getLieType(nrl);
    let fakeHealth = health;
    let fakeAmmo = ammo;
    let fakeNrl = nrl;
    
    switch (lieType) {
      case 'subtle_drift':
        fakeHealth = health + (Math.random() - 0.5) * 15 * corruptionLevel;
        fakeAmmo = ammo + Math.floor((Math.random() - 0.5) * 6 * corruptionLevel);
        break;
        
      case 'random_spikes':
        if (Math.random() < 0.1 * corruptionLevel) {
          fakeHealth = Math.max(0, health - 25 * corruptionLevel);
        }
        break;
        
      case 'inversion':
        fakeHealth = 100 - health;
        fakeNrl = 100 - nrl;
        break;
        
      case 'chaos':
        fakeHealth = Math.max(0, health - Math.random() * 30 * corruptionLevel);
        fakeAmmo = Math.max(0, ammo - Math.floor(Math.random() * 10 * corruptionLevel));
        break;
    }
    
    setDisplayValues({
      health: Math.max(0, Math.min(100, fakeHealth)),
      nrl: Math.max(0, Math.min(100, fakeNrl)),
      ammo: Math.max(0, Math.min(maxAmmo, fakeAmmo)),
      reserveAmmo
    });
    
  }, [health, nrl, ammo, reserveAmmo, maxAmmo, isGaslighting, corruptionLevel]);
  
  // Glitch effect
  useEffect(() => {
    if (isGaslighting) {
      const interval = setInterval(() => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 100 + Math.random() * 150);
      }, 3000 + Math.random() * 4000);
      
      return () => clearInterval(interval);
    }
  }, [isGaslighting]);
  
  // Warning messages at high NRL
  useEffect(() => {
    if (nrl > 70 && Math.random() < 0.01) {
      const messages = [
        '◈ NEURAL INTEGRITY FAILING',
        '◈ COGNITIVE COHERENCE: LOW',
        '◈ MEMORY FRAGMENTATION DETECTED',
        '◈ PROTOCOL 12 ACTIVE',
        '◈ REALITY STABILITY: COMPROMISED'
      ];
      setWarningText(messages[Math.floor(Math.random() * messages.length)]);
      setShowWarning(true);
      
      setTimeout(() => setShowWarning(false), 2000);
    }
  }, [nrl]);
  
  const getLieType = (nrlValue) => {
    if (nrlValue < 60) return 'subtle_drift';
    if (nrlValue < 70) return 'random_spikes';
    if (nrlValue < 85) return 'inversion';
    return 'chaos';
  };
  
  const getHealthColor = (h) => {
    if (h > 60) return '#00ff41';
    if (h > 30) return '#ffbf00';
    return '#ff0040';
  };
  
  const getNrlColor = (n) => {
    if (n < 20) return '#00ff41'; // Stable
    if (n < 40) return '#ffbf00'; // Minor anomalies
    if (n < 60) return '#ff8800'; // Psychological instability
    if (n < 80) return '#ff0040'; // Severe degradation
    return '#ff0000'; // Critical
  };
  
  const getNrlLabel = (n) => {
    if (n < 20) return 'STABLE';
    if (n < 40) return 'MINOR ANOMALIES';
    if (n < 60) return 'UNSTABLE';
    if (n < 80) return 'DEGRADING';
    return 'CRITICAL';
  };
  
  return (
    <div className="hud-container">
      {/* Objective */}
      <div className="objective-text">
        {objective}
      </div>
      
      {/* Compass */}
      <div className="compass">
        <div 
          className="compass-needle"
          style={{
            transform: nrl > 70 
              ? `rotate(${Math.random() * 360}deg)` 
              : 'rotate(0deg)'
          }}
        />
      </div>
      
      {/* Radio static indicator */}
      <div className="radio-static">
        <span>RADIO</span>
        <div className="static-bars">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="static-bar"
              style={{
                height: `${Math.min(15, fearLevel * 15 + i * 3)}px`,
                opacity: fearLevel > 0.1 ? 1 : 0.3
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Main HUD bars */}
      <div className="hud-bar">
        {/* Health - Bottom Left */}
        <div className={`hud-item ${isGlitching ? 'hud-glitch' : ''}`}>
          <div className="hud-label">HEALTH</div>
          <div 
            className="hud-value"
            style={{ 
              color: getHealthColor(displayValues.health),
              textShadow: `0 0 10px ${getHealthColor(displayValues.health)}`
            }}
          >
            {Math.round(safeNumber(displayValues.health, 100))}
          </div>
          <div className="hud-bar-fill">
            <div 
              className="hud-bar-inner health-bar"
              style={{ width: `${safePercentage(displayValues.health, 100)}%` }}
            />
          </div>
        </div>
        
        {/* NRL - Bottom Center */}
        <div className={`hud-item ${isGlitching ? 'hud-glitch' : ''}`}>
          <div className="hud-label">NEURAL REJECTION</div>
          <div 
            className="hud-value"
            style={{ 
              color: getNrlColor(displayValues.nrl),
              textShadow: `0 0 10px ${getNrlColor(displayValues.nrl)}`
            }}
          >
            {Math.round(safeNumber(displayValues.nrl, 0))}%
          </div>
          <div className="hud-bar-fill">
            <div 
              className="hud-bar-inner sanity-bar"
              style={{ 
                width: `${safePercentage(displayValues.nrl, 100)}%`,
                background: `linear-gradient(90deg, ${getNrlColor(displayValues.nrl)}, ${getNrlColor(displayValues.nrl)}88)`
              }}
            />
          </div>
          <div style={{ fontSize: '0.6rem', color: getNrlColor(displayValues.nrl), marginTop: '0.2rem' }}>
            {getNrlLabel(displayValues.nrl)}
          </div>
        </div>
        
        {/* Ammo - Bottom Right */}
        <div className={`hud-item ${isGlitching ? 'hud-glitch' : ''}`}>
          <div className="hud-label">AMMO</div>
          <div 
            className="hud-value"
            style={{ 
              color: ammo > 5 ? '#00ff41' : '#ff0040',
              textShadow: `0 0 10px ${ammo > 5 ? '#00ff41' : '#ff0040'}`
            }}
          >
            {Math.round(safeNumber(displayValues.ammo, 0))} / {safeNumber(reserveAmmo, 0)}
          </div>
          <div className="hud-bar-fill">
            <div 
              className="hud-bar-inner ammo-bar"
              style={{ width: `${safePercentage(displayValues.ammo, maxAmmo)}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Flashlight indicator */}
      <div className="flashlight-indicator">
        <span className="flashlight-icon">
          {flashlightOn ? '🔦' : '🔌'}
        </span>
        <div style={{ width: '60px' }}>
          <div className="hud-bar-fill">
            <div 
              className="hud-bar-inner battery-bar"
              style={{ width: `${safePercentage(battery, 100)}%` }}
            />
          </div>
        </div>
        <span style={{ fontSize: '0.7rem' }}>{Math.round(safeNumber(battery, 100))}%</span>
      </div>
      
      {/* Fear indicator */}
      {fearLevel > 0.1 && (
        <div 
          className="absolute top-20 right-4 font-mono text-sm"
          style={{ 
            color: '#ff0040',
            opacity: fearLevel,
            textShadow: '0 0 10px #ff0040'
          }}
        >
          FEAR: {Math.round(fearLevel * 100)}%
        </div>
      )}
      
      {/* Mic status */}
      <div className="absolute top-16 left-4 font-mono text-xs">
        <span style={{ color: gameState.isMicActive ? '#00ff41' : '#666' }}>
          MIC: {gameState.isMicActive ? 'ACTIVE' : 'OFF'}
        </span>
        {!gameState.isMicActive && (
          <span className="ml-2 text-gray-600">(Press M)</span>
        )}
      </div>
      
      {/* Enemy count */}
      <div className="absolute top-24 left-4 font-mono text-xs text-gray-500">
        HOSTILES: {enemyCount}
      </div>
      
      {/* Otherworld indicator */}
      {isOtherworld && (
        <div 
          className="absolute top-1/2 left-4 font-mono text-xs"
          style={{ 
            color: '#ff0040',
            textShadow: '0 0 10px #ff0040',
            animation: 'pulse 1s infinite'
          }}
        >
          ◈ COGNITIVE SHIFT ACTIVE ◈
        </div>
      )}
      
      {/* Warning overlay */}
      {showWarning && (
        <div className="hud-warning">
          {warningText}
        </div>
      )}
      
      {/* Gaslighting indicator */}
      {isGaslighting && (
        <div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 font-mono text-xs"
          style={{ 
            color: '#ff0040',
            opacity: 0.3 + Math.sin(Date.now() * 0.005) * 0.2
          }}
        >
          ◈ PERCEPTION UNRELIABLE ◈
        </div>
      )}
      
      {/* Invulnerability indicator */}
      {gameState.isInvulnerable && (
        <div 
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 font-mono text-sm text-center"
          style={{ 
            color: '#00aaff',
            textShadow: '0 0 10px #00aaff',
            opacity: 0.8
          }}
        >
          <div>NEURAL INTERFACE CALIBRATING</div>
          <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.5rem' }}>
            Use WASD to move | F for flashlight | Click to shoot
          </div>
        </div>
      )}
    </div>
  );
}
