# CHANGELOG — PROTOCOLO LÚCIDO

## [0.1.0] - 2024 - Alpha Prototype

### 🎉 Initial Release

#### Added
- **Core Gameplay**
  - First-person camera system with pointer lock
  - Smooth FPS movement (walk, sprint, crouch, jump)
  - Stamina system for sprinting
  - Gravity and collision detection
  - Boundary collision for world limits

- **Environment**
  - Main laboratory room (20x20m)
  - Security room (15x15m)
  - Medical wing (15x15m)
  - Connecting corridors
  - Realistic props (medical beds, monitors, computers, lockers, desks, chairs)
  - Collectible documents with narrative content
  - Weapon pickup (9mm pistol)

- **Lighting System**
  - Ambient light for base visibility
  - 7 fluorescent lights with fixtures
  - 5 emergency red lights
  - Dynamic shadows (PCFSoft)
  - Volumetric fog (exponential)
  - ACES filmic tone mapping

- **Weapon System**
  - 9mm pistol with realistic stats
  - Magazine system (8 rounds)
  - Reserve ammo (24 rounds)
  - Reload mechanic (R key)
  - Recoil system
  - Muzzle flash (visual feedback)

- **Player Systems**
  - Health system (100 HP)
  - Stamina system (100 points)
  - NRL system (Neural Reconstruction Level)
  - Inventory system (basic)
  - Interaction system (E key)

- **UI/HUD**
  - Minimalist HUD (health bar, ammo display, NRL display)
  - Crosshair
  - Interaction prompts
  - Notification system
  - Main menu (Somnus Dynamics terminal)
  - Death screen with narrative
  - Loading screen

- **Atmosphere**
  - Film grain overlay
  - Vignette effect
  - PBR materials (physically based rendering)
  - Cinematic color palette
  - Corporate aesthetic (Somnus Dynamics)

- **Narrative**
  - Main menu with lore
  - Collectible documents
  - Environmental storytelling
  - Mystery and intrigue
  - Subject 034 identity

- **Documentation**
  - README.md (project overview)
  - TECHNICAL_DOCS.md (technical documentation)
  - DEVELOPMENT_GUIDE.md (development guide)
  - PROJECT_SUMMARY.md (project summary)
  - HOW_TO_PLAY.md (player guide)
  - CHANGELOG.md (this file)

#### Technical Details
- **Engine:** Three.js (3D rendering)
- **Build Tool:** Vite (fast development)
- **UI Framework:** React (menu, HUD)
- **Styling:** Tailwind CSS
- **Language:** JavaScript (ES6+)
- **Bundle Size:** 470KB JS (120KB gzipped)
- **Performance:** 60 FPS target

#### Controls
- WASD - Movement
- Mouse - Look
- Click - Shoot
- R - Reload
- E - Interact
- Shift - Sprint
- Ctrl - Crouch
- Space - Jump

#### Known Issues
- Audio system not fully implemented
- Enemies not yet added
- Psychological events basic
- Weapon animations limited
- Save system not implemented
- Only one weapon available
- Limited environment (3 rooms)

#### Performance Metrics
- Build time: ~3 seconds
- Bundle size: ~500KB total
- Memory usage: < 300MB
- FPS: 60 (modern hardware)
- Load time: < 3 seconds

---

## [Unreleased] - Planned Features

### Phase 1: Core Combat (Week 1-2)
- [ ] Enemy AI system
  - [ ] Host enemies (contaminated staff)
  - [ ] Subject enemies (human experiments)
  - [ ] Memory entities (psychological)
  - [ ] State machine (idle, patrol, chase, attack)
  - [ ] Vision and hearing systems
  - [ ] Pathfinding
- [ ] Combat mechanics
  - [ ] Hit detection
  - [ ] Damage system
  - [ ] Enemy reactions
  - [ ] Blood effects
- [ ] More weapons
  - [ ] Shotgun
  - [ ] Revolver
  - [ ] SMG
  - [ ] Rifle

### Phase 2: Horror Systems (Week 3-4)
- [ ] Horror Director
  - [ ] Event scheduling
  - [ ] Tension management
  - [ ] Dynamic difficulty
- [ ] Psychological events
  - [ ] Lights flickering
  - [ ] Doors slamming
  - [ ] Whispers
  - [ ] Shadows
  - [ ] Object movement
- [ ] NRL effects
  - [ ] Visual distortions
  - [ ] Reality shifts
  - [ ] Memory overlays
  - [ ] Environmental changes
- [ ] Spatial audio
  - [ ] 3D sound positioning
  - [ ] Footsteps
  - [ ] Gunshots
  - [ ] Ambient sounds
  - [ ] Enemy sounds

