import React, { useState, useEffect } from 'react';

// Safe number formatting
function safeNumber(value, fallback = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return value;
}

export default function HUD({ gameState }) {
  const [showWeaponInfo, setShowWeaponInfo] = useState(false);
  const [weaponInfoTimer, setWeaponInfoTimer] = useState(null);
  
  const health = safeNumber(gameState.health, 100);
  const nrl = safeNumber(gameState.nrl, 0);
  const ammo = safeNumber(gameState.ammo, 12);
  const maxAmmo = safeNumber(gameState.maxAmmo, 30);
  const reserveAmmo = safeNumber(gameState.reserveAmmo, 48);
  const hasWeapon = gameState.hasWeapon ?? false;
  
  // Show weapon info briefly when reloading or picking up
  useEffect(() => {
    if (gameState.showWeaponInfo) {
      setShowWeaponInfo(true);
      
      if (weaponInfoTimer) {
        clearTimeout(weaponInfoTimer);
      }
      
      const timer = setTimeout(() => {
        setShowWeaponInfo(false);
      }, 2000);
      
      setWeaponInfoTimer(timer);
    }
  }, [gameState.showWeaponInfo]);
  
  // Update blood vignette based on health
  useEffect(() => {
    const vignette = document.getElementById('blood-vignette');
    if (vignette) {
      const damage = 1 - (health / 100);
      vignette.style.opacity = damage * 0.8;
    }
  }, [health]);
  
  // Update chromatic aberration based on NRL
  useEffect(() => {
    const chromatic = document.getElementById('chromatic-aberration');
    if (chromatic) {
      if (nrl > 30) {
        chromatic.style.opacity = (nrl - 30) / 100;
      } else {
        chromatic.style.opacity = '0';
      }
    }
  }, [nrl]);
  
  return (
    <>
      {/* Weapon Info (Diegetic - only shows when relevant) */}
      {hasWeapon && showWeaponInfo && (
        <div id="weapon-info" className="visible">
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>
            SOMNUS SECURITY PISTOL
          </div>
          <div style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)' }}>
            {ammo} / {reserveAmmo}
          </div>
        </div>
      )}
      
      {/* Objective Marker (Diegetic - appears briefly) */}
      {gameState.objective && (
        <div id="objective-marker" className="visible">
          {gameState.objective}
        </div>
      )}
    </>
  );
}
