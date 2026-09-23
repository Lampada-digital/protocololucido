import { motion } from 'framer-motion';

const folderTree = `lucid-protocol/
├── apps/
│   ├── web/                          # Next.js site + game host
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx        # Root layout w/ CRT effects
│   │   │   │   ├── page.tsx          # Landing page (ARG elements)
│   │   │   │   ├── play/
│   │   │   │   │   └── page.tsx      # Game embed page
│   │   │   │   ├── sanctuary/
│   │   │   │   │   └── page.tsx      # Player hub/progression
│   │   │   │   └── lore/
│   │   │   │       └── page.tsx      # Unlockable content
│   │   │   ├── components/
│   │   │   │   ├── game/             # Game UI overlay
│   │   │   │   │   ├── FakeHealthBar.tsx
│   │   │   │   │   ├── GaslightUI.tsx
│   │   │   │   │   ├── SanityMeter.tsx
│   │   │   │   │   └── FearIndicator.tsx
│   │   │   │   ├── arg/              # ARG elements
│   │   │   │   │   ├── HiddenTerminal.tsx
│   │   │   │   │   ├── CorruptedFile.tsx
│   │   │   │   │   └── SecretInput.tsx
│   │   │   │   └── ui/               # Shared UI
│   │   │   ├── hooks/
│   │   │   │   ├── useSanity.ts
│   │   │   │   ├── useMicInput.ts
│   │   │   │   └── useGameState.ts
│   │   │   └── lib/
│   │   │       ├── supabase.ts
│   │   │       └── colyseus.ts
│   │   ├── public/
│   │   │   └── .well-known/          # ARG clues
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── game/                         # Three.js + React Three Fiber
│       ├── src/
│       │   ├── core/
│       │   │   ├── SanitySystem.ts
│       │   │   ├── HallucinationManager.ts
│       │   │   ├── PhobiaEngine.ts
│       │   │   ├── DivergentPerception.ts
│       │   │   └── MicFearDetector.ts
│       │   ├── systems/
│       │   │   ├── PlayerController.ts
│       │   │   ├── EnvironmentSystem.ts
│       │   │   ├── AudioSystem.ts
│       │   │   └── NetworkSystem.ts
│       │   ├── shaders/
│       │   │   ├── ps1-vertex.glsl   # Vertex snapping
│       │   │   ├── ps1-fragment.glsl # Affine textures
│       │   │   ├── dither.glsl       # Ordered dithering
│       │   │   └── crt-post.glsl     # CRT post-process
│       │   ├── scenes/
│       │   │   ├── Level1_Underneath.ts
│       │   │   └── Level2_MirrorHall.ts
│       │   ├── entities/
│       │   │   ├── Diver.ts
│       │   │   ├── Nightmare.ts
│       │   │   └── Environment.ts
│       │   └── assets/               # Lazy-loaded
│       │       ├── models/           # Draco-compressed glTF
│       │       ├── textures/         # KTX2 compressed
│       │       └── audio/            # OGG + spatial
│       └── package.json
│
├── packages/
│   ├── shared/                       # Shared types & utils
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── GameState.ts
│   │   │   │   ├── PlayerState.ts
│   │   │   │   ├── HallucinationEvent.ts
│   │   │   │   └── SanityData.ts
│   │   │   ├── constants/
│   │   │   │   ├── thresholds.ts
│   │   │   │   └── config.ts
│   │   │   └── utils/
│   │   │       ├── noise.ts          # Perlin/Simplex
│   │   │       └── random.ts         # Seeded random
│   │   └── package.json
│   │
│   ├── server/                       # Colyseus server
│   │   ├── src/
│   │   │   ├── rooms/
│   │   │   │   ├── DiveRoom.ts       # Main game room
│   │   │   │   ├── LobbyRoom.ts      # Matchmaking
│   │   │   │   └── schemas/
│   │   │   │       ├── GameState.ts
│   │   │   │       ├── PlayerState.ts
│   │   │   │       └── HallucinationState.ts
│   │   │   ├── systems/
│   │   │   │   ├── SanityArbiter.ts  # Server sanity sync
│   │   │   │   ├── EventScheduler.ts
│   │   │   │   └── PhobiaRouter.ts   # Per-client routing
│   │   │   └── index.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── ui/                           # Shared React components
│       ├── src/
│       │   ├── GaslightBar.tsx
│       │   ├── SanityOverlay.tsx
│       │   └── FearPulse.tsx
│       └── package.json
│
├── infra/
│   ├── docker-compose.yml
│   ├── nginx.conf
│   ├── cloudflare-r2.tf              # Terraform for CDN
│   └── monitoring/
│       ├── grafana/
│       └── prometheus/
│
├── turbo.json
├── package.json
└── README.md`;

