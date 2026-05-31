FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy dependency files and install
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source and generate Prisma client
COPY . .
RUN npx prisma generate

# Build TypeScript
RUN npm run build

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"

# Install runtime dependencies
RUN apk add --no-cache openssl ca-certificates tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy built artifacts from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create logs directory with proper permissions
RUN mkdir -p logs && chown nodejs:nodejs logs

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Use tini as init process
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
