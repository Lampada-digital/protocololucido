import React, { useState, useEffect } from 'react';

export default function HUD({ gameState }) {
  const [displayValues, setDisplayValues] = useState({
    health: gameState.health,
    ammo: gameState.ammo,
    sanity: gameState.sanity
  });
  
  const [isGlitching, setIsGlitching] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningText, setWarningText] = useState('');
  
  const isGaslighting = gameState.sanity < 50;
  const corruptionLevel = Math.max(0, (50 - gameState.sanity) / 50);
  
  useEffect(() => {
    if (!isGaslighting) {
      setDisplayValues({
        health: gameState.health,
        ammo: gameState.ammo,
        sanity: gameState.sanity
      });
      return;
    }
    
    // Gaslighting: lie to the player
    const lieType = getLieType(gameState.sanity);
    let fakeHealth = gameState.health;
    let fakeAmmo = gameState.ammo;
    let fakeSanity = gameState.sanity;
    
    switch (lieType) {
      case 'subtle_drift':
        fakeHealth = gameState.health + (Math.random() - 0.5) * 20 * corruptionLevel;
        fakeAmmo = gameState.ammo + Math.floor((Math.random() - 0.5) * 10 * corruptionLevel);
        break;
        
      case 'random_spikes':
        if (Math.random() < 0.15 * corruptionLevel) {
          fakeHealth = Math.max(0, gameState.health - 30 * corruptionLevel);
          fakeAmmo = Math.max(0, gameState.ammo - Math.floor(5 * corruptionLevel));
        }
        break;
        
      case 'inversion':
        fakeHealth = 100 - gameState.health;
        fakeAmmo = 30 - gameState.ammo;
        fakeSanity = 100 - gameState.sanity;
        break;
        
      case 'chaos':
        fakeHealth = Math.max(0, gameState.health - Math.random() * 40 * corruptionLevel);
        fakeAmmo = Math.max(0, gameState.ammo - Math.floor(Math.random() * 15 * corruptionLevel));
        fakeSanity = Math.max(0, gameState.sanity - Math.random() * 20 * corruptionLevel);
        break;
    }
    
    setDisplayValues({
      health: Math.max(0, Math.min(100, fakeHealth)),
      ammo: Math.max(0, Math.min(30, fakeAmmo)),
      sanity: Math.max(0, Math.min(100, fakeSanity))
    });
    
  }, [gameState, isGaslighting, corruptionLevel]);
  
  // Glitch effect
  useEffect(() => {
    if (isGaslighting) {
      const interval = setInterval(() => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 100 + Math.random() * 200);
      }, 2000 + Math.random() * 3000);
      
      return () => clearInterval(interval);
    }
  }, [isGaslighting]);
  
  // Warning messages
  useEffect(() => {
    if (gameState.sanity < 30 && Math.random() < 0.02) {
      const messages = [
        '⚠ CRITICAL DAMAGE DETECTED',
        '⚠ VITAL SIGNS FAILING',
        '⚠ DIVER INTEGRITY: COMPROMISED',
        '⚠ EXTRACTION IMPOSSIBLE',
        '⚠ REALITY UNSTABLE',
        '⚠ THEY SEE YOU'
      ];
      setWarningText(messages[Math.floor(Math.random() * messages.length)]);
      setShowWarning(true);
      
      setTimeout(() => setShowWarning(false), 2000);
    }
  }, [gameState.sanity]);
  
  const getLieType = (sanity) => {
    if (sanity > 40) return 'subtle_drift';
    if (sanity > 30) return 'random_spikes';
    if (sanity > 20) return 'inversion';
    return 'chaos';
  };
  
  const getHealthColor = (health) => {
    if (health > 60) return '#00ff41';
    if (health > 30) return '#ffbf00';
    return '#ff0040';
  };
  
  const getSanityColor = (sanity) => {
    if (sanity > 60) return '#bf00ff';
    if (sanity > 30) return '#ff00ff';
    return '#ff0040';
  };
  
  return (
    <div className="hud-container">
      {/* Objective */}
      <div className="objective-text">
        {gameState.objective}
      </div>
      
      {/* Compass (spins when sanity < 30%) */}
      <div className="compass">
        <div 
          className="compass-needle"
          style={{
            transform: gameState.sanity < 30 
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
                height: `${Math.min(15, gameState.fearLevel * 15 + i * 3)}px`,
                opacity: gameState.fearLevel > 0.1 ? 1 : 0.3
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Main HUD bars */}
      <div className="hud-bar">
        {/* Health */}
        <div className={`hud-item ${isGlitching ? 'hud-glitch' : ''}`}>
          <div className="hud-label">HEALTH</div>
          <div 
            className="hud-value"
            style={{ 
              color: getHealthColor(displayValues.health),
              textShadow: `0 0 10px ${getHealthColor(displayValues.health)}`
            }}
          >
            {Math.round(displayValues.health)}
          </div>
          <div className="hud-bar-fill">
            <div 
              className="hud-bar-inner health-bar"
              style={{ width: `${displayValues.health}%` }}
            />
          </div>
        </div>
        
        {/* Sanity */}
        <div className={`hud-item ${isGlitching ? 'hud-glitch' : ''}`}>
          <div className="hud-label">SANITY</div>
          <div 
            className="hud-value"
            style={{ 
              color: getSanityColor(displayValues.sanity),
              textShadow: `0 0 10px ${getSanityColor(displayValues.sanity)}`
            }}
          >
            {Math.round(displayValues.sanity)}
          </div>
          <div className="hud-bar-fill">
            <div 
              className="hud-bar-inner sanity-bar"
              style={{ width: `${displayValues.sanity}%` }}
            />
          </div>
        </div>
        
        {/* Ammo */}
        <div className={`hud-item ${isGlitching ? 'hud-glitch' : ''}`}>
          <div className="hud-label">AMMO</div>
          <div 
            className="hud-value"
            style={{ 
              color: displayValues.ammo > 10 ? '#00ff41' : '#ff0040',
              textShadow: `0 0 10px ${displayValues.ammo > 10 ? '#00ff41' : '#ff0040'}`
            }}
          >
            {Math.round(displayValues.ammo)} / {gameState.maxAmmo}
          </div>
        </div>
      </div>
      
      {/* Flashlight indicator */}
      <div className="flashlight-indicator">
        <span className="flashlight-icon">
          {gameState.flashlightOn ? '🔦' : '🔌'}
        </span>
        <div style={{ width: '60px' }}>
          <div className="hud-bar-fill">
            <div 
              className="hud-bar-inner battery-bar"
              style={{ width: `${gameState.battery}%` }}
            />
          </div>
        </div>
        <span style={{ fontSize: '0.7rem' }}>{Math.round(gameState.battery)}%</span>
      </div>
      
      {/* Fear indicator */}
      {gameState.fearLevel > 0.1 && (
        <div 
          className="absolute top-20 right-4 font-mono text-sm"
          style={{ 
            color: '#ff0040',
            opacity: gameState.fearLevel,
            textShadow: '0 0 10px #ff0040'
          }}
        >
          FEAR: {Math.round(gameState.fearLevel * 100)}%
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
        THREATS: {gameState.enemyCount}
      </div>
      
      {/* Otherworld indicator */}
      {gameState.isOtherworld && (
        <div 
          className="absolute top-1/2 left-4 font-mono text-xs"
          style={{ 
            color: '#ff0040',
            textShadow: '0 0 10px #ff0040',
            animation: 'pulse 1s infinite'
          }}
        >
          ◈ OTHERWORLD ◈
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
          ◈ PERCEPTION UNSTABLE ◈
        </div>
      )}
    </div>
  );
}
