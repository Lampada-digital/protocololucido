/**
 * @fileoverview Utility Enemy AI - Advanced adversary behavior using Behavior Trees.
 * 
 * This module implements a complete Behavior Tree framework with:
 * - Perception system (vision cone + hearing radius)
 * - Utility-based decision making
 * - Communication between enemies (flanking coordination)
 * - Investigation of last known player position
 * - Data-driven behavior configuration
 * 
 * Architecture:
 * - Blackboard pattern for shared state
 * - Composite pattern for tree nodes
 * - Observer pattern for inter-enemy communication
 * - Strategy pattern for different enemy types
 * 
 * @author The Lucid Protocol Team
 * @version 1.0.0
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════

/**
 * Vector3 representation (compatible with Three.js)
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Enemy state types
 */
export type EnemyState =
  | 'idle'
  | 'patrol'
  | 'investigate'
  | 'search'
  | 'chase'
  | 'flank'
  | 'attack'
  | 'retreat'
  | 'stunned';

/**
 * Perception event types
 */
export type PerceptionEventType =
  | 'sight'
  | 'sound'
  | 'allyAlert';

/**
 * Sound event (from player actions)
 */
export interface SoundEvent {
  position: Vector3;
  intensity: number; // 0-1
  type: 'footstep' | 'gunshot' | 'sprint' | 'interaction';
  timestamp: number;
}

/**
 * Blackboard - shared state for behavior tree
 */
export interface Blackboard {
  // Perception
  lastKnownPlayerPosition: Vector3 | null;
  lastKnownPlayerTime: number;
  currentTarget: Vector3 | null;
  
  // State
  currentState: EnemyState;
  previousState: EnemyState;
  stateStartTime: number;
  
  // Navigation
  patrolPath: Vector3[];
  currentPatrolIndex: number;
  coverNodes: Vector3[];
  selectedCoverNode: Vector3 | null;
  
  // Combat
  health: number;
  maxHealth: number;
  attackCooldown: number;
  lastAttackTime: number;
  
  // Communication
  alertedByAlly: boolean;
  allyAlertPosition: Vector3 | null;
  
  // Stun
  stunnedUntil: number;
  
  // Custom data
  [key: string]: unknown;
}

/**
 * Behavior tree node status
 */
export type NodeStatus = 'success' | 'failure' | 'running';

/**
 * Behavior tree node context
 */
export interface NodeContext {
  enemy: UtilityEnemy;
  blackboard: Blackboard;
  deltaTime: number;
  world: EnemyWorldInterface;
}

/**
 * World interface - abstraction for game world queries
 */
export interface EnemyWorldInterface {
  getPlayerPosition(): Vector3;
  getPlayerRotation(): Vector3;
  isPositionVisible(from: Vector3, to: Vector3): boolean;
  getDistance(a: Vector3, b: Vector3): number;
  getAngleBetween(from: Vector3, to: Vector3, forward: Vector3): number;
  findPath(from: Vector3, to: Vector3): Vector3[] | null;
  getCoverNodes(): Vector3[];
  raycast(from: Vector3, direction: Vector3, maxDistance: number): boolean;
}

// ═══════════════════════════════════════════════════════════
// BEHAVIOR TREE NODES
// ═══════════════════════════════════════════════════════════

/**
 * Base class for all behavior tree nodes.
 */
export abstract class BehaviorNode {
  protected name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  /**
   * Executes the node logic.
   * 
   * @param context - Node execution context
   * @returns Status of the node execution
   */
  abstract tick(context: NodeContext): NodeStatus;
  
  /**
   * Gets the node name (for debugging).
   */
  getName(): string {
    return this.name;
  }
}

/**
 * Composite node - contains child nodes.
 */
export abstract class CompositeNode extends BehaviorNode {
  protected children: BehaviorNode[];
  
  constructor(name: string, children: BehaviorNode[] = []) {
    super(name);
    this.children = children;
  }
  
  addChild(node: BehaviorNode): void {
    this.children.push(node);
  }
}