export default function Architecture() {
  return (
    <section className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-blood-light">01.</span> Monorepo Architecture
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Turborepo-based monorepo optimized for a 2-3 dev team. Each app is independently deployable 
            with shared packages for types, UI, and server logic.
          </p>
        </motion.div>

        {/* Architecture diagram */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="font-mono text-neon-green text-sm mb-4">◈ SYSTEM TOPOLOGY</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Client */}
            <div className="border border-neon-blue/30 rounded-lg p-4 bg-neon-blue/5">
              <h3 className="font-mono text-neon-blue text-sm mb-3">CLIENT LAYER</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-neon-blue rounded-full" />
                  Next.js 14 (Site + Game Host)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-neon-blue rounded-full" />
                  React Three Fiber (Game Engine)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-neon-blue rounded-full" />
                  Colyseus.js (Client SDK)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-neon-blue rounded-full" />
                  Web Audio API (Mic Input)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-neon-blue rounded-full" />
                  WebRTC (Voice Chat)
                </li>
              </ul>
            </div>

            {/* Server */}
            <div className="border border-neon-purple/30 rounded-lg p-4 bg-neon-purple/5">
              <h3 className="font-mono text-neon-purple text-sm mb-3">SERVER LAYER</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-neon-purple rounded-full" />
                  Colyseus (Game Server)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-neon-purple rounded-full" />
                  SanityArbiter (Auth Logic)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-neon-purple rounded-full" />
                  EventScheduler (Timed Events)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-neon-purple rounded-full" />
                  PhobiaRouter (Per-Client)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-neon-purple rounded-full" />
                  Redis (Session Cache)
                </li>
              </ul>
            </div>

            {/* Data */}
            <div className="border border-amber/30 rounded-lg p-4 bg-amber/5">
              <h3 className="font-mono text-amber text-sm mb-3">DATA LAYER</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber rounded-full" />
                  Supabase (Auth + Player Data)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber rounded-full" />
                  Cloudflare R2 (Game Assets CDN)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber rounded-full" />
                  PostgreSQL (Progression)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber rounded-full" />
                  Analytics DB (Fear Metrics)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber rounded-full" />
                  Edge Functions (Lore Unlock)
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Core Systems */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="font-mono text-neon-green text-sm mb-4">◈ CORE GAME SYSTEMS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: 'SanitySystem',
                desc: 'Manages shared + per-player sanity pool. Server-authoritative with client prediction. Triggers visual/audio distortions at thresholds.',
                borderClass: 'border-blood/20',
                textClass: 'text-blood-light'
              },
              {
                name: 'HallucinationManager',
                desc: 'Spawns per-player hallucinations using divergent rendering. Each player gets unique instances. Server sends event seeds, client generates.',
                borderClass: 'border-neon-purple/20',
                textClass: 'text-neon-purple'
              },
              {
                name: 'PhobiaEngine',
                desc: 'Modular fear-profile system. Analyzes player behavior patterns, adapts horror elements. Pluggable phobia modules (heights, darkness, etc).',
                borderClass: 'border-neon-green/20',
                textClass: 'text-neon-green'
              },
              {
                name: 'DivergentPerception',
                desc: 'Per-player render pipeline. Uses instanced rendering with per-instance visibility masks. Same scene graph, different visual output per client.',
                borderClass: 'border-neon-blue/20',
                textClass: 'text-neon-blue'
              },
              {
                name: 'MicFearDetector',
                desc: 'Web Audio API real-time analysis. Volume + frequency spike detection. Privacy-first: no recording, only FFT analysis in-browser.',
                borderClass: 'border-amber/20',
                textClass: 'text-amber'
              },
              {
                name: 'GaslightUI',
                desc: 'React overlay that lies to players. Fake ammo counts, inverted health, false objectives. Synced with SanitySystem for coherence.',
                borderClass: 'border-flesh/20',
                textClass: 'text-flesh'
              },
            ].map((system, i) => (
              <motion.div
                key={system.name}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className={`border ${system.borderClass} rounded-lg p-4 bg-void-light/50 hover:bg-void-lighter/50 transition-colors`}
              >
                <h3 className={`font-mono ${system.textClass} text-sm mb-2`}>{system.name}</h3>
                <p className="text-gray-400 text-sm">{system.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Folder tree */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="font-mono text-neon-green text-sm mb-4">◈ COMPLETE FOLDER STRUCTURE</h2>
          <div className="code-block">
            <div className="flex items-center justify-between px-4 py-2 bg-void-lighter border-b border-void-lighter">
              <span className="font-mono text-xs text-gray-500">lucid-protocol/ — Turborepo Monorepo</span>
              <span className="font-mono text-xs text-neon-green">MIT License</span>
            </div>
            <pre className="text-sm text-gray-300 font-mono leading-relaxed overflow-x-auto p-4 max-h-[600px] overflow-y-auto">
              <code>{folderTree}</code>
            </pre>
          </div>
        </motion.div>

        {/* Key decisions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="border border-void-lighter rounded-lg p-6">
            <h3 className="font-mono text-amber text-sm mb-3">⚡ WHY TURBOREPO OVER NX?</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• Zero config for small teams — just works</li>
              <li>• Remote caching built-in (free tier sufficient)</li>
              <li>• Parallel builds with intelligent task detection</li>
              <li>• Simple mental model: packages + apps</li>
              <li>• Nx is better for 10+ devs, overkill for us</li>
            </ul>
          </div>
          <div className="border border-void-lighter rounded-lg p-6">
            <h3 className="font-mono text-amber text-sm mb-3">⚡ WHY THREE.JS OVER PLAYCANVAS?</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• React Three Fiber = React ecosystem integration</li>
              <li>• Better shader pipeline for PS1 effects</li>
              <li>• Larger community + more examples</li>
              <li>• Easier to share code between game + site</li>
              <li>• PlayCanvas is great but less flexible for custom pipelines</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
