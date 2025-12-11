# Hitoko Pusher

A Node.js application for Hitoko chat integration with two main components:
1. **Worker**: Listens to real-time messages from Hitoko's MQTT WebSocket and forwards them to a webhook
2. **Server**: HTTP API server to send reply messages back to Hitoko

## Features

### Worker Features
- Connects to Hitoko's MQTT WebSocket for real-time message streaming
- Fetches shop and session information via Hitoko API
- Automatically subscribes to relevant chat topics
- Forwards all incoming messages to a configurable webhook
- Automatic reconnection with exponential backoff
- Retry logic for webhook delivery
- Graceful shutdown handling

### Server Features
- HTTP REST API to send messages to Hitoko
- Support for text and image messages
- Simple endpoints for easy integration
- Automatic message type detection
- Built-in validation and error handling

## Prerequisites

- Node.js 14+ installed
- Access to Hitoko API (valid authentication token)
- A webhook endpoint to receive messages
- (Optional) Docker for containerized deployment

## Project Structure

```
hitoko-pusher/
├── src/                      # Source code
│   ├── hitoko-api.js         # Hitoko API client
│   ├── mqtt-client.js        # MQTT/WebSocket client
│   ├── message-parser.js     # Message parsing utilities
│   └── webhook-forwarder.js  # Webhook forwarding logic
├── examples/                 # Example implementations
│   ├── example-auto-reply.js       # Auto-reply bot
│   └── example-webhook-handler.js  # Webhook receiver
├── docs/                     # Documentation
│   ├── BINARY-FORMAT.md      # Binary message format
│   ├── WEBHOOK-PAYLOAD.md    # Webhook payload structure
│   ├── REVERSE-ENGINEERING.md # RE notes
│   └── examples.md           # API usage examples
├── scripts/                  # Utility scripts
│   └── test-server.sh        # Server test script
├── index.js                  # Main worker entry point
├── server.js                 # API server entry point
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose setup
└── README.md                # This file
```

## Installation

### Option 1: Using npm (Local Development)

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update with your credentials
   - Set `WEBHOOK_URL` to your webhook endpoint

### Option 2: Using Docker (Recommended for Production)

1. Copy `.env.example` to `.env` and configure

2. Start with Docker Compose:
```bash
docker-compose up -d
```

See [DOCKER.md](DOCKER.md) for detailed Docker deployment instructions.

## Configuration

Edit the `.env` file with your settings:

```env
# Hitoko API Configuration
HITOKO_AUTH_TOKEN=your_token_here
HITOKO_API_BASE=https://www.hitoko.co.id
HITOKO_WS_URL=wss://www.hitoko.co.id/erp/ws-mqtt/mqtt

# Shop Configuration
SHOP_ID=your_shop_id
MARKETPLACE_CODE=00

# Webhook Configuration (single or multiple comma-separated)
WEBHOOK_URL=http://your-webhook-endpoint.com/webhook
# Multiple webhooks: WEBHOOK_URL=http://webhook1.com,http://webhook2.com

# Server Configuration
SERVER_PORT=3001
```

### Multiple Webhooks

You can forward messages to multiple webhook endpoints simultaneously by separating URLs with commas:

```env
WEBHOOK_URL=https://test.example.com/hook,https://prod.example.com/hook
```

Messages will be sent to all webhooks **in parallel**. See [docs/MULTIPLE-WEBHOOKS.md](docs/MULTIPLE-WEBHOOKS.md) for details.

## Usage

### Running the Worker

Start the MQTT worker to listen for incoming messages:

```bash
npm run worker
# or
npm start
```

### Running the Server

Start the HTTP API server to send reply messages:

```bash
npm run server
```

The server will be available at `http://localhost:3001` (or your configured port).

### API Endpoints

See [examples.md](examples.md) for detailed API usage examples.

#### Quick Example - Send Text Message

```bash
curl -X POST http://localhost:3001/api/reply/text \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "YOUR_SESSION_ID",
    "shopId": "YOUR_SHOP_ID",
    "buyerId": "BUYER_ID",
    "text": "Hello! Thanks for your message."
  }'
```

#### Quick Example - Send Image Message

```bash
curl -X POST http://localhost:3001/api/reply/image \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "YOUR_SESSION_ID",
    "shopId": "YOUR_SHOP_ID",
    "buyerId": "BUYER_ID",
    "imgUrl": "https://example.com/image.jpg",
    "width": 300,
    "height": 300
  }'
```

### Available Scripts

- `npm start` - Start the worker (same as `npm run worker`)
- `npm run worker` - Start the MQTT worker (forwards messages to webhook)
- `npm run server` - Start the HTTP API server (for sending replies)
- `npm run auto-reply` - Start the auto-reply bot (automatically responds to customers)
- `npm run webhook` - Start example webhook handler (receives messages on port 3000)

## Testing the Complete Flow

