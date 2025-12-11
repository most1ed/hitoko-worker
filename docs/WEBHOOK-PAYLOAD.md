# Webhook Payload Format

## Clean Payload Structure

The webhook now receives a clean, fully-parsed payload with no duplicate or stringified JSON:

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
    "templateId": "00",

    "content": {
      "type": "text",
      "text": "test",
      "image": null
    },

    "from": {
      "accountId": "6648342",
      "accountType": "1",
      "isCustomer": true
    },
    "to": {
      "accountId": "1641468822",
      "accountType": "2"
    }
  },

  "customer": {
    "id": "6648342",
    "nickname": "yehezkielpanjipamungkas",
    "avatar": "https://cf.shopee.co.id/file/2a9a85ce59424f3c7ddc0ee4342ad53c"
  },

  "session": {
    "id": "28554413104092054",
    "status": "1",
    "unreadCount": 1,
    "lastMessageId": "2385373076854800753",
    "lastMessageTime": "2025-12-11 08:49:36",
    "summary": "Halo kak! Selamat datang di Aoraki Perfume ✨\nTerima kasih..."
  },

  "replyWith": {
    "sessionId": "28554413104092054",
    "shopId": "1640619651",
    "buyerId": "6648342",
    "marketplaceCode": "00",
    "exampleCurl": "curl -X POST http://localhost:3001/api/reply/text -H \"Content-Type: application/json\" -d '{\"sessionId\":\"28554413104092054\",\"shopId\":\"1640619651\",\"buyerId\":\"6648342\",\"text\":\"Your reply here\"}'"
  }
}
```

## Field Descriptions

### event
- `type` - Always "chat_message" for chat messages
- `timestamp` - ISO 8601 timestamp when message was received
- `topic` - MQTT topic (marketplace code + shop ID)

### shop
- `id` - Shop ID on the marketplace
- `name` - Shop display name
- `marketplaceCode` - Marketplace identifier ("00" = Shopee, "01" = Tokopedia, "02" = Lazada)

### message
Information about the message itself:

- `id` - Unique message ID
- `sessionId` - Conversation session ID
- `sentTime` - When the message was sent (marketplace time)
- `templateId` - Message type ("00" = text, "01" = image)

#### message.content
Fully parsed message content:
- `type` - "text", "image", or "unknown"
- `text` - Text content (for text messages)
- `image` - Image object with `url`, `width`, `height` (for image messages)

#### message.from / message.to
- `accountId` - Account identifier
- `accountType` - "1" for customer/buyer, "2" for seller/shop
- `isCustomer` - Boolean flag (only in `from`)

### customer
Information about the buyer/customer:
- `id` - Customer ID on the marketplace
- `nickname` - Customer's display name
- `avatar` - Customer's profile picture URL

### session
Chat session information:
- `id` - Session ID
- `status` - Session status
- `unreadCount` - Number of unread messages
- `lastMessageId` - ID of last message in session
- `lastMessageTime` - Timestamp of last message
- `summary` - Last message preview/summary

### replyWith
Everything needed to send a reply:
- `sessionId` - Session ID to reply to
- `shopId` - Shop ID
- `buyerId` - Customer ID
- `marketplaceCode` - Marketplace code
- `exampleCurl` - Ready-to-use curl command for replying (only for customer messages)

## Message Types

### Text Message
```json
{
  "message": {
    "content": {
      "type": "text",
      "text": "Hello, do you have stock?",
      "image": null
    }
  }
}
```

### Image Message
```json
{
  "message": {
    "content": {
      "type": "image",
      "text": null,
      "image": {
        "url": "https://cf.shopee.co.id/file/...",
        "width": 300,
        "height": 300
      }
    }
  }
}
```

## Using the Payload

### Check if message is from customer:
```javascript
if (payload.message.from.isCustomer) {
  console.log('Customer message:', payload.message.content.text);
}
```

### Auto-reply to customer:
```javascript
if (payload.message.from.isCustomer && payload.message.content.type === 'text') {
  const reply = generateReply(payload.message.content.text);

  // Send reply using the API
  await fetch('http://localhost:3001/api/reply/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: payload.replyWith.sessionId,
      shopId: payload.replyWith.shopId,
      buyerId: payload.replyWith.buyerId,
      text: reply
    })
  });
}
```

### Log customer info:
```javascript
console.log(`New message from ${payload.customer.nickname}`);
console.log(`Shop: ${payload.shop.name}`);
console.log(`Message: ${payload.message.content.text}`);
```

## Comparison: Before vs After

### Before (messy):
- Multiple levels of stringified JSON
- Duplicate data in `payload`, `parsed`, and `formatted`
- Hard to access nested fields
- 3+ levels of parsing required

### After (clean):
- All JSON fully parsed
- Single, flat structure
- Easy to access any field
- Ready to use immediately
- Includes helper fields like `isCustomer` and `exampleCurl`

The clean payload is about 70% smaller and much easier to work with!
