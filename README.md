# O Protocolo Lúcido (The Lucid Protocol)

A web-based multiplayer psychological horror FPS with PS1 aesthetics, sanity-based gaslighting, divergent perception, and real-time microphone fear detection.

## 🎮 Features

- **FPS Controller**: WASD movement, mouse look, sprint, crouch, shooting with raycasting
- **Sanity System**: Global sanity pool that triggers visual distortions and UI gaslighting
- **Divergent Perception**: Each player sees unique hallucinations (server sends to specific clients)
- **Microphone Fear Detection**: Real-time audio analysis triggers gameplay events on screams
- **PS1 Aesthetic**: Vertex snapping, affine texture mapping, ordered dithering, CRT post-processing
- **Multiplayer**: 4-player co-op via Colyseus (or single-player offline mode)

## 🛠 Tech Stack

- **Frontend**: Vite + Vanilla JS + Three.js + React (HUD)
- **Backend**: Node.js + Colyseus (multiplayer server)
- **Styling**: Tailwind CSS + Custom GLSL shaders
- **Audio**: Web Audio API (mic detection + spatial audio)
- **Deployment**: Vercel (frontend) + Railway/Docker (backend)

## 📦 Installation

```bash
# Clone the repository
git clone <repo-url>
cd lucid-protocol

# Install dependencies
npm install
```

## 🚀 Running Locally

### Option 1: Frontend Only (Single-Player Mode)

```bash
# Start the dev server
npm run dev

# Open http://localhost:3000
```

The game will run in offline/single-player mode without the multiplayer server.

### Option 2: Full Multiplayer Setup

**Terminal 1 - Backend Server:**
```bash
# Start Colyseus server
npm run server

# Server runs on ws://localhost:2567
```

**Terminal 2 - Frontend:**
```bash
# Start Vite dev server
npm run dev

# Frontend runs on http://localhost:3000
```

## 🎯 Controls

| Key | Action |
|-----|--------|
| `W/A/S/D` | Move |
| `Mouse` | Look around |
| `Left Click` | Shoot |
| `Shift` | Sprint |
| `Ctrl` | Crouch |
| `Space` | Jump |
| `R` | Reload |
| `M` | Toggle microphone |
| `F` | Panic button (fallback if no mic) |
| `ESC` | Release mouse |

## 🎤 Microphone Fear Detection

The game analyzes your microphone input in real-time:
- **Screams** (high volume + high frequency) trigger sanity drops and spawn enemies
- Press `M` to enable/disable microphone
- If mic is denied, press `F` as a panic button fallback
- **Privacy-first**: No audio is recorded or stored, only analyzed in-browser

## 🧠 Sanity System

- Sanity decreases over time and when near enemies
- **Above 50%**: UI shows truth
- **Below 50%**: UI starts lying (fake health, fake ammo, inverted values)
- **Below 30%**: Hallucinations spawn, visual distortions intensify
- **Below 15%**: Critical state, full perceptual breakdown

## 🏗 Project Structure

```
lucid-protocol/
├── index.html              # Entry point
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── src/
│   ├── main.js            # Game initialization
│   ├── index.css          # Tailwind + custom styles
│   ├── game/
│   │   ├── core.js        # Three.js scene, PS1 shaders
│   │   ├── player.js      # FPS controller
│   │   ├── sanitySystem.js # Sanity logic
│   │   ├── audioSystem.js # Mic detection
│   │   └── network.js     # Colyseus client
│   └── ui/
│       ├── App.jsx        # React root
│       └── HUD.jsx        # Gaslighting UI
├── server/
│   ├── index.js           # Colyseus server
│   └── rooms/
│       └── LucidRoom.js   # Game room logic
├── Dockerfile             # Backend container
├── railway.toml           # Railway config
└── vercel.json            # Vercel config
```

## 🌐 Deployment

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

### Backend (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

Or use the Dockerfile with any container platform (Fly.io, Render, etc.).

### Environment Variables

**Frontend (.env):**
```
VITE_SERVER_URL=wss://your-server.railway.app
```

**Backend:**
```
PORT=2567
```

## 📊 Performance Targets

- **60 FPS** on integrated graphics (Intel UHD / AMD Vega)
- **<10MB** initial load
- **<100ms** network latency for multiplayer

Optimizations:
- Low-poly PS1 aesthetic = fewer triangles
- No shadows (performance cost)
- Instanced rendering for hallucinations
- Texture compression (procedural generation)
- Code splitting (game loads after start screen)

## 🔧 Development

### Build for Production

```bash
npm run build
```

Output in `dist/` folder (ready for deployment).

### Run Server in Development

```bash
npm run server:dev
```

Uses nodemon for auto-reload on changes.

## 🎨 Customization

### Adjust Difficulty

Edit `src/game/sanitySystem.js`:
```javascript
this.baseDecayRate = 0.1;      // Higher = faster sanity loss
this.SCREAM_VOLUME_THRESHOLD = 0.65;  // Lower = more sensitive mic
```

### Change PS1 Aesthetic

Edit `src/game/core.js` shader uniforms:
```javascript
u_snapResolution: { value: 150.0 },  // Lower = more vertex snapping
u_ditherStrength: { value: 0.04 },   // Higher = more dithering
```

### Modify Hallucination Frequency

Edit `server/rooms/LucidRoom.js`:
```javascript
this.clock.setInterval(() => {
  this.scheduleHallucination();
}, 8000 + Math.random() * 12000);  // Adjust timing
```

## 🐛 Troubleshooting

**Microphone not working:**
- Check browser permissions
- Try Chrome/Firefox (best Web Audio API support)
- Use `F` key as fallback

**Can't connect to server:**
- Ensure backend is running (`npm run server`)
- Check `VITE_SERVER_URL` environment variable
- Verify firewall allows WebSocket connections

**Low FPS:**
- Reduce render resolution in `core.js`: `renderer.setPixelRatio(1)`
- Disable post-processing effects
- Reduce enemy count

## 📝 License

MIT License - feel free to use for your own projects!

## 🙏 Credits

Built with:
- [Three.js](https://threejs.org/) - 3D engine
- [Colyseus](https://colyseus.io/) - Multiplayer framework
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool

---

**"What you fear is what finds you."**
