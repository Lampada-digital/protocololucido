import { Room, Client } from "colyseus";
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

// ─── State Schemas ──────────────────────────────────────────
class PlayerState extends Schema {
  @type("number") x = 0;
  @type("number") y = 1.6;
  @type("number") z = 0;
  @type("number") rotX = 0;
  @type("number") rotY = 0;
  @type("boolean") isAlive = true;
  @type("number") health = 100;
  @type("number") ammo = 30;
  @type("number") individualSanity = 100;
  @type("string") name = "";
}

class HallucinationState extends Schema {
  @type("string") id = "";
  @type("string") type = "visual";
  @type("number") x = 0;
  @type("number") y = 0.75;
  @type("number") z = 0;
  @type("number") intensity = 1;
  @type("number") duration = 5000;
  @type("string") targetPlayer = "";
  @type("number") timestamp = 0;
}

class GameState extends Schema {
  @type("string") phase = "diving"; // lobby | diving | escape
  @type("number") roundTimer = 900; // 15 min
  @type("number") sharedSanity = 100;
  @type("number") environmentShift = 0;
  @type("map", PlayerState) players = new MapSchema();
  @type("array", HallucinationState) hallucinations = new ArraySchema();
}

// ─── Room Implementation ────────────────────────────────────
export class LucidRoom extends Room {
  maxClients = 4;
  
  onCreate(options) {
    this.setState(new GameState());
    
    // Server-authoritative sanity decay
    this.clock.setInterval(() => {
      this.tickSanityDecay();
    }, 1000);
    
    // Schedule hallucination events
    this.clock.setInterval(() => {
      this.scheduleHallucination();
    }, 8000 + Math.random() * 12000);
    
    // Environment shift timer
    this.clock.setInterval(() => {
      if (this.state.phase === "diving") {
        this.state.environmentShift = (this.state.environmentShift + 1) % 4;
      }
    }, 120000);
    
    // Round timer
    this.clock.setInterval(() => {
      if (this.state.phase === "diving") {
        this.state.roundTimer--;
        if (this.state.roundTimer <= 0) {
          this.endRound();
        }
      }
    }, 1000);
    
    console.log(`[LucidRoom] Created room ${this.roomId}`);
  }
  
  onJoin(client, options) {
    const player = new PlayerState();
    player.name = options.name || `Diver_${client.sessionId.slice(0, 4)}`;
    player.x = Math.random() * 4 - 2;
    player.z = Math.random() * 4 - 2;
    
    this.state.players.set(client.sessionId, player);
    
    console.log(`[LucidRoom] ${player.name} joined (${this.state.players.size}/4)`);
    
    // Send welcome message
    client.send("welcome", {
      roomId: this.roomId,
      playerCount: this.state.players.size,
      roundTimer: this.state.roundTimer
    });
  }
  