/**
 * Selector - tries children in order, returns success on first success.
 * Equivalent to OR logic.
 */
export class Selector extends CompositeNode {
  tick(context: NodeContext): NodeStatus {
    for (const child of this.children) {
      const status = child.tick(context);
      
      if (status === 'success') {
        return 'success';
      }
      
      if (status === 'running') {
        return 'running';
      }
      
      // Continue to next child on failure
    }
    
    return 'failure';
  }
}

/**
 * Sequence - executes children in order, returns failure on first failure.
 * Equivalent to AND logic.
 */
export class Sequence extends CompositeNode {
  tick(context: NodeContext): NodeStatus {
    for (const child of this.children) {
      const status = child.tick(context);
      
      if (status === 'failure') {
        return 'failure';
      }
      
      if (status === 'running') {
        return 'running';
      }
      
      // Continue to next child on success
    }
    
    return 'success';
  }
}

/**
 * Decorator node - wraps a single child.
 */
export abstract class DecoratorNode extends BehaviorNode {
  protected child: BehaviorNode;
  
  constructor(name: string, child: BehaviorNode) {
    super(name);
    this.child = child;
  }
}

/**
 * Inverter - inverts the child's result.
 */
export class Inverter extends DecoratorNode {
  tick(context: NodeContext): NodeStatus {
    const status = this.child.tick(context);
    
    if (status === 'success') return 'failure';
    if (status === 'failure') return 'success';
    return 'running';
  }
}

/**
 * Repeater - repeats child N times.
 */
export class Repeater extends DecoratorNode {
  private count: number;
  private currentIteration: number = 0;
  
  constructor(name: string, child: BehaviorNode, count: number) {
    super(name, child);
    this.count = count;
  }
  
  tick(context: NodeContext): NodeStatus {
    if (this.currentIteration >= this.count) {
      this.currentIteration = 0;
      return 'success';
    }
    
    const status = this.child.tick(context);
    
    if (status === 'success') {
      this.currentIteration++;
      return 'running';
    }
    
    if (status === 'failure') {
      this.currentIteration = 0;
      return 'failure';
    }
    
    return 'running';
  }
}

/**
 * Condition leaf node - checks a condition.
 */
export class Condition extends BehaviorNode {
  private predicate: (context: NodeContext) => boolean;
  
  constructor(name: string, predicate: (context: NodeContext) => boolean) {
    super(name);
    this.predicate = predicate;
  }
  
  tick(context: NodeContext): NodeStatus {
    return this.predicate(context) ? 'success' : 'failure';
  }
}

/**
 * Action leaf node - performs an action.
 */
export class Action extends BehaviorNode {
  private action: (context: NodeContext) => NodeStatus;
  
  constructor(name: string, action: (context: NodeContext) => NodeStatus) {
    super(name);
    this.action = action;
  }
  
  tick(context: NodeContext): NodeStatus {
    return this.action(context);
  }
}

// ═══════════════════════════════════════════════════════════
// PERCEPTION SYSTEM
// ═══════════════════════════════════════════════════════════

/**
 * Perception system - handles vision and hearing.
 */
export class PerceptionSystem {
  private readonly visionAngle: number; // degrees
  private readonly visionDistance: number;
  private readonly hearingRadius: number;
  
  constructor(config: {
    visionAngle: number;
    visionDistance: number;
    hearingRadius: number;
  }) {
    this.visionAngle = config.visionAngle;
    this.visionDistance = config.visionDistance;
    this.hearingRadius = config.hearingRadius;
  }
  