### 1. Start the Example Webhook Handler
```bash
npm run webhook
```
This starts a test webhook on `http://localhost:3000/webhook`

### 2. Update `.env`
Make sure `WEBHOOK_URL` points to your webhook:
```env
WEBHOOK_URL=http://localhost:3000/webhook
```

### 3. Start the Worker
```bash
npm run worker
```

### 4. Send a Test Message
Send a message to your Shopee shop, and you'll see:
- Worker receives the MQTT message
- Parses and formats it
- Forwards clean payload to webhook
- Webhook handler displays the message and suggests replies

## How It Works

1. **Initialization**: Fetches shop information and chat sessions from Hitoko API
2. **MQTT Connection**: Connects to Hitoko's MQTT WebSocket endpoint
3. **Topic Subscription**: Subscribes to relevant topics:
   - `chat/{companyId}/#`
   - `message/{companyId}/#`
   - `shop/{shopId}/#`
   - `session/{shopId}/#`
4. **Message Handling**: When a message arrives:
   - Parses the message payload
   - Logs the message details
   - Forwards to the configured webhook with retry logic

## Auto-Reply Bot

⚠️ **IMPORTANT: Auto-reply is DISABLED by default!**

The main worker (`npm run worker`) only forwards messages to your webhook. It does **NOT** automatically reply to customers.

### Optional: Enable Auto-Reply

If you want to automatically respond to customer messages, you can run the separate auto-reply bot:

```bash
npm run auto-reply
```

This is a **completely separate script** that:
- Listens for messages from customers (buyers)
- Detects keywords in messages (price, stock, shipping, etc.)
- Automatically sends appropriate replies
- Shows reply commands in the console

⚠️ **Before using in production:**
1. Test thoroughly with your actual message flow
2. Customize the auto-reply logic in `examples/example-auto-reply.js`
3. Make sure responses are appropriate for your business
4. Consider having a human review auto-responses periodically

**Note:** The auto-reply bot runs independently from the main worker. You can run both simultaneously if needed.

## Binary Message Format

MQTT messages from Hitoko come in binary format:

```
[SHOP_ID][JSON_PAYLOAD]
Example: 001640619651{"extras":{"appType":"15","message":"..."}}
```

The worker automatically:
- Parses binary messages
- Extracts shop ID prefix
- Decodes nested JSON structure
- Formats message content for easy access

See [BINARY-FORMAT.md](BINARY-FORMAT.md) for detailed documentation.

## Webhook Payload Format

Messages forwarded to your webhook are **clean and fully parsed** - no nested stringified JSON!

```json
{
  "event": {
    "type": "chat_message",
    "timestamp": "2025-12-11T08:49:36.678Z",
    "topic": "001640619651"
  },
  "shop": {
    "id": 1640619651,
    "name": "Aoraki Perfume",
    "marketplaceCode": "00"
  },
  "message": {
    "id": "2385373076638777713",
    "sessionId": "28554413104092054",
    "sentTime": "2025-12-11 08:49:36",
    "content": {
      "type": "text",
      "text": "Hello, do you have stock?",
      "image": null
    },
    "from": {
      "accountId": "6648342",
      "accountType": "1",
      "isCustomer": true
    }
  },
  "customer": {
    "id": "6648342",
    "nickname": "yehezkielpanjipamungkas",
    "avatar": "https://..."
  },
  "session": {
    "id": "28554413104092054",
    "unreadCount": 1,
    "summary": "..."
  },
  "replyWith": {
    "sessionId": "28554413104092054",
    "shopId": "1640619651",
    "buyerId": "6648342",
    "marketplaceCode": "00",
    "exampleCurl": "curl -X POST ..."
  }
}
```

See [WEBHOOK-PAYLOAD.md](WEBHOOK-PAYLOAD.md) for complete documentation and examples.

### Quick Access Fields

```javascript
// Check if from customer
if (payload.message.from.isCustomer) { ... }

// Get message text
const text = payload.message.content.text;

// Get customer name
const name = payload.customer.nickname;

// Reply to customer
const { sessionId, shopId, buyerId } = payload.replyWith;
```

## Error Handling

- **MQTT Connection**: Automatic reconnection with up to 10 attempts
- **Webhook Delivery**: Retries up to 3 times with exponential backoff
- **Graceful Shutdown**: Handles SIGINT/SIGTERM signals properly

## Stopping the Worker

Press `Ctrl+C` to gracefully stop the worker.

## Troubleshooting

### Connection Issues
- Verify your `HITOKO_AUTH_TOKEN` is valid
- Check that `HITOKO_WS_URL` is accessible
- Ensure firewall allows WebSocket connections

### Webhook Delivery Failures
- Verify `WEBHOOK_URL` is correct and accessible
- Check webhook endpoint logs for errors
- Ensure webhook can handle JSON POST requests

## License

ISC
