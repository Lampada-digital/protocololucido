import { motion } from 'framer-motion';

export default function Deployment() {
  return (
    <section className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-blood-light">04.</span> Deployment Architecture
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            CI/CD pipeline, containerized game server, global CDN for assets, and real-time analytics for balancing.
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="font-mono text-neon-green text-sm mb-4">◈ DEPLOYMENT TOPOLOGY</h2>
          <div className="code-block">
            <pre className="p-6 text-sm font-mono text-gray-300 leading-relaxed overflow-x-auto">
              <code>{`
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLOUDFLARE EDGE                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │  CF Pages     │  │  CF R2       │  │  CF Workers (Edge Functions) │  │
│  │  (Next.js)    │  │  (Game CDN)  │  │  - Auth middleware           │  │
│  │  - Site       │  │  - Models    │  │  - Lore unlocks              │  │
│  │  - Game Host  │  │  - Textures  │  │  - Rate limiting             │  │
│  │  - SSR/API    │  │  - Audio     │  │  - A/B testing               │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┬───────────────┘  │
│         │                  │                          │                  │
└─────────┼──────────────────┼──────────────────────────┼──────────────────┘
          │                  │                          │
          ▼                  ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          ORIGIN SERVERS                                  │
│                                                                          │
│  ┌─────────────────────┐    ┌────────────────────────────────────────┐  │
│  │  VERCEL / CF PAGES   │    │  DOCKER CLUSTER (Railway / Fly.io)    │  │
│  │                      │    │                                        │  │
│  │  Next.js 14          │    │  ┌──────────┐  ┌──────────────────┐  │  │
│  │  - SSG Landing       │    │  │ Colyseus │  │ Colyseus         │  │  │
│  │  - SSR Hub           │    │  │ Server 1 │  │ Server 2         │  │  │
│  │  - API Routes        │    │  │ (Region: │  │ (Region:         │  │  │
│  │  - ISR for Lore      │    │  │  US-East)│  │  EU-West)        │  │  │
│  │                      │    │  └────┬─────┘  └────┬─────────────┘  │  │
│  └──────────┬───────────┘    │       │              │                │  │
│             │                │       ▼              ▼                │  │
│             │                │  ┌──────────────────────────────┐    │  │
│             │                │  │  Redis (Session Cache)       │    │  │
│             │                │  │  - Matchmaking state         │    │  │
│             │                │  │  - Player sessions           │    │  │
│             │                │  │  - Rate limit counters       │    │  │
│             │                │  └──────────────────────────────┘    │  │
│             │                └────────────────────────────────────────┘  │
│             │                                                            │
└─────────────┼────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                      │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  SUPABASE         │  │  POSTGRESQL      │  │  ANALYTICS DB        │  │
│  │                   │  │  (Supabase)      │  │  (Supabase / Mixpanel│  │
│  │  - Auth (OAuth)   │  │                  │  │                      │  │
│  │  - Player profiles│  │  - Progression   │  │  - Fear responses    │  │
│  │  - Realtime DB    │  │  - Unlocks       │  │  - Session metrics   │  │
│  │  - Edge Functions │  │  - Leaderboards  │  │  - Phobia stats      │  │
│  │  - Storage        │  │  - Settings      │  │  - Balance data      │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        MONITORING & ANALYTICS                            │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  Grafana Cloud    │  │  Sentry          │  │  PostHog             │  │
│  │  - Server metrics │  │  - Error tracking│  │  - Product analytics │  │
│  │  - Player counts  │  │  - Performance   │  │  - Fear response     │  │
│  │  - Room health    │  │  - Uptime        │  │    correlation       │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
`}</code>
            </pre>
          </div>
        </motion.div>

        {/* CI/CD Pipeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="font-mono text-neon-green text-sm mb-4">◈ CI/CD PIPELINE</h2>
          <div className="code-block">
            <pre className="p-6 text-sm font-mono text-gray-300 leading-relaxed overflow-x-auto">
              <code>{`# .github/workflows/ci.yml
name: Lucid Protocol CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  TURBO_TOKEN: \${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: \${{ secrets.TURBO_TEAM }}

jobs:
  # ─── Stage 1: Lint & Type Check ───────────────────────
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-\${{ hashFiles('**/package-lock.json') }}
      - run: npm ci
      - run: npx turbo lint typecheck test

  # ─── Stage 2: Build & Deploy Site ─────────────────────
  deploy-site:
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx turbo build --filter=web
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: \${{ secrets.CF_API_TOKEN }}
          accountId: \${{ secrets.CF_ACCOUNT_ID }}
          projectName: lucid-protocol
          directory: apps/web/dist

  # ─── Stage 3: Build & Deploy Game Server ──────────────
  deploy-server:
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: |
          docker build -t lucid-server:latest \\
            -f packages/server/Dockerfile .
      - name: Push to registry
        run: |
          echo "\${{ secrets.GHCR_TOKEN }}" | \\
            docker login ghcr.io -u \${{ github.actor }} --password-stdin
          docker tag lucid-server:latest \\
            ghcr.io/\${{ github.repository }}/server:latest
          docker push ghcr.io/\${{ github.repository }}/server:latest
      - name: Deploy to Railway
        run: |
          railway up --service lucid-server

  # ─── Stage 4: Upload Game Assets ──────────────────────
  deploy-assets:
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Compress & upload to R2
        run: |
          npx turbo build --filter=game
          # Upload compressed assets to Cloudflare R2
          npx wrangler r2 bucket upload \\
            apps/game/dist/assets \\
            --bucket lucid-game-assets \\
            --prefix v\$(cat apps/game/package.json | jq -r .version)

  # ─── Stage 5: Post-deploy smoke tests ─────────────────
  smoke-test:
    needs: [deploy-site, deploy-server]
    runs-on: ubuntu-latest
    steps:
      - name: Health check
        run: |
          curl -f https://lucidprotocol.com/api/health
          curl -f https://lucidprotocol.com/api/rooms/status
      - name: WebSocket connection test
        run: |
          node scripts/smoke-test-ws.js

# ─── Dockerfile for Game Server ─────────────────────────
# packages/server/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/server/package*.json ./packages/server/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --workspace=packages/server --workspace=packages/shared
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/server

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 2567
CMD ["node", "dist/index.js"]
`}</code>
            </pre>
          </div>
        </motion.div>

        {/* CDN Strategy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="border border-void-lighter rounded-lg p-6">
            <h3 className="font-mono text-amber text-sm mb-3">⚡ CDN STRATEGY (Cloudflare R2)</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• <span className="text-white">Zero egress fees</span> — critical for game assets</li>
              <li>• Versioned asset paths: <code className="text-neon-green text-xs">/v2.1.0/models/level1.draco</code></li>
              <li>• KTX2 textures with fallback to PNG</li>
              <li>• Draco-compressed glTF models</li>
              <li>• OGG audio with WebM fallback</li>
              <li>• Cache-Control: max-age=31536000, immutable</li>
              <li>• Preload critical assets on lobby screen</li>
            </ul>
          </div>
          <div className="border border-void-lighter rounded-lg p-6">
            <h3 className="font-mono text-amber text-sm mb-3">⚡ ANALYTICS: FEAR RESPONSE TRACKING</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• Mic fear spikes → correlate with phobia triggers</li>
              <li>• Session duration vs. sanity decay rate</li>
              <li>• Hallucination type effectiveness scoring</li>
              <li>• Player retention by fear tolerance</li>
              <li>• A/B test horror elements via Edge Functions</li>
              <li>• Privacy: aggregate only, no PII in analytics</li>
              <li>• Dashboard: Grafana + PostHog for product metrics</li>
            </ul>
          </div>
        </motion.div>

        {/* Cost estimate */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="border border-neon-green/20 rounded-lg p-6 bg-neon-green/5"
        >
          <h2 className="font-mono text-neon-green text-sm mb-4">◈ MONTHLY COST ESTIMATE (MVP Phase: 1K-5K MAU)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { service: 'Cloudflare Pages', cost: '$0', note: 'Free tier' },
              { service: 'Cloudflare R2', cost: '$0-5', note: '10GB storage + ops' },
              { service: 'Railway (Server)', cost: '$5-20', note: '2 instances' },
              { service: 'Supabase', cost: '$0-25', note: 'Free → Pro at 5K MAU' },
              { service: 'Vercel (fallback)', cost: '$0', note: 'Hobby tier' },
              { service: 'Sentry', cost: '$0', note: 'Developer plan' },
              { service: 'PostHog', cost: '$0', note: 'Free up to 100K events' },
              { service: 'GitHub Actions', cost: '$0', note: '2K min/month free' },
            ].map((item) => (
              <div key={item.service} className="text-center">
                <div className="font-mono text-xs text-gray-500 mb-1">{item.service}</div>
                <div className="font-mono text-lg text-neon-green">{item.cost}</div>
                <div className="font-mono text-[10px] text-gray-600">{item.note}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-neon-green/20 text-center">
            <span className="font-mono text-sm text-gray-400">TOTAL ESTIMATED: </span>
            <span className="font-mono text-sm text-neon-green">$5-50/month</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