  /**
   * Checks if the enemy can see the player.
   * 
   * @param enemyPosition - Enemy position
   * @param enemyForward - Enemy forward direction
   * @param playerPosition - Player position
   * @param world - World interface for visibility checks
   * @returns True if player is visible
   */
  canSeePlayer(
    enemyPosition: Vector3,
    enemyForward: Vector3,
    playerPosition: Vector3,
    world: EnemyWorldInterface
  ): boolean {
    // Check distance
    const distance = world.getDistance(enemyPosition, playerPosition);
    if (distance > this.visionDistance) {
      return false;
    }
    
    // Check angle
    const angle = world.getAngleBetween(enemyPosition, playerPosition, enemyForward);
    if (angle > this.visionAngle / 2) {
      return false;
    }
    
    // Check line of sight
    return world.isPositionVisible(enemyPosition, playerPosition);
  }
  
  /**
   * Checks if the enemy can hear a sound.
   * 
   * @param enemyPosition - Enemy position
   * @param soundEvent - Sound event to check
   * @param world - World interface for distance calculation
   * @returns True if sound is audible
   */
  canHearSound(
    enemyPosition: Vector3,
    soundEvent: SoundEvent,
    world: EnemyWorldInterface
  ): boolean {
    const distance = world.getDistance(enemyPosition, soundEvent.position);
    const effectiveRadius = this.hearingRadius * soundEvent.intensity;
    
    return distance <= effectiveRadius;
  }
  
  getVisionAngle(): number {
    return this.visionAngle;
  }
  
  getVisionDistance(): number {
    return this.visionDistance;
  }
  
  getHearingRadius(): number {
    return this.hearingRadius;
  }
}

// ═══════════════════════════════════════════════════════════
// UTILITY ENEMY CLASS
// ═══════════════════════════════════════════════════════════

/**
 * Utility Enemy - advanced adversary with behavior tree AI.
 * 
 * @example
 * ```typescript
 * const enemy = new UtilityEnemy({
 *   position: { x: 0, y: 0, z: 0 },
 *   health: 100,
 *   speed: 3,
 *   perception: { visionAngle: 90, visionDistance: 15, hearingRadius: 20 }
 * });
 * 
 * enemy.update(deltaTime, world);
 * ```
 */
export class UtilityEnemy extends EventEmitter {
  // Core properties
  private position: Vector3;
  private rotation: Vector3;
  private readonly speed: number;
  private readonly health: number;
  private readonly maxHealth: number;
  
  // Systems
  private readonly perception: PerceptionSystem;
  private readonly behaviorTree: BehaviorNode;
  private readonly blackboard: Blackboard;
  
  // State
  private currentState: EnemyState = 'idle';
  private moveTarget: Vector3 | null = null;
  private path: Vector3[] = [];
  private pathIndex: number = 0;
  
  // Communication
  private readonly communicationRadius: number;
  
  /**
   * Creates a new Utility Enemy.
   * 
   * @param config - Enemy configuration
   */
  constructor(config: {
    position: Vector3;
    health: number;
    speed: number;
    perception: {
      visionAngle: number;
      visionDistance: number;
      hearingRadius: number;
    };
    communicationRadius?: number;
    patrolPath?: Vector3[];
  }) {
    super();
    
    this.position = { ...config.position };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.speed = config.speed;
    this.health = config.health;
    this.maxHealth = config.health;
    this.communicationRadius = config.communicationRadius ?? 25;
    
    // Initialize perception
    this.perception = new PerceptionSystem(config.perception);
    
    // Initialize blackboard
    this.blackboard = {
      lastKnownPlayerPosition: null,
      lastKnownPlayerTime: 0,
      currentTarget: null,
      currentState: 'idle',
      previousState: 'idle',
      stateStartTime: Date.now(),
      patrolPath: config.patrolPath ?? [],
      currentPatrolIndex: 0,
      coverNodes: [],
      selectedCoverNode: null,
      health: config.health,
      maxHealth: config.health,
      attackCooldown: 2000,
      lastAttackTime: 0,
      alertedByAlly: false,
      allyAlertPosition: null,
      stunnedUntil: 0
    };
    
    // Build behavior tree
    this.behaviorTree = this.buildBehaviorTree();
  }
  
