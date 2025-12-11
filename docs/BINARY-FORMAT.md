# Hitoko MQTT Binary Message Format

## Message Structure

MQTT messages from Hitoko come in binary format with the following structure:

```
[SHOP_ID][JSON_PAYLOAD]
```

### Example:

```
001640619651{"extras":{"appType":"15","message":"..."}}
```

- **Shop ID**: `001640619651` (12 digits, zero-padded)
- **JSON Payload**: The actual message data

## JSON Payload Structure

The JSON payload contains:

```json
{
  "extras": {
    "appType": "15",
    "message": "{...}" // Nested JSON string
  }
}
```

### Nested Message Structure

The `extras.message` field contains another JSON string with:

```json
{
  "compChatMessageVO": {
    "content": "{\"text\":\"message text here\"}",
    "fromAccountId": "279359816",
    "fromAccountType": "1",
    "messageId": "2385371651588391281",
    "sendTime": "2025-12-11 08:38:16",
    "sessionId": "1199841275178046358",
    "templateId": "00",
    "toAccountId": "1641468822",
    "toAccountType": "2"
  },
  "compChatSessionVO": {
    "buyerHeadUrl": "https://...",
    "buyerId": "279359816",
    "buyerNickName": "systemfive.id",
    "companyId": 34417,
    "id": 14581498,
    "lastMessageId": "2385371651588391281",
    "lastMessageTime": "2025-12-11 08:38:16",
    "marketplaceCode": "00",
    "marketplaceShopName": "Aoraki Perfume",
    "sessionId": "1199841275178046358",
    "sessionStatus": "1",
    "shopId": 1640619651,
    "summary": "message text here",
    "unreadCount": 1
  },
  "marketplaceCode": "00",
  "marketplaceUnreadCount": 1,
  "shopUnreadCount": 1
}
```

## Account Types

- `fromAccountType: "1"` - Message from buyer (customer)
- `fromAccountType: "2"` - Message from seller (shop)
- `toAccountType: "1"` - Message to buyer
- `toAccountType: "2"` - Message to seller

## Template IDs

- `templateId: "00"` - Text message
- `templateId: "01"` - Image message

## Message Content Format

### Text Message:
```json
{
  "content": "{\"text\":\"Hello world\"}"
}
```

### Image Message:
```json
{
  "content": "{\"imgUrl\":\"https://...\",\"width\":300,\"height\":300}"
}
```

## Parsing Binary Messages

The worker automatically:

1. Converts binary buffer to UTF-8 string
2. Extracts shop ID prefix (digits before JSON)
3. Parses JSON payload
4. Extracts nested message data
5. Formats for easy consumption

See `message-parser.js` for helper functions to work with these messages.

## Using the Message Parser

```javascript
const { formatMessage, extractReplyInfo, isFromBuyer } = require('./message-parser');

// Format message for easier reading
const formatted = formatMessage(messageData);

console.log(formatted.content.text); // "Hello world"
console.log(formatted.fromBuyer); // true/false
console.log(formatted.replyInfo.sessionId); // "1199841275178046358"

// Extract reply information
const replyInfo = extractReplyInfo(messageData);

// Check if message is from buyer
if (isFromBuyer(messageData)) {
  console.log('Message from customer');
}
```
