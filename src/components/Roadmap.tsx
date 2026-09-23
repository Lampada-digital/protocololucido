import { motion } from 'framer-motion';

interface WeekTask {
  day: string;
  task: string;
  priority: 'critical' | 'high' | 'medium';
}

interface Week {
  week: number;
  title: string;
  markerClass: string;
  dotClass: string;
  headerClass: string;
  milestoneClass: string;
  tasks: WeekTask[];
  milestone: string;
}

const weeks: Week[] = [
  {
    week: 1,
    title: 'FOUNDATION',
    markerClass: 'bg-neon-green border-void',
    dotClass: 'bg-neon-green',
    headerClass: 'text-neon-green',
    milestoneClass: 'border-neon-green/20 bg-neon-green/5 text-neon-green',
    tasks: [
      { day: 'Mon-Tue', task: 'Set up Turborepo monorepo. Initialize all packages. Configure TypeScript, ESLint, Prettier shared configs.', priority: 'critical' },
      { day: 'Tue-Wed', task: 'Build Colyseus server skeleton. Implement DiveRoom with basic state schema. Get WebSocket connection working.', priority: 'critical' },
      { day: 'Wed-Thu', task: 'Set up React Three Fiber scene. Implement PS1 vertex/fragment shaders. Get vertex snapping + dithering working.', priority: 'critical' },
      { day: 'Thu-Fri', task: 'Build SanitySystem core. Implement server-authoritative sanity decay. Client-side reconciliation with interpolation.', priority: 'critical' },
      { day: 'Sat-Sun', task: 'Basic player controller (WASD + mouse look). Connect to Colyseus for position sync. First networked movement test.', priority: 'high' },
    ],
    milestone: '✓ Two players can move in same 3D scene with PS1 shaders applied'
  },
  {
    week: 2,
    title: 'CORE MECHANICS',
    markerClass: 'bg-neon-blue border-void',
    dotClass: 'bg-neon-blue',
    headerClass: 'text-neon-blue',
    milestoneClass: 'border-neon-blue/20 bg-neon-blue/5 text-neon-blue',
    tasks: [
      { day: 'Mon-Tue', task: 'Implement MicFearDetector. Web Audio API integration. Volume + frequency analysis. Fear spike callback system.', priority: 'critical' },
      { day: 'Tue-Wed', task: 'Build HallucinationManager. Per-player instance spawning. Server sends seeds, client generates visuals. Test with simple geometry.', priority: 'critical' },
      { day: 'Wed-Thu', task: 'Implement DivergentPerception system. Per-player visibility masks. Same scene graph, different visual output. Performance test.', priority: 'critical' },
      { day: 'Thu-Fri', task: 'Build GaslightUI React overlay. FakeHealthBar component. Sanity-based distortion levels. Accessibility toggle system.', priority: 'high' },
      { day: 'Sat-Sun', task: 'PhobiaEngine skeleton. Modular phobia profiles. Player preference selection. Basic fear adaptation logic.', priority: 'high' },
    ],
    milestone: '✓ Player screams → hallucination spawns → UI lies about health → each player sees different things'
  },
  {
    week: 3,
    title: 'CONTENT & POLISH',
    markerClass: 'bg-neon-purple border-void',
    dotClass: 'bg-neon-purple',
    headerClass: 'text-neon-purple',
    milestoneClass: 'border-neon-purple/20 bg-neon-purple/5 text-neon-purple',
    tasks: [
      { day: 'Mon-Tue', task: 'Build first playable level (The Underneath). Low-poly environment. PS1 textures. Atmospheric audio. Fog system.', priority: 'critical' },
      { day: 'Tue-Wed', task: 'Implement CRT post-processing shader. Scanlines, curvature, chromatic aberration. Integrate with sanity effects.', priority: 'high' },
      { day: 'Wed-Thu', task: 'WebRTC voice chat integration. PeerJS mesh for 4 players. Audio distortion filter based on sanity level.', priority: 'high' },
      { day: 'Thu-Fri', task: 'Build Next.js landing page. ARG elements (hidden terminal, corrupted files). CRT aesthetic. Responsive layout.', priority: 'medium' },
      { day: 'Sat-Sun', task: 'Supabase integration. Auth flow. Player profiles. Sanity upgrade system. Lore unlock mechanics.', priority: 'medium' },
    ],
    milestone: '✓ Complete 10-minute gameplay loop in one level with all core systems active'
  },
  {
    week: 4,
    title: 'SHIP IT',
    markerClass: 'bg-blood-light border-void',
    dotClass: 'bg-blood-light',
    headerClass: 'text-blood-light',
    milestoneClass: 'border-blood/20 bg-blood/5 text-blood-light',
    tasks: [
      { day: 'Mon-Tue', task: 'Performance optimization pass. Target 60fps on integrated GPU. Asset compression (KTX2, Draco, OGG). Bundle under 10MB.', priority: 'critical' },
      { day: 'Tue-Wed', task: 'Set up CI/CD pipeline. Docker build for server. Cloudflare Pages deployment. R2 asset upload. Smoke tests.', priority: 'critical' },
      { day: 'Wed-Thu', task: 'Playtesting with 4 real players. Bug fixes. Balance tuning (sanity decay rates, hallucination timing, fear thresholds).', priority: 'critical' },
      { day: 'Thu-Fri', task: 'Landing page polish. SEO optimization. Social sharing. "Join the waitlist" CTA. Analytics setup.', priority: 'high' },
      { day: 'Fri-Sat', task: 'Launch preparation. Monitoring dashboards. Error tracking (Sentry). Player feedback system. Emergency rollback plan.', priority: 'high' },
      { day: 'Sat-Sun', task: '🚀 PUBLIC BETA LAUNCH. Monitor closely. Hot-fix pipeline ready. Community Discord active. Collect fear data.', priority: 'critical' },
    ],
    milestone: '✓ Playable vertical slice live on the internet. Players can queue, dive, experience horror, and share clips.'
  }
];

