/**
 * @fileoverview Protocol Room - Asymmetric multiplayer network schema.
 * 
 * This module implements the Colyseus room for the Diver/Anchor asymmetric co-op system:
 * - Diver: Receives 3D environment, handles FPS input, physics, local hallucinations
 * - Anchor: Receives 2D schematic, telemetry data, has interactive abilities
 * - Delta compression for state changes
 * - Client-side prediction with server reconciliation
 * - Interest management (only send relevant data)
 * 
 * Architecture:
 * - Schema-based state synchronization
 * - Role-based message routing
 * - Delta compression for bandwidth optimization
 * - Server-authoritative with client prediction
 * 
 * @author The Lucid Protocol Team
 * @version 1.0.0
 */

import { Room, Client } from 'colyseus';
import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';

// ═══════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════

/**
 * Client role types
 */
export type ClientRole = 'diver' | 'anchor';

/**
 * Diver message types (client → server)
 */
export type DiverMessageType =
  | 'move'
  | 'look'
  | 'shoot'
  | 'interact'
  | 'fear_spike'
  | 'hallucination_ack';

/**
 * Anchor message types (client → server)
 */
export type AnchorMessageType =
  | 'unlock_door'
  | 'suppress_nrl'
  | 'ping_enemy'
  | 'request_telemetry';

/**
 * Server message types (server → client)
 */
export type ServerMessageType =
  | 'diver_state'
  | 'anchor_state'
  | 'hallucination'
  | 'environment_shift'
  | 'enemy_spawn'
  | 'enemy_update'
  | 'nrl_update'
  | 'ability_cooldown';

// ═══════════════════════════════════════════════════════════
// STATE SCHEMAS
// ═══════════════════════════════════════════════════════════

/**
 * Diver state - represents the FPS player
 */
export class DiverState extends Schema {
  @type('string') sessionId: string = '';
  @type('string') name: string = '';
  
  // Position & rotation
  @type('number') x: number = 0;
  @type('number') y: number = 1.7;
  @type('number') z: number = 0;
  @type('number') rotX: number = 0;
  @type('number') rotY: number = 0;
  
  // Vitals
  @type('number') health: number = 100;
  @type('number') nrl: number = 0; // Neural Rejection Level
  @type('number') stamina: number = 100;
  @type('number') flashlightBattery: number = 100;
  @type('boolean') flashlightOn: boolean = false;
  
  // Inventory
  @type('number') ammo: number = 12;
  @type('number') maxAmmo: number = 30;
  
  // State
  @type('boolean') isAlive: boolean = true;
  @type('boolean') isCrouching: boolean = false;
  @type('boolean') isSprinting: boolean = false;
  
  // Hallucinations (per-diver)
  @type(['string']) activeHallucinations: string[] = [];
  
  // Timestamps for prediction
  @type('number') lastInputSequence: number = 0;
  @type('number') serverTimestamp: number = 0;
}

/**
 * Anchor state - represents the support player
 */
export class AnchorState extends Schema {
  @type('string') sessionId: string = '';
  @type('string') name: string = '';
  @type('string') linkedDiverId: string = '';
  
  // Telemetry (what Anchor sees about Diver)
  @type('number') diverNRL: number = 0;
  @type('number') diverHealth: number = 100;
  @type('number') diverHeartRate: number = 70;
  @type('number') diverStamina: number = 100;
  
  // Diver position (for mini-map)
  @type('number') diverX: number = 0;
  @type('number') diverZ: number = 0;
  @type('number') diverRotY: number = 0;
  
  // Abilities
  @type('number') unlockDoorCooldown: number = 0;
  @type('number') suppressNRLCooldown: number = 0;
  @type('number') pingEnemyCooldown: number = 0;
  
  // Resources
  @type('number') energy: number = 100;
  @type('number') maxEnergy: number = 100;
}

/**
 * Enemy state - shared between both clients
 */
export class EnemyState extends Schema {
  @type('string') id: string = '';
  @type('string') type: string = 'twitcher';
  
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;
  @type('number') rotY: number = 0;
  
  @type('number') health: number = 100;
  @type('string') state: string = 'patrol';
  @type('boolean') isHallucination: boolean = false;
  
  @type('number') lastUpdate: number = 0;
}

/**
 * Environment state - shared environment data
 */
export class EnvironmentState extends Schema {
  @type('number') nrl: number = 0; // Global NRL
  @type('string') phase: string = 'normal'; // normal, distorted, otherworld
  @type('number') environmentShift: number = 0; // 0-3, which reality layer
  
