# Docker Deployment Guide

## Quick Start with Docker

### 1. Using Docker Compose (Recommended)

The easiest way to run the entire stack:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

This will start:
- **Worker**: MQTT listener on port (internal)
- **Server**: API server on port 3001

### 2. Using Docker Directly

#### Build the image:
```bash
docker build -t hitoko-pusher .
```

#### Run the Worker:
```bash
docker run -d \
  --name hitoko-worker \
  --env-file .env \
  hitoko-pusher npm run worker
```

#### Run the API Server:
```bash
docker run -d \
  --name hitoko-server \
  -p 3001:3001 \
  --env-file .env \
  hitoko-pusher npm run server
```

#### Run the Auto-Reply Bot:
```bash
docker run -d \
  --name hitoko-auto-reply \
  --env-file .env \
  hitoko-pusher npm run auto-reply
```

## Multi-stage Builds

The Dockerfile supports multiple targets:

```bash
# Build worker only
docker build --target worker -t hitoko-pusher:worker .

# Build server only
docker build --target server -t hitoko-pusher:server .

# Build auto-reply only
docker build --target auto-reply -t hitoko-pusher:auto-reply .
```

## Environment Variables

Create a `.env` file with your configuration:

```env
# Hitoko API
HITOKO_AUTH_TOKEN=your_token_here
HITOKO_API_BASE=https://www.hitoko.co.id
HITOKO_WS_URL=wss://www.hitoko.co.id/erp/ws-mqtt/mqtt

# Shop Config
SHOP_ID=1640619651
MARKETPLACE_CODE=00

# Webhook
WEBHOOK_URL=http://your-webhook-url/webhook

# Server
SERVER_PORT=3001
```

## Production Deployment

### Using Docker Compose in Production

```bash
# Start in detached mode
docker-compose up -d

# Scale workers if needed
docker-compose up -d --scale worker=3

# Update and restart
docker-compose pull
docker-compose up -d --force-recreate
```

### Health Checks

Check if services are running:

```bash
# Server health check
curl http://localhost:3001/health

# View worker logs
docker-compose logs -f worker

# View server logs
docker-compose logs -f server
```

## Docker Compose Override

Create `docker-compose.override.yml` for local development:

```yaml
version: '3.8'

services:
  server:
    volumes:
      - ./src:/app/src
      - ./.env:/app/.env
    command: npm run server

  worker:
    volumes:
      - ./src:/app/src
      - ./.env:/app/.env
    command: npm run worker
```

This allows hot-reloading during development (requires nodemon).

## Troubleshooting

### View Logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f worker
docker-compose logs -f server
```

### Restart Services:
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart worker
```

### Shell Access:
```bash
# Access running container
docker exec -it hitoko-worker sh
docker exec -it hitoko-server sh
```

### Clean Up:
```bash
# Stop and remove containers
docker-compose down

# Remove with volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Security Notes

- Never commit `.env` files to version control
- Use Docker secrets for production deployments
- Run containers as non-root user (already configured)
- Keep base images updated regularly
