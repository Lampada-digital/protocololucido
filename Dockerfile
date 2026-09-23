FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/ ./server/

# Install production dependencies only
RUN npm ci --only=production

# Expose Colyseus port
EXPOSE 2567

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:2567/health || exit 1

# Start server
CMD ["node", "server/index.js"]