function getPriorityClass(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-blood/20 text-blood-light';
    case 'high': return 'bg-amber/20 text-amber';
    default: return 'bg-gray-800 text-gray-400';
  }
}

export default function Roadmap() {
  return (
    <section className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-blood-light">05.</span> MVP Roadmap
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            4-week sprint to a playable vertical slice. Prioritizes shipping a viral-ready experience over feature completeness.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-neon-green via-neon-blue via-neon-purple to-blood-light" />

          {weeks.map((week, weekIdx) => (
            <motion.div
              key={week.week}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: weekIdx * 0.2 }}
              className="relative pl-12 md:pl-20 pb-12"
            >
              {/* Week marker */}
              <div className={`absolute left-2 md:left-6 w-5 h-5 rounded-full ${week.markerClass} border-2 flex items-center justify-center`}>
                <div className={`w-2 h-2 rounded-full ${week.dotClass}`} />
              </div>

              {/* Week header */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`font-mono text-sm ${week.headerClass}`}>WEEK {week.week}</span>
                  <span className="font-mono text-xs text-gray-600">—</span>
                  <span className="font-mono text-xs text-gray-500">{week.title}</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{week.title}</h2>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {week.tasks.map((task, taskIdx) => (
                  <motion.div
                    key={taskIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: weekIdx * 0.2 + taskIdx * 0.05 }}
                    className="border border-void-lighter rounded-lg p-4 bg-void-light/30 hover:bg-void-lighter/50 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-gray-500">{task.day}</span>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${getPriorityClass(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{task.task}</p>
                  </motion.div>
                ))}
              </div>

              {/* Milestone */}
              <div className={`mt-4 p-3 rounded-lg border ${week.milestoneClass}`}>
                <p className="font-mono text-sm">{week.milestone}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Post-MVP */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 border border-void-lighter rounded-lg p-6"
        >
          <h2 className="font-mono text-amber text-sm mb-4">◈ POST-MVP PRIORITIES (Month 2+)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-mono text-xs text-neon-green mb-2">CONTENT</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• 3 more levels with unique horror themes</li>
                <li>• Procedural level elements</li>
                <li>• Boss encounters (Nightmare entities)</li>
                <li>• Lore expansion (10+ unlockable files)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-xs text-neon-blue mb-2">SYSTEMS</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Advanced PhobiaEngine ML adaptation</li>
                <li>• Shared hallucinations (group terror)</li>
                <li>• Permadeath consequences</li>
                <li>• Cross-session memory (target remembers)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-xs text-neon-purple mb-2">SOCIAL</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Spectator mode (watch friends dive)</li>
                <li>• Clip sharing (auto-record scary moments)</li>
                <li>• Leaderboards (sanity survival time)</li>
                <li>• Custom lobbies with house rules</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Team allocation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 border border-blood/20 rounded-lg p-6 bg-blood/5"
        >
          <h2 className="font-mono text-blood-light text-sm mb-4">◈ TEAM ALLOCATION (2-3 Devs)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-mono text-xs text-white mb-2">DEV 1: GAME ENGINEER</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Three.js + R3F core</li>
                <li>• PS1 shader pipeline</li>
                <li>• SanitySystem + HallucinationManager</li>
                <li>• Performance optimization</li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-xs text-white mb-2">DEV 2: BACKEND / NETWORK</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Colyseus server + rooms</li>
                <li>• Supabase integration</li>
                <li>• WebRTC voice chat</li>
                <li>• CI/CD + deployment</li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-xs text-white mb-2">DEV 3: FRONTEND / DESIGN</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Next.js site + ARG elements</li>
                <li>• GaslightUI React overlay</li>
                <li>• MicFearDetector</li>
                <li>• Level design + art direction</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500 font-mono">
            Note: With 2 devs, merge roles 1+3 and 2 handles solo. Add contractor for art/assets if needed.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
