# Multiple Webhooks Support

## Overview

The Hitoko Pusher supports forwarding messages to multiple webhook endpoints simultaneously. This is useful for:
- Sending to both test and production endpoints
- Forwarding to multiple services (analytics, CRM, chat platforms)
- Creating redundancy/backup endpoints
- A/B testing different webhook handlers

## Configuration

### Single Webhook

```env
WEBHOOK_URL=http://localhost:3000/webhook
```

### Multiple Webhooks

Separate multiple URLs with commas:

```env
WEBHOOK_URL=https://flow.devotetolove.com/webhook-test/f45a3ade-f381-45ad-9e8d-ebe514bc64d9,https://flow.devotetolove.com/webhook/f45a3ade-f381-45ad-9e8d-ebe514bc64d9
```

You can add as many webhooks as needed:

```env
WEBHOOK_URL=http://webhook1.com/hook,http://webhook2.com/hook,http://webhook3.com/hook
```

## How It Works

### Parallel Forwarding

Messages are forwarded to all webhooks **in parallel** for maximum performance:

```
Message → Worker → ┌─→ Webhook 1
                   ├─→ Webhook 2
                   └─→ Webhook 3
```

### Retry Logic

Each webhook has independent retry logic:
- **Retries**: 3 attempts per webhook
- **Backoff**: Exponential (1s, 2s, 4s)
- **Timeout**: 10 seconds per request

If one webhook fails, others continue processing.

### Success Criteria

The forward operation is considered successful if **at least one webhook** returns a successful response (HTTP 200-299).

## Console Output

### Single Webhook

```
🔄 Forwarding message to 1 webhook(s)...
✅ http://localhost:3000/webhook - Status: 200

📊 Results: 1/1 succeeded, 0 failed
```

### Multiple Webhooks

```
📡 Configured 2 webhook endpoints

🔄 Forwarding message to 2 webhook(s)...
✅ https://flow.devotetolove.com/webhook-test/xxx - Status: 200
✅ https://flow.devotetolove.com/webhook/xxx - Status: 200

📊 Results: 2/2 succeeded, 0 failed
```

### Partial Failure

```
🔄 Forwarding message to 2 webhook(s)...
✅ https://flow.devotetolove.com/webhook-test/xxx - Status: 200
❌ https://flow.devotetolove.com/webhook/xxx - Error: connect ETIMEDOUT

📊 Results: 1/2 succeeded, 1 failed
```

## Response Format

The `forward()` method returns detailed results for all webhooks:

```javascript
{
  success: true,        // true if at least one webhook succeeded
  total: 2,             // total number of webhooks
  successful: 2,        // number of successful deliveries
  failed: 0,            // number of failed deliveries
  results: [
    {
      success: true,
      url: "https://flow.devotetolove.com/webhook-test/xxx",
      status: 200,
      data: { ... }     // response from webhook
    },
    {
      success: true,
      url: "https://flow.devotetolove.com/webhook/xxx",
      status: 200,
      data: { ... }
    }
  ]
}
```

## Use Cases

### 1. Test and Production

Forward to both test and production environments:

```env
WEBHOOK_URL=https://test.example.com/webhook,https://prod.example.com/webhook
```

### 2. Multiple Services

Send to different services for processing:

```env
WEBHOOK_URL=https://analytics.com/track,https://crm.com/lead,https://slack.com/notify
```

### 3. Redundancy

Create backup endpoints:

```env
WEBHOOK_URL=https://primary.com/hook,https://backup.com/hook
```

### 4. Fan-out Architecture

Distribute messages to multiple processors:

```env
WEBHOOK_URL=https://processor1.com/hook,https://processor2.com/hook,https://processor3.com/hook
```

## Best Practices

### 1. Order Doesn't Matter

Webhooks are called in parallel, so order is not guaranteed. Don't rely on one webhook completing before another.

### 2. Keep URLs Short

While there's no hard limit, keep your .env file readable by using environment-appropriate URLs.

### 3. Monitor All Endpoints

Check logs for failed webhooks:

```bash
docker-compose logs -f worker | grep "❌"
```

### 4. Use HTTPS

Always use HTTPS for production webhooks:

```env
✅ WEBHOOK_URL=https://secure.com/hook
❌ WEBHOOK_URL=http://insecure.com/hook
```

### 5. Test Separately

Test each webhook individually before combining:

```bash
# Test webhook 1
WEBHOOK_URL=https://webhook1.com/hook npm run worker

# Test webhook 2
WEBHOOK_URL=https://webhook2.com/hook npm run worker

# Test both together
WEBHOOK_URL=https://webhook1.com/hook,https://webhook2.com/hook npm run worker
```

## Performance Considerations

### Timeout Impact

With multiple webhooks, the total time is determined by the **slowest** webhook (since they run in parallel):

- 2 webhooks @ 100ms each = ~100ms total
- 2 webhooks @ 2s and 5s = ~5s total

### Resource Usage

Each webhook creates a separate HTTP connection. With many webhooks, monitor:
- Network bandwidth
- Memory usage (concurrent connections)
- API rate limits on target servers

### Recommended Limits

- **< 5 webhooks**: No issues
- **5-10 webhooks**: Monitor performance
- **> 10 webhooks**: Consider using a message queue

## Troubleshooting

### No Webhooks Configured

```
⚠️  No webhook URLs configured, skipping forward
```

**Solution**: Add `WEBHOOK_URL` to your `.env` file

### All Webhooks Failing

```
📊 Results: 0/2 succeeded, 2 failed
```

**Check:**
1. Are the URLs correct?
2. Are the endpoints accessible?
3. Check webhook endpoint logs
4. Verify firewall/network settings

### Some Webhooks Failing

```
📊 Results: 1/2 succeeded, 1 failed
```

**Check the specific error messages** in logs and fix the failing endpoint.

## Example: Dual Webhook Setup

### .env Configuration

```env
# Forward to both test and production
WEBHOOK_URL=https://test.myapp.com/hitoko/webhook,https://prod.myapp.com/hitoko/webhook
```

### Expected Output

```
📡 Configured 2 webhook endpoints
🔄 Forwarding message to 2 webhook(s)...
✅ https://test.myapp.com/hitoko/webhook - Status: 200
✅ https://prod.myapp.com/hitoko/webhook - Status: 200
📊 Results: 2/2 succeeded, 0 failed
```

### Benefits

- Test endpoint receives all messages for debugging
- Production endpoint processes real data
- Both stay in sync automatically
- Easy to disable test endpoint later
