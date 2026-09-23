import React, { useState, useEffect } from 'react';
import HUD from './HUD.jsx';

export default function App() {
  const [gameState, setGameState] = useState({
    nrl: 0,
    health: 100,
    ammo: 12,
    maxAmmo: 30,
    reserveAmmo: 48,
    battery: 100,
    flashlightOn: true,
    enemyCount: 0,
    isMicActive: false,
    fearLevel: 0,
    isOtherworld: false,
    objective: 'Explore the facility',
    isInvulnerable: true
  });
  
  useEffect(() => {
    const handleUpdate = (event) => {
      if (event.detail) {
        setGameState(event.detail);
      }
    };
    
    window.addEventListener('gameStateUpdate', handleUpdate);
    
    return () => {
      window.removeEventListener('gameStateUpdate', handleUpdate);
    };
  }, []);
  
  return (
    <>
      <HUD gameState={gameState} />
      <div className="crt-overlay"></div>
      <div className="vignette"></div>
    </>
  );
}
