# ── Stage 1: Build ────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies — use npm install (not ci) so npm resolves
# the correct platform-specific @next/swc-linux-x64-musl binary
# instead of failing on the Windows-generated lock file.
COPY package.json package-lock.json* ./
RUN npm install

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 2: Run ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Static assets
RUN mkdir -p ./public
COPY --from=builder /app/public ./public

# standalone output includes its own minimal node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Data directory — XLSX files + finger_codes.json
# (can be overridden by a volume mount in docker-compose)
COPY --from=builder /app/file ./file

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
CMD ["node", "server.js"]