### Phase 3: Content Expansion (Week 5-8)
- [ ] New areas
  - [ ] Generator Room
  - [ ] Archives
  - [ ] Containment Area
  - [ ] Observation Deck
  - [ ] Lucid Core
- [ ] Inventory system
  - [ ] Grid-based UI
  - [ ] Item categories
  - [ ] Weight/size limits
  - [ ] Item usage
- [ ] Medical system
  - [ ] First aid kits
  - [ ] Bandages
  - [ ] Medical injectors
  - [ ] Healing animations
- [ ] More documents
  - [ ] 20+ collectible documents
  - [ ] Audio logs
  - [ ] Computer terminals
  - [ ] Security cameras

### Phase 4: Polish (Week 9-12)
- [ ] Animations
  - [ ] Weapon animations
  - [ ] Character animations
  - [ ] Door animations
  - [ ] Interaction animations
- [ ] Visual effects
  - [ ] Post-processing
  - [ ] Particle effects
  - [ ] Screen effects
  - [ ] Lighting effects
- [ ] Audio polish
  - [ ] Sound effects
  - [ ] Ambient tracks
  - [ ] Music system
  - [ ] Voice acting
- [ ] Performance optimization
  - [ ] LOD system
  - [ ] Occlusion culling
  - [ ] Texture compression
  - [ ] Asset streaming

### Phase 5: Narrative (Week 13-16)
- [ ] Story completion
  - [ ] Full narrative arc
  - [ ] Character development
  - [ ] Plot twists
  - [ ] Multiple endings
- [ ] Cutscenes
  - [ ] Opening sequence
  - [ ] Key story moments
  - [ ] Ending sequences
  - [ ] Flashbacks
- [ ] Puzzles
  - [ ] Environmental puzzles
  - [ ] Code breaking
  - [ ] Memory puzzles
  - [ ] Logic challenges

### Phase 6: Systems (Week 17-20)
- [ ] Save/Load system
  - [ ] Checkpoints
  - [ ] Save slots
  - [ ] Auto-save
  - [ ] Memory synchronization
- [ ] Settings menu
  - [ ] Graphics options
  - [ ] Audio settings
  - [ ] Controls customization
  - [ ] Accessibility options
- [ ] Difficulty system
  - [ ] Easy/Normal/Hard
  - [ ] Enemy behavior changes
  - [ ] Resource availability
  - [ ] Damage multipliers
- [ ] Achievements
  - [ ] Completion tracking
  - [ ] Challenge achievements
  - [ ] Exploration achievements
  - [ ] Story achievements

---

## [0.2.0] - Planned (Next Major Release)

### Major Features
- Complete enemy AI system
- Full audio implementation
- 5+ additional rooms
- 3+ weapon types
- Horror Director system
- Save/Load functionality
- Settings menu
- Multiple difficulty levels

### Target Metrics
- Bundle size: < 1MB
- Performance: 60 FPS on mid-range hardware
- Content: 2-3 hours of gameplay
- Polish: AAA-quality presentation

---

## [1.0.0] - Planned (Full Release)

### Complete Game
- Full story campaign (5-8 hours)
- All areas implemented
- All enemies and weapons
- Complete audio experience
- Multiple endings
- New Game+ mode
- Achievement system
- Full optimization

### Target Metrics
- Bundle size: < 2MB
- Performance: 60 FPS on low-end hardware
- Content: 8-12 hours of gameplay
- Polish: Professional quality

---

## Version History

### Versioning Scheme
- **MAJOR** (X.0.0) - Incompatible API changes, major features
- **MINOR** (0.X.0) - New features, backwards compatible
- **PATCH** (0.0.X) - Bug fixes, minor improvements

### Current Version
**0.1.0** - Alpha Prototype

### Next Version
**0.2.0** - Core Combat & Horror Systems

---

## Contributors

- Lead Technical Director & Game Designer
- Senior 3D Environment Artist
- Horror Director
- Gameplay Programmer

---

## Acknowledgments

### Inspirations
- F.E.A.R. (Monolith Productions)
- Silent Hill (Konami)
- Resident Evil (Capcom)
- Amnesia: The Dark Descent (Frictional Games)
- Outlast (Red Barrels)

### Technologies
- Three.js (3D rendering)
- Vite (build tool)
- React (UI framework)
- Tailwind CSS (styling)

### Design Principles
- Atmosphere over jump scares
- Limited resources create tension
- Environmental storytelling
- Psychological horror
- Realistic presentation

---

## License

Educational/Demonstration project.

All assets and code are original.

Inspired by survival horror games but not affiliated with any company.

---

**PROTOCOLO LÚCIDO**  
*THE MEMORY IS LYING.*

---

*Last updated: 2024*