  /**
   * Builds the behavior tree for this enemy.
   * 
   * @returns Root node of the behavior tree
   */
  private buildBehaviorTree(): BehaviorNode {
    return new Selector('Root', [
      // Priority 1: Attack if in range
      new Sequence('Attack', [
        new Condition('InAttackRange', (ctx) => this.isInAttackRange(ctx)),
        new Condition('AttackReady', (ctx) => this.isAttackReady(ctx)),
        new Action('PerformAttack', (ctx) => this.performAttack(ctx))
      ]),
      
      // Priority 2: Flank if ally spotted player
      new Sequence('Flank', [
        new Condition('AllyAlerted', (ctx) => this.blackboard.alertedByAlly),
        new Condition('HasCoverNode', (ctx) => this.hasAvailableCoverNode(ctx)),
        new Action('MoveToCover', (ctx) => this.moveToCover(ctx))
      ]),
      
      // Priority 3: Chase if player visible
      new Sequence('Chase', [
        new Condition('PlayerVisible', (ctx) => this.isPlayerVisible(ctx)),
        new Action('UpdateLastKnownPosition', (ctx) => this.updateLastKnownPosition(ctx)),
        new Action('MoveToPlayer', (ctx) => this.moveToTarget(ctx))
      ]),
      
      // Priority 4: Investigate if heard sound
      new Sequence('Investigate', [
        new Condition('HasLastKnownPosition', (ctx) => this.blackboard.lastKnownPlayerPosition !== null),
        new Condition('NotAtLastKnown', (ctx) => this.isNotAtLastKnown(ctx)),
        new Action('MoveToLastKnown', (ctx) => this.moveToLastKnown(ctx))
      ]),
      
      // Priority 5: Search if lost player
      new Sequence('Search', [
        new Condition('RecentlyLostPlayer', (ctx) => this.recentlyLostPlayer(ctx)),
        new Action('SearchArea', (ctx) => this.searchArea(ctx))
      ]),
      
      // Priority 6: Patrol
      new Sequence('Patrol', [
        new Condition('HasPatrolPath', (ctx) => this.blackboard.patrolPath.length > 0),
        new Action('FollowPatrolPath', (ctx) => this.followPatrolPath(ctx))
      ]),
      
      // Default: Idle
      new Action('Idle', () => 'success')
    ]);
  }
  
  /**
   * Updates the enemy AI.
   * 
   * @param deltaTime - Time since last frame (seconds)
   * @param world - World interface for queries
   */
  public update(deltaTime: number, world: EnemyWorldInterface): void {
    // Check if stunned
    if (Date.now() < this.blackboard.stunnedUntil) {
      this.currentState = 'stunned';
      return;
    }
    
    // Update perception
    this.updatePerception(world);
    
    // Create context
    const context: NodeContext = {
      enemy: this,
      blackboard: this.blackboard,
      deltaTime,
      world
    };
    
    // Tick behavior tree
    this.behaviorTree.tick(context);
    
    // Update movement
    this.updateMovement(deltaTime, world);
  }
  
  /**
   * Updates perception (vision and hearing).
   * 
   * @param world - World interface
   */
  private updatePerception(world: EnemyWorldInterface): void {
    const playerPos = world.getPlayerPosition();
    const forward = this.getForwardDirection();
    
    // Check vision
    if (this.perception.canSeePlayer(this.position, forward, playerPos, world)) {
      this.blackboard.lastKnownPlayerPosition = { ...playerPos };
      this.blackboard.lastKnownPlayerTime = Date.now();
      this.blackboard.currentTarget = { ...playerPos };
    }
  }
  
  /**
   * Notifies this enemy of a sound event.
   * 
   * @param event - Sound event
   * @param world - World interface
   */
  public notifySound(event: SoundEvent, world: EnemyWorldInterface): void {
    if (this.perception.canHearSound(this.position, event, world)) {
      this.blackboard.lastKnownPlayerPosition = { ...event.position };
      this.blackboard.lastKnownPlayerTime = Date.now();
    }
  }
  
