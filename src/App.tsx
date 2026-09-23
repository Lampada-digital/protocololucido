import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hero from './components/Hero';
import Navigation from './components/Navigation';
import Architecture from './components/Architecture';
import TechStack from './components/TechStack';
import CodeShowcase from './components/CodeShowcase';
import Deployment from './components/Deployment';
import Roadmap from './components/Roadmap';
import Footer from './components/Footer';

function App() {
  const [activeSection, setActiveSection] = useState('hero');

  return (
    <div className="min-h-screen bg-void text-white font-sans noise-overlay">
      {/* CRT Overlay */}
      <div className="crt-overlay" />
      
      {/* Navigation */}
      <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Main Content */}
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {activeSection === 'hero' && <Hero onNavigate={setActiveSection} />}
            {activeSection === 'architecture' && <Architecture />}
            {activeSection === 'techstack' && <TechStack />}
            {activeSection === 'code' && <CodeShowcase />}
            {activeSection === 'deployment' && <Deployment />}
            {activeSection === 'roadmap' && <Roadmap />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default App;
