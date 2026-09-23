import { Client } from "colyseus.js";

export class NetworkManager {
  constructor(game) {
    this.game = game;
    this.client = null;
    this.room = null;
    this.isConnected = false;
    this.sessionId = null;
    
    // Other players
    this.otherPlayers = new Map();
    
    // Server URL (configurable)
    this.serverUrl = import.meta.env.VITE_SERVER_URL || "ws://localhost:2567";
  }
  
  async connect(playerName = "Diver") {
    try {
      this.client = new Client(this.serverUrl);
      
      this.room = await this.client.joinOrCreate("lucid", {
        name: playerName
      });
      
      this.isConnected = true;
      this.sessionId = this.room.sessionId;
      
      console.log(`[Network] Connected to room ${this.room.id}`);
      console.log(`[Network] Session: ${this.sessionId}`);
      
      // Listen for server messages
      this.setupListeners();
      
      return true;
    } catch (error) {
      console.warn("[Network] Could not connect to server:", error.message);
      console.log("[Network] Running in offline/single-player mode");
      this.isConnected = false;
      return false;
    }
  }
  
  setupListeners() {
    // Welcome message
    this.room.onMessage("welcome", (data) => {
      console.log(`[Network] Welcome! Room: ${data.roomId}, Players: ${data.playerCount}`);
    });
    
    // Hallucination (divergent perception - only for this client)
    this.room.onMessage("hallucination", (data) => {
      console.log(`[Network] Hallucination received: ${data.type}`);
      this.game.triggerHallucination(data.type, data.intensity);
    });
    
    // Fear event from another player
    this.room.onMessage("fearEvent", (data) => {
      console.log(`[Network] Fear event from ${data.playerId}: ${data.intensity}`);
      // Could trigger shared visual effect
    });
    
    // Enemy hit
    this.room.onMessage("enemyHit", (data) => {
      console.log(`[Network] Enemy hit by ${data.shooterId}`);
    });
    
    // Player down
    this.room.onMessage("playerDown", (data) => {
      console.log(`[Network] Player down: ${data.playerId}`);
    });
    
    // Round end
    this.room.onMessage("roundEnd", (data) => {
      console.log(`[Network] Round ending: ${data.message}`);
    });
    
    // State changes
    this.room.state.players.onAdd = (player, sessionId) => {
      console.log(`[Network] Player added: ${sessionId}`);
      this.onPlayerAdded(sessionId, player);
    };
    
    this.room.state.players.onRemove = (player, sessionId) => {
      console.log(`[Network] Player removed: ${sessionId}`);
      this.onPlayerRemoved(sessionId);
    };
    
    this.room.state.players.onChange = (player, sessionId) => {
      this.onPlayerChanged(sessionId, player);
    };
    
    // Connection state
    this.room.onLeave((code) => {
      console.log(`[Network] Left room (code: ${code})`);
      this.isConnected = false;
    });
    
    this.room.onError((code, message) => {
      console.error(`[Network] Error: ${code} - ${message}`);
    });
  }
  
  // ─── Send messages to server ──────────────────────────────
  
  sendMove(position) {
    if (!this.isConnected) return;
    
    this.room.send("move", {
      x: position.x,
      y: position.y,
      z: position.z
    });
  }
  
  sendLook(rotation) {
    if (!this.isConnected) return;
    
    this.room.send("look", {
      rotX: rotation.x,
      rotY: rotation.y
    });
  }
  
  sendShoot(hitData) {
    if (!this.isConnected) return;
    
    this.room.send("shoot", hitData);
  }
  
  sendFearSpike(intensity) {
    if (!this.isConnected) return;
    
    this.room.send("fear_spike", { intensity });
  }
  
  sendDamage(amount) {
    if (!this.isConnected) return;
    
    this.room.send("damage", { amount });
  }
  
  // ─── Player management ────────────────────────────────────
  
  onPlayerAdded(sessionId, playerState) {
    if (sessionId === this.sessionId) return; // Skip self
    
    // Create visual representation of other player
    const playerMesh = this.createPlayerMesh();
    playerMesh.position.set(playerState.x, playerState.y, playerState.z);
    this.game.scene.add(playerMesh);
    
    this.otherPlayers.set(sessionId, {
      mesh: playerMesh,
      state: playerState
    });
  }
  
  onPlayerRemoved(sessionId) {
    const player = this.otherPlayers.get(sessionId);
    if (player) {
      this.game.scene.remove(player.mesh);
      this.otherPlayers.delete(sessionId);
    }
  }
  
  onPlayerChanged(sessionId, playerState) {
    const player = this.otherPlayers.get(sessionId);
    if (player) {
      // Smooth interpolation
      player.mesh.position.lerp(
        { x: playerState.x, y: playerState.y, z: playerState.z },
        0.1
      );
      player.mesh.rotation.y = playerState.rotY;
    }
  }
  
  createPlayerMesh() {
    // Simple capsule representation for other players
    const geometry = new THREE.CapsuleGeometry(0.3, 1.0, 4, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff41,
      wireframe: true
    });
    return new THREE.Mesh(geometry, material);
  }
  
  // ─── Cleanup ──────────────────────────────────────────────
  
  disconnect() {
    if (this.room) {
      this.room.leave();
    }
    this.isConnected = false;
  }
}

// Import THREE for player mesh creation
import * as THREE from 'three';
