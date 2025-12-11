# Hitoko Pusher - Multi-stage Dockerfile
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
#RUN npm ci --only=production
RUN npm i

# Copy application source
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3001

# Default command (can be overridden)
CMD ["npm", "start"]

# Worker image
FROM base AS worker
CMD ["npm", "run", "worker"]

# Server image
FROM base AS server
EXPOSE 3001
CMD ["npm", "run", "server"]

# Auto-reply bot image
FROM base AS auto-reply
CMD ["npm", "run", "auto-reply"]
