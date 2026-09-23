import React, { useState, useEffect } from 'react';
import HUD from './HUD.jsx';
import CinematicOpening from './CinematicOpening.jsx';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [showCinematic, setShowCinematic] = useState(false);
  const [gameState, setGameState] = useState({
    nrl: 0,
    health: 100,
    ammo: 12,
    maxAmmo: 30,
    reserveAmmo: 48,
    hasWeapon: false,
    showWeaponInfo: false,
    objective: ''
  });
  
  useEffect(() => {
    const handleUpdate = (event) => {
      if (event.detail) {
        setGameState(event.detail);
      }
    };
    
    const handleStartCinematic = () => {
      setShowCinematic(true);
    };
    
    window.addEventListener('gameStateUpdate', handleUpdate);
    window.addEventListener('startCinematic', handleStartCinematic);
    
    return () => {
      window.removeEventListener('gameStateUpdate', handleUpdate);
      window.removeEventListener('startCinematic', handleStartCinematic);
    };
  }, []);
  
  const handleCinematicComplete = () => {
    setShowCinematic(false);
    setGameStarted(true);
  };
  
  return (
    <>
      {showCinematic && (
        <CinematicOpening onComplete={handleCinematicComplete} />
      )}
      
      {gameStarted && (
        <HUD gameState={gameState} />
      )}
      
      {/* Film grain overlay */}
      <div id="film-grain"></div>
    </>
  );
}