  // Active mutations
  @type(['string']) activeMutations: string[] = [];
  
  // Doors
  @type('map', DoorState) doors: MapSchema<DoorState> = new MapSchema();
  
  // Interactive objects
  @type('map', InteractiveObjectState) objects: MapSchema<InteractiveObjectState> = new MapSchema();
}

/**
 * Door state
 */
export class DoorState extends Schema {
  @type('string') id: string = '';
  @type('boolean') isLocked: boolean = true;
  @type('boolean') isOpen: boolean = false;
  @type('string') requiredKey: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;
}

/**
 * Interactive object state
 */
export class InteractiveObjectState extends Schema {
  @type('string') id: string = '';
  @type('string') type: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;
  @type('boolean') collected: boolean = false;
}

/**
 * Room state - root schema
 */
export class ProtocolRoomState extends Schema {
  @type('string') phase: string = 'lobby'; // lobby, diving, escape
  @type('number') roundTimer: number = 900; // 15 minutes
  
  @type(DiverState) diver: DiverState = new DiverState();
  @type(AnchorState) anchor: AnchorState = new AnchorState();
  
  @type('map', EnemyState) enemies: MapSchema<EnemyState> = new MapSchema();
  @type(EnvironmentState) environment: EnvironmentState = new EnvironmentState();
  
  // Communication
  @type(['string']) messages: string[] = [];
}

// ═══════════════════════════════════════════════════════════
// PROTOCOL ROOM
// ═══════════════════════════════════════════════════════════

/**
 * Protocol Room - manages asymmetric Diver/Anchor gameplay.
 * 
 * @example
 * ```typescript
 * // Server
 * gameServer.define("protocol", ProtocolRoom);
 * 
 * // Diver client
 * const room = await client.join("protocol", { role: "diver", name: "Player1" });
 * 
 * // Anchor client
 * const room = await client.join("protocol", { role: "anchor", name: "Support1" });
 * ```
 */
export class ProtocolRoom extends Room<ProtocolRoomState> {
  maxClients = 2; // One diver, one anchor
  
  // Client roles
  private clientRoles: Map<string, ClientRole> = new Map();
  
  // Input sequences for prediction
  private diverInputSequence: number = 0;
  
  // Cooldowns
  private abilityCooldowns: Map<string, number> = new Map();
  
  // Enemy spawn timer
  private enemySpawnTimer: number = 0;
  
  /**
   * Room creation - initialize state and systems.
   */
  onCreate(options: { levelId?: string } = {}): void {
    this.setState(new ProtocolRoomState());
    
    // Initialize environment
    this.state.environment.nrl = 0;
    this.state.environment.phase = 'normal';
    
    // Start round timer
    this.clock.setInterval(() => {
      if (this.state.phase === 'diving') {
        this.state.roundTimer--;
        
        if (this.state.roundTimer <= 0) {
          this.endRound();
        }
      }
    }, 1000);
    
    // NRL decay
    this.clock.setInterval(() => {
      this.updateNRL();
    }, 1000);
    
    // Enemy spawning
    this.clock.setInterval(() => {
      this.spawnEnemy();
    }, 10000);
    
    // Ability cooldown updates
    this.clock.setInterval(() => {
      this.updateAbilityCooldowns();
    }, 1000);
    
    console.log(`[ProtocolRoom] Created room ${this.roomId}`);
  }
  
  /**
   * Client joins - assign role and initialize.
   */
  onJoin(client: Client, options: { role: ClientRole; name: string }): void {
    const role = options.role || 'diver';
    this.clientRoles.set(client.sessionId, role);
    
    if (role === 'diver') {
      this.state.diver.sessionId = client.sessionId;
      this.state.diver.name = options.name || 'Diver';
      this.state.diver.x = 0;
      this.state.diver.y = 1.7;
      this.state.diver.z = 0;
      
      // Link anchor to this diver
      if (this.state.anchor.sessionId) {
        this.state.anchor.linkedDiverId = client.sessionId;
      }
      
      client.send('role_assigned', { role: 'diver' });
    } else {
      this.state.anchor.sessionId = client.sessionId;
      this.state.anchor.name = options.name || 'Anchor';
      
      // Link to diver if exists
      if (this.state.diver.sessionId) {
        this.state.anchor.linkedDiverId = this.state.diver.sessionId;
      }
      
      client.send('role_assigned', { role: 'anchor' });
    }
    
    console.log(`[ProtocolRoom] ${options.name} joined as ${role}`);
    
    // Start diving when both players join
    if (this.state.diver.sessionId && this.state.anchor.sessionId) {
      this.state.phase = 'diving';
      this.broadcast('game_start', { timestamp: Date.now() });
    }
  }
  
