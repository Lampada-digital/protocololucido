import { motion } from 'framer-motion';

interface NavigationProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const sections = [
  { id: 'hero', label: 'HOME', icon: '◈' },
  { id: 'architecture', label: 'ARCHITECTURE', icon: '⬡' },
  { id: 'techstack', label: 'STACK', icon: '⬢' },
  { id: 'code', label: 'CODE', icon: '⟐' },
  { id: 'deployment', label: 'DEPLOY', icon: '◇' },
  { id: 'roadmap', label: 'ROADMAP', icon: '▣' },
];

export default function Navigation({ activeSection, setActiveSection }: NavigationProps) {
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-void/90 backdrop-blur-md border-b border-void-lighter"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => setActiveSection('hero')}
          className="flex items-center gap-2 group"
        >
          <span className="text-blood-light text-lg font-bold">◈</span>
          <span className="font-mono text-xs text-gray-400 group-hover:text-white transition-colors hidden sm:inline">
            LUCID://PROTOCOL
          </span>
        </button>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-3 py-1.5 rounded font-mono text-xs transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-blood/20 text-blood-light border border-blood/40'
                  : 'text-gray-500 hover:text-white hover:bg-void-lighter'
              }`}
            >
              <span className="hidden md:inline">{section.label}</span>
              <span className="md:hidden">{section.icon}</span>
            </button>
          ))}
        </div>

        {/* Status indicator */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="font-mono text-xs text-gray-500">SYSTEM ACTIVE</span>
        </div>
      </div>
    </motion.nav>
  );
}
