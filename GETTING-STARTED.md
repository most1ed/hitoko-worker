# Getting Started with Hitoko Pusher

## Quick Start (Safe Mode)

The default configuration is safe and does **NOT** auto-reply to customers.

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
HITOKO_AUTH_TOKEN=your_token_here
SHOP_ID=1640619651
WEBHOOK_URL=https://your-webhook-url.com/webhook
```

### 3. Start the Worker

```bash
npm run worker
```

✅ **This is SAFE** - it only forwards messages to your webhook. No auto-replies.

### 4. Start the API Server (Optional)

In a new terminal:

```bash
npm run server
```

✅ **This is SAFE** - provides API endpoints to manually send replies.

## What Happens by Default

```
Customer Message
       ↓
   MQTT Worker  ← You run this with: npm run worker
       ↓
   Your Webhook ← Messages forwarded here
       ↓
   Your Logic   ← YOU decide how to respond
       ↓
   API Server   ← Use this to send replies: npm run server
       ↓
   Customer
```

**Key Point:** The worker does NOT automatically reply. It only forwards messages to your webhook.

## Your Webhook Should:

1. Receive clean message payloads
2. Process/analyze the message
3. Decide if a reply is needed
4. If needed, call the API server to send a reply

Example webhook handler:

```javascript
app.post('/webhook', async (req, res) => {
  const message = req.body;

  // Check if from customer
  if (message.message.from.isCustomer) {
    const text = message.message.content.text;

    // Your business logic here
    if (needsReply(text)) {
      // Send reply via API
      await sendReply(message.replyWith);
    }
  }

  res.json({ received: true });
});
```

## Next Steps

1. ✅ **Verify webhook receives messages** - Send a test message on Shopee
2. ✅ **Test manual replies** - Use the API server to send test replies
3. ✅ **Build your logic** - Implement your webhook handler
4. ✅ **Monitor logs** - Check that everything works as expected

## Deployment

### Using npm (Development)

```bash
# Terminal 1: Worker
npm run worker

# Terminal 2: Server
npm run server
```

### Using Docker (Production)

```bash
docker-compose up -d
```

This starts:
- ✅ Worker (forwards to webhook)
- ✅ Server (API for replies)

## Troubleshooting

### Not receiving messages?

1. Check MQTT connection in logs
2. Verify SHOP_ID is correct
3. Check that you're subscribed to correct topic
4. Send a test message on Shopee

### Webhook not receiving?

1. Check WEBHOOK_URL is correct
2. Verify webhook endpoint is accessible
3. Check webhook logs
4. Test with `npm run webhook` (example handler)

### Need to send replies?

1. Make sure API server is running: `npm run server`
2. Test with curl: `npm run test:server`
3. Use the API endpoints in docs/examples.md

## Summary

- ✅ Worker only forwards messages to webhook
- ✅ YOU control when to reply via your webhook logic
- ✅ Use API server to send manual replies
- ✅ Everything is logged for debugging

**The worker never auto-replies. All replies are manual via the API server.**
