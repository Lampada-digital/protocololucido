import React from 'react';
import ReactDOM from 'react-dom/client';
import { initGame } from './game/core.js';
import './index.css';

let gameInstance = null;

function startGame() {
  console.log('[Lucid Protocol] Starting game...');
  
  const startScreen = document.getElementById('start-screen');
  if (startScreen) {
    startScreen.style.display = 'none';
    console.log('[Lucid Protocol] Start screen hidden');
  }

  // Initialize game
  if (!gameInstance) {
    try {
      console.log('[Lucid Protocol] Initializing game...');
      gameInstance = initGame();
      window.game = gameInstance;
      console.log('[Lucid Protocol] Game initialized successfully');
    } catch (error) {
      console.error('[Lucid Protocol] Failed to initialize game:', error);
      console.error('[Lucid Protocol] Error stack:', error.stack);
      alert('Erro ao inicializar o jogo. Verifique o console para mais detalhes.');
      return;
    }
  }
  
  // Request pointer lock
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    canvas.requestPointerLock();
    console.log('[Lucid Protocol] Pointer lock requested');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Lucid Protocol] DOM loaded');
  
  // Verify canvas exists
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('[Lucid Protocol] Canvas not found!');
    return;
  }
  console.log('[Lucid Protocol] Canvas found');
  
  // Start button
  const startButton = document.getElementById('start-button');
  if (startButton) {
    startButton.addEventListener('click', startGame);
    console.log('[Lucid Protocol] Start button attached');
  } else {
    console.error('[Lucid Protocol] Start button not found!');
  }

  // Also start on any key press
  document.addEventListener('keydown', (e) => {
    const startScreen = document.getElementById('start-screen');
    if (startScreen && startScreen.style.display !== 'none') {
      startGame();
    }
  });
});

window.startGame = startGame;
