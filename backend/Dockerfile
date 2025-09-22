FROM node:22-alpine AS dependencies
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY backend/ .
COPY shared/ ../shared
RUN npm run build

FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS production
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create entrypoint script to fix permissions at runtime
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "Setting up uploads directory permissions..."' >> /app/entrypoint.sh && \
    echo 'mkdir -p /app/uploads/videos' >> /app/entrypoint.sh && \
    echo '# Fix permissions for volume mount' >> /app/entrypoint.sh && \
    echo 'if [ -d "/app/uploads" ]; then' >> /app/entrypoint.sh && \
    echo '  chown -R nodejs:nodejs /app/uploads 2>/dev/null || true' >> /app/entrypoint.sh && \
    echo '  chmod -R 755 /app/uploads 2>/dev/null || true' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo 'echo "Starting application as nodejs user..."' >> /app/entrypoint.sh && \
    echo 'exec gosu nodejs "$@"' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Install gosu for better user switching
RUN apk add --no-cache gosu

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/../shared ../shared
COPY --from=builder /app/package*.json ./

RUN chown -R nodejs:nodejs /app

EXPOSE 8000
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "start"]
