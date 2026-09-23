import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './ui/App.jsx';
import { initGame } from './game/core.js';
import './index.css';

let gameInstance = null;
let cinematicCompleted = false;

function startGame() {
  const startScreen = document.getElementById('start-screen');
  if (startScreen) {
    startScreen.style.display = 'none';
  }

  // Show cinematic opening
  const appRoot = document.getElementById('react-root');
  if (appRoot && !cinematicCompleted) {
    const root = ReactDOM.createRoot(appRoot);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Trigger cinematic
    setTimeout(() => {
      const cinematicEvent = new CustomEvent('startCinematic');
      window.dispatchEvent(cinematicEvent);
      cinematicCompleted = true;
    }, 100);
  }

  // Initialize game after cinematic
  setTimeout(() => {
    if (!gameInstance) {
      gameInstance = initGame();
      window.game = gameInstance;
    }
    
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.requestPointerLock();
    }
  }, 15000); // Wait for cinematic to complete
}

document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start-button');
  if (startButton) {
    startButton.addEventListener('click', startGame);
  }

  // Also start on any key press
  document.addEventListener('keydown', (e) => {
    const startScreen = document.getElementById('start-screen');
    if (startScreen && startScreen.style.display !== 'none') {
      startGame();
    }
  });

  // Initial React render for start screen
  const reactRoot = document.getElementById('react-root');
  if (reactRoot) {
    const root = ReactDOM.createRoot(reactRoot);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
});

window.startGame = startGame;
