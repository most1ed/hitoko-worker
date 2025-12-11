# API Usage Examples

## Starting the Server

Start the reply server:

```bash
npm run server
```

The server will run on `http://localhost:3001` (or the port specified in `.env`)

## Endpoints

### 1. Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-11T08:33:00.000Z"
}
```

### 2. Send Text Message

**Endpoint:** `POST /api/reply/text`

```bash
curl -X POST http://localhost:3001/api/reply/text \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "28554413104092054",
    "shopId": "1640619651",
    "buyerId": "6648342",
    "text": "Hello! This is a test message"
  }'
```

Response (success):
```json
{
  "success": true,
  "message": "Text message sent successfully",
  "data": {
    "code": 0,
    "desc": null
  }
}
```

### 3. Send Image Message

**Endpoint:** `POST /api/reply/image`

```bash
curl -X POST http://localhost:3001/api/reply/image \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "28554413104092054",
    "shopId": "1640619651",
    "buyerId": "6648342",
    "imgUrl": "https://www.hitoko.co.id/image/group1/M00/9C/C3/rBAAPGk6gZyAO539AAEWul0hTBM28.jpeg",
    "width": 300,
    "height": 300
  }'
```

Response (success):
```json
{
  "success": true,
  "message": "Image message sent successfully",
  "data": {
    "code": 0,
    "desc": null
  }
}
```

### 4. Send Generic Message

**Endpoint:** `POST /api/reply`

For text message:
```bash
curl -X POST http://localhost:3001/api/reply \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "28554413104092054",
    "shopId": "1640619651",
    "buyerId": "6648342",
    "text": "Your message here",
    "marketplaceCode": "00"
  }'
```

For image message:
```bash
curl -X POST http://localhost:3001/api/reply \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "28554413104092054",
    "shopId": "1640619651",
    "buyerId": "6648342",
    "imgUrl": "https://example.com/image.jpg",
    "width": 300,
    "height": 300,
    "marketplaceCode": "00"
  }'
```

### 5. Get Shop Information

**Endpoint:** `GET /api/shops`

```bash
curl http://localhost:3001/api/shops
```

Response:
```json
{
  "code": 0,
  "desc": null,
  "total": 1,
  "data": [
    {
      "id": 11060,
      "shopCode": "SH02942",
      "marketplaceShopName": "Aoraki Perfume",
      "shopId": 1640619651,
      "marketplaceCode": "00",
      ...
    }
  ]
}
```

### 6. Get Chat Sessions

**Endpoint:** `GET /api/sessions/:shopId`

```bash
curl http://localhost:3001/api/sessions/1640619651
```

With pagination:
```bash
curl "http://localhost:3001/api/sessions/1640619651?page=1&size=10"
```

Response:
```json
{
  "code": 0,
  "desc": null,
  "total": 5,
  "data": [
    {
      "id": 14580782,
      "shopId": 1640619651,
      "sessionId": "130003920047494038",
      "buyerNickName": "hsmulyani",
      "buyerId": "30268896",
      ...
    }
  ]
}
```

## Required Fields

### For Text Messages:
- `sessionId` - The chat session ID
- `shopId` - Your shop ID
- `buyerId` - The buyer's ID
- `text` - The text message to send

### For Image Messages:
- `sessionId` - The chat session ID
- `shopId` - Your shop ID
- `buyerId` - The buyer's ID
- `imgUrl` - URL of the image
- `width` - Image width (default: 300)
- `height` - Image height (default: 300)

## Error Responses

### Missing Required Fields

```json
{
  "success": false,
  "error": "Missing required fields: sessionId, buyerId"
}
```

### Invalid Message Type

```json
{
  "success": false,
  "error": "Message must contain either text or imgUrl"
}
```

### API Error

```json
{
  "success": false,
  "error": "Error message from Hitoko API",
  "data": { ... }
}
```

## Using with JavaScript/Node.js

```javascript
const axios = require('axios');

async function sendTextMessage(sessionId, shopId, buyerId, text) {
  try {
    const response = await axios.post('http://localhost:3001/api/reply/text', {
      sessionId,
      shopId,
      buyerId,
      text
    });

    if (response.data.success) {
      console.log('Message sent successfully!');
    }
  } catch (error) {
    console.error('Error sending message:', error.message);
  }
}

// Usage
sendTextMessage('28554413104092054', '1640619651', '6648342', 'Hello from Node.js!');
```

## Using with Python

```python
import requests

def send_text_message(session_id, shop_id, buyer_id, text):
    url = 'http://localhost:3001/api/reply/text'
    data = {
        'sessionId': session_id,
        'shopId': shop_id,
        'buyerId': buyer_id,
        'text': text
    }

    response = requests.post(url, json=data)

    if response.json().get('success'):
        print('Message sent successfully!')
    else:
        print('Error:', response.json().get('error'))

# Usage
send_text_message('28554413104092054', '1640619651', '6648342', 'Hello from Python!')
```

## Status Codes

- `200` - Success (message sent)
- `400` - Bad request (missing or invalid fields)
- `500` - Server error