  /**
   * Message handling - route based on role.
   */
  onMessage(client: Client, messageType: string, data: unknown): void {
    const role = this.clientRoles.get(client.sessionId);
    
    if (role === 'diver') {
      this.handleDiverMessage(client, messageType as DiverMessageType, data);
    } else if (role === 'anchor') {
      this.handleAnchorMessage(client, messageType as AnchorMessageType, data);
    }
  }
  
  /**
   * Client leaves - cleanup.
   */
  onLeave(client: Client, consented: boolean): void {
    const role = this.clientRoles.get(client.sessionId);
    
    if (role === 'diver') {
      this.state.diver.sessionId = '';
    } else if (role === 'anchor') {
      this.state.anchor.sessionId = '';
    }
    
    this.clientRoles.delete(client.sessionId);
    
    console.log(`[ProtocolRoom] Client left: ${client.sessionId}`);
  }
  
  /**
   * Room disposal - cleanup.
   */
  onDispose(): void {
    console.log(`[ProtocolRoom] Disposing room ${this.roomId}`);
  }
  
  // ═══════════════════════════════════════════════════════════
  // DIVER MESSAGE HANDLERS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Handles messages from the Diver client.
   */
  private handleDiverMessage(client: Client, type: DiverMessageType, data: unknown): void {
    switch (type) {
      case 'move':
        this.handleDiverMove(client, data as { x: number; y: number; z: number; sequence: number });
        break;
        
      case 'look':
        this.handleDiverLook(client, data as { rotX: number; rotY: number });
        break;
        
      case 'shoot':
        this.handleDiverShoot(client, data as { targetId?: string });
        break;
        
      case 'interact':
        this.handleDiverInteract(client, data as { objectId: string });
        break;
        
      case 'fear_spike':
        this.handleFearSpike(client, data as { intensity: number });
        break;
        
      case 'hallucination_ack':
        this.handleHallucinationAck(client, data as { hallucinationId: string });
        break;
    }
  }
  
  /**
   * Handles diver movement with client-side prediction support.
   */
  private handleDiverMove(client: Client, data: { x: number; y: number; z: number; sequence: number }): void {
    // Validate position (anti-cheat)
    if (!this.validatePosition(data)) {
      // Send correction to client
      client.send('position_correction', {
        x: this.state.diver.x,
        y: this.state.diver.y,
        z: this.state.diver.z,
        sequence: data.sequence
      });
      return;
    }
    
    // Update state
    this.state.diver.x = data.x;
    this.state.diver.y = data.y;
    this.state.diver.z = data.z;
    this.state.diver.lastInputSequence = data.sequence;
    this.state.diver.serverTimestamp = Date.now();
    
    // Update anchor telemetry
    this.state.anchor.diverX = data.x;
    this.state.anchor.diverZ = data.z;
    this.state.anchor.diverRotY = this.state.diver.rotY;
  }
  
  /**
   * Handles diver look direction.
   */
  private handleDiverLook(client: Client, data: { rotX: number; rotY: number }): void {
    this.state.diver.rotX = data.rotX;
    this.state.diver.rotY = data.rotY;
  }
  
  /**
   * Handles diver shooting.
   */
  private handleDiverShoot(client: Client, data: { targetId?: string }): void {
    if (this.state.diver.ammo <= 0) return;
    
    this.state.diver.ammo--;
    
    // Check if hit enemy
    if (data.targetId) {
      const enemy = this.state.enemies.get(data.targetId);
      if (enemy) {
        enemy.health -= 25;
        
        if (enemy.health <= 0) {
          this.state.enemies.delete(data.targetId);
        }
      }
    }
    
    // Broadcast to anchor (for audio/visual feedback)
    this.sendToAnchor('diver_shot', {
      position: { x: this.state.diver.x, y: this.state.diver.y, z: this.state.diver.z }
    });
  }
  
  /**
   * Handles diver interaction with objects.
   */
  private handleDiverInteract(client: Client, data: { objectId: string }): void {
    const obj = this.state.environment.objects.get(data.objectId);
    if (obj && !obj.collected) {
      obj.collected = true;
      
      // Send to anchor for UI update
      this.sendToAnchor('object_collected', { objectId: data.objectId });
    }
  }
  
