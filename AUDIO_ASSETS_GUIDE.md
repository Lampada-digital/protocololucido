# Audio Assets Guide - O Protocolo Lúcido

## 🎵 Where to Get Free Horror Sound Effects

### Recommended Sources (All Free/CC0):

1. **Freesound.org** (https://freesound.org)
   - Search terms: "horror ambient", "creepy drone", "metallic scraping", "dripping water"
   - Filter by: Creative Commons 0 (CC0) license
   - Best packs: "Horror Ambience", "Abandoned Hospital"

2. **Zapsplat** (https://www.zapsplat.com)
   - Free account required
   - Great for: footsteps, breathing, heartbeat, radio static

3. **BBC Sound Effects** (https://sound-effects.bbcrewind.co.uk)
   - Search: "industrial", "hospital", "creepy"
   - Free for personal use

4. **Sonniss GDC Bundles** (https://sonniss.com/gameaudiogdc)
   - Annual free game audio bundles
   - High quality, game-ready assets

## 📁 File Structure

```
public/assets/audio/
├── ambient/
│   ├── drone_low.mp3          # Constant low-frequency drone
│   ├── wind_howl.mp3          # Occasional wind
│   └── metal_creak.mp3        # Distant metallic sounds
├── foley/
│   ├── footsteps/
│   │   ├── concrete_01.mp3
│   │   ├── concrete_02.mp3
│   │   ├── metal_01.mp3
│   │   └── metal_02.mp3
│   ├── breathing_normal.mp3
│   ├── breathing_heavy.mp3
│   └── heartbeat.mp3
├── enemies/
│   ├── groan_01.mp3
│   ├── groan_02.mp3
│   ├── scream.mp3
│   └── scratch_wall.mp3
├── ui/
│   ├── item_pickup.mp3
│   ├── door_open.mp3
│   └── siren.mp3
├── radio_static.mp3           # Loopable static noise
└── distant/
    ├── dripping_water.mp3
    ├── child_laughter.mp3
    └── scraping_metal.mp3
```

## 🔧 Integration Instructions

### Current Implementation (Procedural Audio)

The game currently uses **procedural audio generation** via Web Audio API:
- No external audio files needed
- All sounds generated in real-time
- Fully functional out of the box

### Upgrading to Real Audio Files

To replace procedural sounds with real audio files:

1. **Download sounds** from sources above
2. **Place in** `public/assets/audio/` following structure
3. **Update** `src/systems/AdvancedAudio.js`:

```javascript
// Example: Replace procedural footstep with real audio
async loadFootstepSound(surface) {
  const response = await fetch(`/assets/audio/foley/footsteps/${surface}_01.mp3`);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer;
}

playFootstep(isSprinting) {
  // Use loaded buffer instead of oscillator
  const source = this.audioContext.createBufferSource();
  source.buffer = this.footstepBuffers[this.currentSurface];
  // ... rest of implementation
}
```

## 🎛 Audio System Features

### Radio Static (Proximity-based)
- Automatically generated white noise
- Filtered to sound like radio
- Volume increases near enemies (0-30 units)
- Pitch increases when enemy < 3 units (screeching)

### Ambient Layers
- **Drone**: 40Hz sine wave, barely audible, creates dread
- **Distant Sounds**: Randomized (dripping, scraping, laughter)
- **Spatial Audio**: All distant sounds are 3D positioned

### Player Foley
- **Footsteps**: Procedural based on surface type
- **Breathing**: Heavy when sprinting or low sanity
- **Heartbeat**: Audible when sanity < 30%, increases with panic

### Enemy Audio
- **Groans**: Random during chase state
- **Screams**: When spotting player
- **Scratching**: Ambient wall scratching sounds

## 🎚 Mixing Guidelines

When adding real audio files:

1. **Drone**: -30dB (barely audible, felt not heard)
2. **Footsteps**: -12dB to -8dB
3. **Breathing**: -15dB (close, intimate)
4. **Heartbeat**: -10dB (when active)
5. **Radio Static**: -20dB to 0dB (dynamic based on proximity)
6. **Enemy Sounds**: -8dB to -3dB (close and threatening)
7. **Distant Sounds**: -25dB to -15dB (far away, atmospheric)

## 🔊 Browser Compatibility

Web Audio API is supported in:
- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari (iOS 14.5+, macOS 11+)
- ❌ IE11 (not supported)

**Note**: User interaction required before audio can play (click/tap to start).

## 🎮 Testing Audio

1. Open game in browser
2. Click "BEGIN DIVE"
3. Walk around - hear footsteps
4. Sprint - hear heavy breathing
5. Approach enemy - hear radio static increase
6. Low sanity - hear heartbeat

## 📝 License Notes

- Procedural audio: MIT (part of game code)
- External audio files: Check individual licenses
- Recommended: Use CC0 (public domain) for maximum flexibility

---

**Pro Tip**: Start with procedural audio, then gradually replace with real sounds as you find good free assets. The procedural system ensures the game always has audio, even without external files.
