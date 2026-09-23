import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './ui/App.jsx';
import { initGame } from './game/core.js';
import './index.css';

let gameInstance = null;

function startGame() {
  const startScreen = document.getElementById('start-screen');
  if (startScreen) {
    startScreen.style.display = 'none';
  }

  if (!gameInstance) {
    gameInstance = initGame();
    window.game = gameInstance; // Expose for inventory clicks
  }
  
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    canvas.requestPointerLock();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start-button');
  if (startButton) {
    startButton.addEventListener('click', startGame);
  }

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
