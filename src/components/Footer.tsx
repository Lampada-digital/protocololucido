import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="border-t border-void-lighter bg-void-light/30 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8"
        >
          {/* Brand */}
          <div>
            <h3 className="font-mono text-blood-light text-sm mb-3">◈ THE LUCID PROTOCOL</h3>
            <p className="text-gray-500 text-sm">
              A web-based multiplayer psychological horror FPS. Enter the shared unconscious. 
              Face what lies beneath.
            </p>
            <p className="text-gray-600 text-xs mt-3 font-mono">
              "What you fear is what finds you."
            </p>
          </div>

          {/* Tech summary */}
          <div>
            <h3 className="font-mono text-neon-green text-sm mb-3">◈ STACK SUMMARY</h3>
            <ul className="text-gray-500 text-sm space-y-1">
              <li>Game: Three.js + React Three Fiber</li>
              <li>Server: Colyseus + Docker</li>
              <li>Site: Next.js 14 + Tailwind</li>
              <li>Data: Supabase + Cloudflare R2</li>
              <li>Build: Turborepo + GitHub Actions</li>
            </ul>
          </div>

          {/* Key metrics */}
          <div>
            <h3 className="font-mono text-amber text-sm mb-3">◈ TARGET METRICS</h3>
            <ul className="text-gray-500 text-sm space-y-1">
              <li>Performance: 60fps on integrated GPU</li>
              <li>Bundle: {'<'}10MB initial load</li>
              <li>Session: 10-15 minutes</li>
              <li>Players: 4-player co-op</li>
              <li>Team: 2-3 developers</li>
            </ul>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <div className="border-t border-void-lighter pt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="font-mono text-xs text-gray-600">
            Technical Architecture Document v2.1.0 — 2026
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-gray-600">
              License: MIT
            </span>
            <span className="font-mono text-xs text-gray-600">
              Status: <span className="text-neon-green">ACTIVE</span>
            </span>
          </div>
        </div>

        {/* Hidden ARG element */}
        <div className="mt-8 text-center">
          <p className="font-mono text-[10px] text-void-lighter hover:text-blood/40 transition-colors duration-1000 cursor-default select-none">
            ◈ PROTOCOL BREACH DETECTED // LAYER 7 UNSTABLE // DIVER COUNT: ████████ // TIMESTAMP: {new Date().toISOString()} ◈
          </p>
        </div>
      </div>
    </footer>
  );
}