  /**
   * Handles fear spike from microphone.
   */
  private handleFearSpike(client: Client, data: { intensity: number }): void {
    // Increase NRL
    this.state.diver.nrl = Math.min(100, this.state.diver.nrl + data.intensity * 10);
    this.state.environment.nrl = this.state.diver.nrl;
    
    // Spawn enemy near diver
    this.spawnEnemyNearDiver();
    
    // Notify anchor
    this.sendToAnchor('fear_spike', { intensity: data.intensity });
  }
  
  /**
   * Handles hallucination acknowledgment.
   */
  private handleHallucinationAck(client: Client, data: { hallucinationId: string }): void {
    // Remove from diver's active list
    const idx = this.state.diver.activeHallucinations.indexOf(data.hallucinationId);
    if (idx >= 0) {
      this.state.diver.activeHallucinations.splice(idx, 1);
    }
  }
  
  // ═══════════════════════════════════════════════════════════
  // ANCHOR MESSAGE HANDLERS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Handles messages from the Anchor client.
   */
  private handleAnchorMessage(client: Client, type: AnchorMessageType, data: unknown): void {
    switch (type) {
      case 'unlock_door':
        this.handleUnlockDoor(client, data as { doorId: string });
        break;
        
      case 'suppress_nrl':
        this.handleSuppressNRL(client, data as { amount: number });
        break;
        
      case 'ping_enemy':
        this.handlePingEnemy(client, data as { enemyId: string });
        break;
        
      case 'request_telemetry':
        this.handleRequestTelemetry(client);
        break;
    }
  }
  
  /**
   * Handles door unlock ability.
   */
  private handleUnlockDoor(client: Client, data: { doorId: string }): void {
    // Check cooldown
    const cooldownKey = 'unlock_door';
    if (this.abilityCooldowns.has(cooldownKey)) {
      client.send('ability_cooldown', { ability: cooldownKey });
      return;
    }
    
    // Check energy
    if (this.state.anchor.energy < 20) {
      client.send('insufficient_energy', { required: 20 });
      return;
    }
    
    const door = this.state.environment.doors.get(data.doorId);
    if (door && door.isLocked) {
      door.isLocked = false;
      door.isOpen = true;
      
      // Consume energy
      this.state.anchor.energy -= 20;
      
      // Set cooldown (30 seconds)
      this.abilityCooldowns.set(cooldownKey, Date.now() + 30000);
      this.state.anchor.unlockDoorCooldown = 30;
      
      // Notify diver
      this.sendToDiver('door_unlocked', { doorId: data.doorId });
    }
  }
  
  /**
   * Handles NRL suppression ability.
   */
  private handleSuppressNRL(client: Client, data: { amount: number }): void {
    const cooldownKey = 'suppress_nrl';
    if (this.abilityCooldowns.has(cooldownKey)) {
      client.send('ability_cooldown', { ability: cooldownKey });
      return;
    }
    
    if (this.state.anchor.energy < 30) {
      client.send('insufficient_energy', { required: 30 });
      return;
    }
    
    // Suppress NRL
    const amount = Math.min(data.amount, 20);
    this.state.diver.nrl = Math.max(0, this.state.diver.nrl - amount);
    this.state.environment.nrl = this.state.diver.nrl;
    
    // Consume energy
    this.state.anchor.energy -= 30;
    
    // Set cooldown (60 seconds)
    this.abilityCooldowns.set(cooldownKey, Date.now() + 60000);
    this.state.anchor.suppressNRLCooldown = 60;
    
    // Notify diver
    this.sendToDiver('nrl_suppressed', { amount });
  }
  
  /**
   * Handles enemy ping ability.
   */
  private handlePingEnemy(client: Client, data: { enemyId: string }): void {
    const cooldownKey = 'ping_enemy';
    if (this.abilityCooldowns.has(cooldownKey)) {
      client.send('ability_cooldown', { ability: cooldownKey });
      return;
    }
    
    if (this.state.anchor.energy < 10) {
      client.send('insufficient_energy', { required: 10 });
      return;
    }
    
    const enemy = this.state.enemies.get(data.enemyId);
    if (enemy) {
      // Consume energy
      this.state.anchor.energy -= 10;
      
      // Set cooldown (15 seconds)
      this.abilityCooldowns.set(cooldownKey, Date.now() + 15000);
      this.state.anchor.pingEnemyCooldown = 15;
      
      // Notify diver with enemy position
      this.sendToDiver('enemy_pinged', {
        enemyId: data.enemyId,
        position: { x: enemy.x, y: enemy.y, z: enemy.z }
      });
    }
  }
  