  /**
   * Notifies this enemy of an ally alert.
   * 
   * @param alertPosition - Position where ally spotted player
   */
  public notifyAllyAlert(alertPosition: Vector3): void {
    const distance = this.calculateDistance(this.position, alertPosition);
    
    if (distance <= this.communicationRadius) {
      this.blackboard.alertedByAlly = true;
      this.blackboard.allyAlertPosition = { ...alertPosition };
      this.blackboard.lastKnownPlayerPosition = { ...alertPosition };
      this.blackboard.lastKnownPlayerTime = Date.now();
    }
  }
  
  /**
   * Applies damage to the enemy.
   * 
   * @param amount - Damage amount
   */
  public takeDamage(amount: number): void {
    this.blackboard.health = Math.max(0, this.blackboard.health - amount);
    
    if (this.blackboard.health <= 0) {
      this.emit('death', { enemy: this });
    }
  }
  
  /**
   * Stuns the enemy for a duration.
   * 
   * @param duration - Stun duration (ms)
   */
  public stun(duration: number): void {
    this.blackboard.stunnedUntil = Date.now() + duration;
    this.currentState = 'stunned';
  }
  
  /**
   * Gets the enemy's current position.
   */
  public getPosition(): Vector3 {
    return { ...this.position };
  }
  
  /**
   * Gets the enemy's forward direction.
   */
  public getForwardDirection(): Vector3 {
    return {
      x: -Math.sin(this.rotation.y),
      y: 0,
      z: -Math.cos(this.rotation.y)
    };
  }
  
  /**
   * Gets the enemy's current state.
   */
  public getState(): EnemyState {
    return this.currentState;
  }
  
  /**
   * Gets the enemy's health.
   */
  public getHealth(): number {
    return this.blackboard.health;
  }
  
  // ═══════════════════════════════════════════════════════════
  // BEHAVIOR TREE ACTIONS
  // ═══════════════════════════════════════════════════════════
  
  private isInAttackRange(ctx: NodeContext): boolean {
    const playerPos = ctx.world.getPlayerPosition();
    const distance = ctx.world.getDistance(this.position, playerPos);
    return distance <= 2; // Melee range
  }
  
  private isAttackReady(ctx: NodeContext): boolean {
    return Date.now() - this.blackboard.lastAttackTime >= this.blackboard.attackCooldown;
  }
  
  private performAttack(ctx: NodeContext): NodeStatus {
    this.blackboard.lastAttackTime = Date.now();
    this.currentState = 'attack';
    this.emit('attack', { enemy: this, target: ctx.world.getPlayerPosition() });
    return 'success';
  }
  
  private hasAvailableCoverNode(ctx: NodeContext): boolean {
    const coverNodes = ctx.world.getCoverNodes();
    return coverNodes.length > 0;
  }
  
  private moveToCover(ctx: NodeContext): NodeStatus {
    const coverNodes = ctx.world.getCoverNodes();
    const playerPos = ctx.world.getPlayerPosition();
    
    // Find cover node furthest from player (for flanking)
    let bestNode: Vector3 | null = null;
    let maxDistance = 0;
    
    for (const node of coverNodes) {
      const distance = ctx.world.getDistance(node, playerPos);
      if (distance > maxDistance) {
        maxDistance = distance;
        bestNode = node;
      }
    }
    
    if (bestNode) {
      this.moveTarget = bestNode;
      this.currentState = 'flank';
      return 'running';
    }
    
    return 'failure';
  }
  
  private isPlayerVisible(ctx: NodeContext): boolean {
    const playerPos = ctx.world.getPlayerPosition();
    const forward = this.getForwardDirection();
    return this.perception.canSeePlayer(this.position, forward, playerPos, ctx.world);
  }
  
  private updateLastKnownPosition(ctx: NodeContext): NodeStatus {
    const playerPos = ctx.world.getPlayerPosition();
    this.blackboard.lastKnownPlayerPosition = { ...playerPos };
    this.blackboard.lastKnownPlayerTime = Date.now();
    return 'success';
  }
  
