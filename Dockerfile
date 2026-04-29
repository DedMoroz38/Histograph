# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build the Next.js app
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

# Build tools required by better-sqlite3 native bindings
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app/frontend

# Install deps first (layer-cached until package.json changes)
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Production runner
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app/frontend

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# On Railway: override this with DB_PATH=/data/videos.db and mount /data as a volume
ENV DB_PATH=/data/videos.db

# Next.js standalone output
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static     ./.next/static
COPY --from=builder /app/frontend/public           ./public

# better-sqlite3 native module isn't always picked up by the standalone trace
COPY --from=builder /app/frontend/node_modules/better-sqlite3    ./node_modules/better-sqlite3
COPY --from=builder /app/frontend/node_modules/bindings          ./node_modules/bindings
COPY --from=builder /app/frontend/node_modules/file-uri-to-path  ./node_modules/file-uri-to-path
COPY --from=builder /app/frontend/node_modules/bcryptjs          ./node_modules/bcryptjs

# Seed database baked into the image (copied to volume on first start by entrypoint)
COPY videos.db /app/seed.db

# Entrypoint
COPY docker-entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
