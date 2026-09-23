import { motion } from 'framer-motion';

interface HeroProps {
  onNavigate: (section: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden dither-bg">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(139,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,0,0,0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blood rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Protocol designation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <span className="font-mono text-neon-green text-sm tracking-[0.3em] uppercase border border-neon-green/30 px-4 py-1 rounded-full">
            ◈ CLASSIFIED // LEVEL-7 CLEARANCE ◈
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="glitch-text text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4"
          data-text="THE LUCID PROTOCOL"
        >
          THE LUCID PROTOCOL
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="font-mono text-amber/80 text-lg md:text-xl mb-2"
        >
          O PROTOCOLO LÚCIDO
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12"
        >
          Complete Technical Architecture — Web-Based Multiplayer Psychological Horror FPS
        </motion.p>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="flex flex-wrap justify-center gap-6 mb-12 font-mono text-sm"
        >
          <div className="border border-void-lighter px-4 py-2 rounded">
            <span className="text-blood-light">SESSION:</span> 10-15 min
          </div>
          <div className="border border-void-lighter px-4 py-2 rounded">
            <span className="text-blood-light">PLAYERS:</span> 4 co-op
          </div>
          <div className="border border-void-lighter px-4 py-2 rounded">
            <span className="text-blood-light">ENGINE:</span> Three.js + R3F
          </div>
          <div className="border border-void-lighter px-4 py-2 rounded">
            <span className="text-blood-light">TARGET:</span> 60fps / 10MB
          </div>
        </motion.div>

        {/* Navigation cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto"
        >
          {[
            { id: 'architecture', label: 'MONOREPO STRUCTURE', icon: '⬡', desc: 'Folder tree & systems' },
            { id: 'techstack', label: 'TECH STACK', icon: '◈', desc: 'Tools & justification' },
            { id: 'code', label: 'CODE SNIPPETS', icon: '⟐', desc: 'Core implementations' },
            { id: 'deployment', label: 'DEPLOYMENT', icon: '⬢', desc: 'CI/CD & infrastructure' },
            { id: 'roadmap', label: 'MVP ROADMAP', icon: '◇', desc: '4-week sprint plan' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="group relative border border-void-lighter hover:border-blood/60 bg-void-light/50 hover:bg-void-lighter/50 rounded-lg p-4 text-left transition-all duration-300 pulse-glow"
            >
              <span className="text-2xl mb-2 block">{item.icon}</span>
              <span className="font-mono text-xs text-neon-green block mb-1">{item.label}</span>
              <span className="text-gray-400 text-sm">{item.desc}</span>
              <div className="absolute top-2 right-2 text-blood opacity-0 group-hover:opacity-100 transition-opacity">→</div>
            </button>
          ))}
        </motion.div>
      </div>

      {/* Bottom warning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 font-mono text-xs text-blood/60 text-center"
      >
        <p>⚠ WARNING: Prolonged exposure may cause perceptual disturbances ⚠</p>
        <p className="mt-1 text-gray-600">Technical Document v2.1.0 — Last updated: 2026</p>
      </motion.div>
    </section>
  );
}