  private moveToTarget(ctx: NodeContext): NodeStatus {
    const playerPos = ctx.world.getPlayerPosition();
    this.moveTarget = playerPos;
    this.currentState = 'chase';
    
    // Calculate path
    const path = ctx.world.findPath(this.position, playerPos);
    if (path) {
      this.path = path;
      this.pathIndex = 0;
    }
    
    return 'running';
  }
  
  private hasLastKnownPosition(ctx: NodeContext): boolean {
    return this.blackboard.lastKnownPlayerPosition !== null;
  }
  
  private isNotAtLastKnown(ctx: NodeContext): boolean {
    if (!this.blackboard.lastKnownPlayerPosition) return false;
    const distance = ctx.world.getDistance(this.position, this.blackboard.lastKnownPlayerPosition);
    return distance > 1;
  }
  
  private moveToLastKnown(ctx: NodeContext): NodeStatus {
    if (!this.blackboard.lastKnownPlayerPosition) return 'failure';
    
    this.moveTarget = this.blackboard.lastKnownPlayerPosition;
    this.currentState = 'investigate';
    
    const path = ctx.world.findPath(this.position, this.blackboard.lastKnownPlayerPosition);
    if (path) {
      this.path = path;
      this.pathIndex = 0;
    }
    
    return 'running';
  }
  
  private recentlyLostPlayer(ctx: NodeContext): boolean {
    const timeSinceLastSeen = Date.now() - this.blackboard.lastKnownPlayerTime;
    return timeSinceLastSeen < 10000; // 10 seconds
  }
  
  private searchArea(ctx: NodeContext): NodeStatus {
    // Search in a radius around last known position
    if (!this.blackboard.lastKnownPlayerPosition) return 'failure';
    
    const searchRadius = 5;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * searchRadius;
    
    this.moveTarget = {
      x: this.blackboard.lastKnownPlayerPosition.x + Math.cos(angle) * distance,
      y: this.blackboard.lastKnownPlayerPosition.y,
      z: this.blackboard.lastKnownPlayerPosition.z + Math.sin(angle) * distance
    };
    
    this.currentState = 'search';
    return 'running';
  }
  
  private hasPatrolPath(ctx: NodeContext): boolean {
    return this.blackboard.patrolPath.length > 0;
  }
  
  private followPatrolPath(ctx: NodeContext): NodeStatus {
    if (this.blackboard.patrolPath.length === 0) return 'failure';
    
    const target = this.blackboard.patrolPath[this.blackboard.currentPatrolIndex];
    const distance = ctx.world.getDistance(this.position, target);
    
    if (distance < 1) {
      // Reached waypoint, move to next
      this.blackboard.currentPatrolIndex = 
        (this.blackboard.currentPatrolIndex + 1) % this.blackboard.patrolPath.length;
    }
    
    this.moveTarget = target;
    this.currentState = 'patrol';
    return 'running';
  }
  
  // ═══════════════════════════════════════════════════════════
  // MOVEMENT
  // ═══════════════════════════════════════════════════════════
  
  private updateMovement(deltaTime: number, world: EnemyWorldInterface): void {
    if (!this.moveTarget) return;
    
    // Follow path if available
    if (this.path.length > 0 && this.pathIndex < this.path.length) {
      this.moveTarget = this.path[this.pathIndex];
      
      const distance = world.getDistance(this.position, this.moveTarget);
      if (distance < 0.5) {
        this.pathIndex++;
      }
    }
    
    // Move toward target
    const direction = {
      x: this.moveTarget.x - this.position.x,
      y: 0,
      z: this.moveTarget.z - this.position.z
    };
    
    const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
    if (length > 0.01) {
      direction.x /= length;
      direction.z /= length;
      
      this.position.x += direction.x * this.speed * deltaTime;
      this.position.z += direction.z * this.speed * deltaTime;
      
      // Update rotation to face movement direction
      this.rotation.y = Math.atan2(-direction.x, -direction.z);
    }
  }
  
  private calculateDistance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