  onMessage(client, messageType, data) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    
    switch (messageType) {
      case "move":
        // Client-predicted, server validates bounds
        if (this.validatePosition(data)) {
          player.x = data.x;
          player.y = data.y;
          player.z = data.z;
        }
        break;
        
      case "look":
        player.rotX = data.rotX;
        player.rotY = data.rotY;
        break;
        
      case "shoot":
        // Server validates ammo
        if (player.ammo > 0) {
          player.ammo--;
          
          // Check if hit (simplified)
          if (data.hitEnemy) {
            // Broadcast hit to all players
            this.broadcast("enemyHit", {
              shooterId: client.sessionId,
              enemyId: data.enemyId
            });
          }
        }
        break;
        
      case "fear_spike":
        // Mic detected fear → increase shared sanity drain
        this.state.sharedSanity = Math.max(0, 
          this.state.sharedSanity - data.intensity * 2
        );
        player.individualSanity = Math.max(0,
          player.individualSanity - data.intensity * 3
        );
        
        // Broadcast fear event to all players
        this.broadcast("fearEvent", {
          playerId: client.sessionId,
          intensity: data.intensity
        });
        break;
        
      case "request_hallucination":
        // Client requests personal hallucination
        this.triggerHallucination(client.sessionId, data);
        break;
        
      case "damage":
        player.health = Math.max(0, player.health - data.amount);
        if (player.health <= 0) {
          player.isAlive = false;
          this.broadcast("playerDown", { playerId: client.sessionId });
        }
        break;
    }
  }
  
  onLeave(client, consented) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      console.log(`[LucidRoom] ${player.name} left`);
      this.state.players.delete(client.sessionId);
    }
  }
  
  onDispose() {
    console.log(`[LucidRoom] Disposing room ${this.roomId}`);
  }
  
  // ─── Server Logic ─────────────────────────────────────────
  
  tickSanityDecay() {
    const playerCount = this.state.players.size;
    if (playerCount === 0) return;
    
    const decayRate = 0.15 * (1 + (100 - this.state.sharedSanity) / 200);
    
    this.state.sharedSanity = Math.max(0, this.state.sharedSanity - decayRate);
    
    // Individual sanity affected by personal state
    this.state.players.forEach((player) => {
      player.individualSanity = Math.max(0,
        player.individualSanity - (decayRate * 0.5)
      );
    });
  }
  
  scheduleHallucination() {
    if (this.state.players.size === 0) return;
    
    // Pick a random player to receive hallucination
    const playerIds = Array.from(this.state.players.keys());
    const targetId = playerIds[Math.floor(Math.random() * playerIds.length)];
    const targetPlayer = this.state.players.get(targetId);
    
    if (!targetPlayer || !targetPlayer.isAlive) return;
    
    const hallucination = new HallucinationState();
    hallucination.id = Math.random().toString(36).substr(2, 9);
    hallucination.type = this.getHallucinationType();
    hallucination.x = targetPlayer.x + (Math.random() - 0.5) * 10;
    hallucination.y = 0.75;
    hallucination.z = targetPlayer.z + (Math.random() - 0.5) * 10;
    hallucination.intensity = 1 - (this.state.sharedSanity / 100);
    hallucination.duration = 3000 + Math.random() * 5000;
    hallucination.targetPlayer = targetId;
    hallucination.timestamp = Date.now();
    
    this.state.hallucinations.push(hallucination);
    
    // Send ONLY to target player (divergent perception)
    const targetClient = this.clients.find(c => c.sessionId === targetId);
    if (targetClient) {
      targetClient.send("hallucination", {
        id: hallucination.id,
        type: hallucination.type,
        x: hallucination.x,
        y: hallucination.y,
        z: hallucination.z,
        intensity: hallucination.intensity,
        duration: hallucination.duration
      });
    }
    
    // Clean up after duration
    this.clock.setTimeout(() => {
      const idx = Array.from(this.state.hallucinations).indexOf(hallucination);
      if (idx >= 0) {
        this.state.hallucinations.splice(idx, 1);
      }
    }, hallucination.duration);
  }
  
  triggerHallucination(targetSessionId, data) {
    const hallucination = new HallucinationState();
    hallucination.id = Math.random().toString(36).substr(2, 9);
    hallucination.type = data.type || "visual";
    hallucination.x = data.x || 0;
    hallucination.y = data.y || 0.75;
    hallucination.z = data.z || 0;
    hallucination.intensity = data.intensity || 1;
    hallucination.duration = data.duration || 5000;
    hallucination.targetPlayer = targetSessionId;
    hallucination.timestamp = Date.now();
    
    this.state.hallucinations.push(hallucination);
    
    // Send ONLY to target player
    const targetClient = this.clients.find(c => c.sessionId === targetSessionId);
    if (targetClient) {
      targetClient.send("hallucination", {
        id: hallucination.id,
        type: hallucination.type,
        x: hallucination.x,
        y: hallucination.y,
        z: hallucination.z,
        intensity: hallucination.intensity,
        duration: hallucination.duration
      });
    }
  }
  
  getHallucinationType() {
    const types = ["visual", "audio", "ui_lie", "environment"];
    return types[Math.floor(Math.random() * types.length)];
  }
  
  validatePosition(pos) {
    const BOUNDS = 19;
    return (
      Math.abs(pos.x) < BOUNDS &&
      Math.abs(pos.z) < BOUNDS &&
      pos.y > 0 && pos.y < 4
    );
  }
  
  endRound() {
    this.state.phase = "escape";
    this.broadcast("roundEnd", { 
      message: "EXTRACTION INITIATED",
      sharedSanity: this.state.sharedSanity
    });
    
    this.clock.setTimeout(() => {
      this.disconnect();
    }, 10000);
  }
}