  /**
   * Handles telemetry request.
   */
  private handleRequestTelemetry(client: Client): void {
    client.send('telemetry_update', {
      nrl: this.state.diver.nrl,
      health: this.state.diver.health,
      heartRate: 70 + (this.state.diver.nrl * 0.5),
      stamina: this.state.diver.stamina,
      position: { x: this.state.diver.x, z: this.state.diver.z },
      rotation: this.state.diver.rotY
    });
  }
  
  // ═══════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Validates diver position (anti-cheat).
   */
  private validatePosition(pos: { x: number; y: number; z: number }): boolean {
    const BOUNDS = 50;
    return (
      Math.abs(pos.x) < BOUNDS &&
      Math.abs(pos.y) < BOUNDS &&
      Math.abs(pos.z) < BOUNDS
    );
  }
  
  /**
   * Sends message to Diver client only.
   */
  private sendToDiver(type: string, data: unknown): void {
    if (this.state.diver.sessionId) {
      const diverClient = this.clients.find(c => c.sessionId === this.state.diver.sessionId);
      if (diverClient) {
        diverClient.send(type, data);
      }
    }
  }
  
  /**
   * Sends message to Anchor client only.
   */
  private sendToAnchor(type: string, data: unknown): void {
    if (this.state.anchor.sessionId) {
      const anchorClient = this.clients.find(c => c.sessionId === this.state.anchor.sessionId);
      if (anchorClient) {
        anchorClient.send(type, data);
      }
    }
  }
  
  /**
   * Updates NRL (decay over time).
   */
  private updateNRL(): void {
    // Slow decay
    this.state.diver.nrl = Math.max(0, this.state.diver.nrl - 0.5);
    this.state.environment.nrl = this.state.diver.nrl;
    
    // Update anchor telemetry
    this.state.anchor.diverNRL = this.state.diver.nrl;
    this.state.anchor.diverHealth = this.state.diver.health;
  }
  
  /**
   * Spawns an enemy.
   */
  private spawnEnemy(): void {
    if (this.state.enemies.size >= 5) return; // Max enemies
    
    const id = Math.random().toString(36).substr(2, 9);
    const enemy = new EnemyState();
    enemy.id = id;
    enemy.type = Math.random() > 0.5 ? 'twitcher' : 'shadow';
    enemy.x = (Math.random() - 0.5) * 30;
    enemy.y = 0;
    enemy.z = (Math.random() - 0.5) * 30;
    enemy.health = 100;
    enemy.state = 'patrol';
    enemy.lastUpdate = Date.now();
    
    this.state.enemies.set(id, enemy);
    
    // Notify both clients
    this.broadcast('enemy_spawn', { enemy });
  }
  
  /**
   * Spawns enemy near diver (triggered by fear).
   */
  private spawnEnemyNearDiver(): void {
    if (this.state.enemies.size >= 5) return;
    
    const id = Math.random().toString(36).substr(2, 9);
    const enemy = new EnemyState();
    enemy.id = id;
    enemy.type = 'twitcher';
    
    // Spawn near diver but not in direct line of sight
    const angle = Math.random() * Math.PI * 2;
    const distance = 8 + Math.random() * 5;
    enemy.x = this.state.diver.x + Math.cos(angle) * distance;
    enemy.y = 0;
    enemy.z = this.state.diver.z + Math.sin(angle) * distance;
    enemy.health = 100;
    enemy.state = 'chase';
    enemy.lastUpdate = Date.now();
    
    this.state.enemies.set(id, enemy);
    
    // Send hallucination event to diver
    this.sendToDiver('hallucination', {
      id,
      type: 'enemy_spawn',
      position: { x: enemy.x, y: enemy.y, z: enemy.z }
    });
  }
  
  /**
   * Updates ability cooldowns.
   */
  private updateAbilityCooldowns(): void {
    const now = Date.now();
    
    if (this.state.anchor.unlockDoorCooldown > 0) {
      this.state.anchor.unlockDoorCooldown--;
    }
    if (this.state.anchor.suppressNRLCooldown > 0) {
      this.state.anchor.suppressNRLCooldown--;
    }
    if (this.state.anchor.pingEnemyCooldown > 0) {
      this.state.anchor.pingEnemyCooldown--;
    }
    
    // Regenerate energy
    this.state.anchor.energy = Math.min(
      this.state.anchor.maxEnergy,
      this.state.anchor.energy + 2
    );
  }
  
  /**
   * Ends the round.
   */
  private endRound(): void {
    this.state.phase = 'escape';
    this.broadcast('round_end', {
      message: 'EXTRACTION INITIATED',
      timestamp: Date.now()
    });
    
    this.clock.setTimeout(() => {
      this.disconnect();
    }, 10000);
  }
}
