import { motion } from 'framer-motion';

const techItems = [
  {
    category: 'GAME ENGINE',
    items: [
      { name: 'Three.js + React Three Fiber', reason: 'Declarative 3D in React. Perfect for our PS1 shader pipeline. R3F handles scene graph, instancing, and lazy loading natively.', license: 'MIT', size: '~150KB gzipped' },
      { name: '@react-three/drei', reason: 'Essential helpers: Stats, useGLTF (with Draco), Environment, Effects. Saves weeks of boilerplate.', license: 'MIT', size: '~45KB' },
      { name: '@react-three/postprocessing', reason: 'Post-processing pipeline for CRT effects, dithering, and bloom. GPU-accelerated.', license: 'MIT', size: '~30KB' },
    ]
  },
  {
    category: 'MULTIPLAYER',
    items: [
      { name: 'Colyseus', reason: 'Schema-based state sync. Built-in room management, matchmaking, and reconnection. Perfect for 4-player co-op.', license: 'MIT', size: 'Server: ~20MB' },
      { name: 'Supabase', reason: 'Auth + real-time DB + storage. Free tier handles 50K MAU. Edge functions for lore unlocks.', license: 'Apache 2.0', size: 'SaaS' },
      { name: 'PeerJS (WebRTC)', reason: 'Simplified WebRTC for voice chat. Mesh topology for 4 players. Audio processing via Web Audio API.', license: 'MIT', size: '~40KB' },
    ]
  },
  {
    category: 'SITE / HUB',
    items: [
      { name: 'Next.js 14 (App Router)', reason: 'SSG for landing page (SEO), SSR for dynamic hub. API routes for game integration. Image optimization built-in.', license: 'MIT', size: 'Edge-optimized' },
      { name: 'Tailwind CSS 4', reason: 'Utility-first for rapid UI. Dark theme native. JIT compilation = zero unused CSS.', license: 'MIT', size: '~10KB output' },
      { name: 'Framer Motion', reason: 'Page transitions, glitch animations, scroll effects. Declarative API matches our React stack.', license: 'MIT', size: '~35KB' },
    ]
  },
  {
    category: 'INFRASTRUCTURE',
    items: [
      { name: 'Turborepo', reason: 'Monorepo orchestration. Remote caching, parallel builds. Zero-config for our scale.', license: 'MIT', size: 'Dev dependency' },
      { name: 'Docker + Docker Compose', reason: 'Containerized Colyseus server. Reproducible deployments. Easy local dev.', license: 'Apache 2.0', size: 'Runtime' },
      { name: 'Cloudflare R2 + Pages', reason: 'R2 for game asset CDN (zero egress fees). Pages for Next.js hosting. Global edge network.', license: 'SaaS', size: 'SaaS' },
      { name: 'Vercel (fallback)', reason: 'If Cloudflare Pages isn\'t enough. Preview deployments for PR testing. Analytics built-in.', license: 'SaaS', size: 'SaaS' },
    ]
  },
  {
    category: 'DEV TOOLS',
    items: [
      { name: 'TypeScript 5', reason: 'Non-negotiable for a multiplayer game. Shared types between client/server prevent entire categories of bugs.', license: 'Apache 2.0', size: 'Dev dependency' },
      { name: 'ESLint + Prettier', reason: 'Consistent code style across monorepo. Shared configs in packages/shared.', license: 'MIT', size: 'Dev dependency' },
      { name: 'Vitest', reason: 'Vite-native testing. Fast. Shared test utils in packages/shared. Unit tests for core systems.', license: 'MIT', size: 'Dev dependency' },
    ]
  }
];

export default function TechStack() {
  return (
    <section className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-blood-light">02.</span> Tech Stack
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Every tool chosen for a reason: MIT/Apache licensed, production-proven, and optimized for a small team shipping fast.
          </p>
        </motion.div>

        {/* Bundle budget */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12 border border-neon-green/20 rounded-lg p-6 bg-neon-green/5"
        >
          <h2 className="font-mono text-neon-green text-sm mb-4">◈ CLIENT BUNDLE BUDGET (10MB target)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Three.js Core', size: '620KB', pct: 6.2 },
              { label: 'R3F + Drei', size: '180KB', pct: 1.8 },
              { label: 'Game Logic', size: '120KB', pct: 1.2 },
              { label: 'Shaders', size: '15KB', pct: 0.15 },
              { label: 'Colyseus SDK', size: '45KB', pct: 0.45 },
              { label: 'Supabase SDK', size: '90KB', pct: 0.9 },
              { label: 'Textures (KTX2)', size: '4.2MB', pct: 42 },
              { label: 'Models (Draco)', size: '2.8MB', pct: 28 },
              { label: 'Audio (OGG)', size: '1.5MB', pct: 15 },
              { label: 'Other deps', size: '430KB', pct: 4.3 },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="font-mono text-xs text-gray-500 mb-1">{item.label}</div>
                <div className="font-mono text-sm text-white">{item.size}</div>
                <div className="mt-1 h-1 bg-void-lighter rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon-green rounded-full"
                    style={{ width: `${Math.min(item.pct * 2, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-neon-green/20 flex justify-between font-mono text-xs">
            <span className="text-gray-400">TOTAL ESTIMATED: ~9.9MB</span>
            <span className="text-neon-green">✓ WITHIN BUDGET</span>
          </div>
        </motion.div>

        {/* Tech items */}
        <div className="space-y-8">
          {techItems.map((category, catIdx) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + catIdx * 0.1 }}
            >
              <h2 className="font-mono text-amber text-sm mb-4 tracking-wider">
                ◈ {category.category}
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {category.items.map((item) => (
                  <div
                    key={item.name}
                    className="border border-void-lighter rounded-lg p-4 bg-void-light/30 hover:bg-void-lighter/50 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-mono text-white text-sm font-medium">{item.name}</h3>
                      <span className="font-mono text-xs text-neon-green/70 bg-neon-green/10 px-2 py-0.5 rounded">{item.license}</span>
                      <span className="font-mono text-xs text-gray-500">{item.size}</span>
                    </div>
                    <p className="text-gray-400 text-sm">{item.reason}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Constraints met */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 border border-blood/30 rounded-lg p-6 bg-blood/5"
        >
          <h2 className="font-mono text-blood-light text-sm mb-4">◈ CONSTRAINTS VERIFICATION</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-neon-green font-mono text-xs mb-1">60fps on integrated GPU</div>
              <p className="text-gray-400 text-sm">Low-poly PS1 aesthetic = fewer triangles. Instanced rendering for hallucinations. LOD system for environments.</p>
            </div>
            <div>
              <div className="text-neon-green font-mono text-xs mb-1">{'<'}10MB initial load</div>
              <p className="text-gray-400 text-sm">KTX2 textures + Draco models + OGG audio. Lazy-load levels. Code-split by route.</p>
            </div>
            <div>
              <div className="text-neon-green font-mono text-xs mb-1">Desktop-only game</div>
              <p className="text-gray-400 text-sm">Site is mobile-responsive. Game requires keyboard + mouse + mic. Graceful degradation message on mobile.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
