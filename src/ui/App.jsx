import React, { useState, useEffect } from 'react';
import HUD from './HUD.jsx';

export default function App() {
  const [gameState, setGameState] = useState({
    sanity: 100,
    health: 100,
    ammo: 30,
    maxAmmo: 30,
    enemyCount: 0,
    isMicActive: false,
    fearLevel: 0
  });
  
  useEffect(() => {
    const handleUpdate = (event) => {
      setGameState(event.detail);
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
