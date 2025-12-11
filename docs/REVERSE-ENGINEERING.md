# Reverse Engineering Notes from reverse.txt

## MQTT Connection Details

From analyzing the minified JavaScript bundle (reverse.txt), I discovered the following:

### Connection Parameters

```javascript
{
  url: "wss://www.hitoko.co.id/erp/ws-mqtt/mqtt",
  username: "user",
  password: "D9Qa85F9Xv4e0K2F41mfzvEP",
  clean: true,
  connectTimeout: 3000
}
```

**Important:** The MQTT password is hardcoded in the client-side JavaScript!

### Topic Subscription Format

The web application subscribes to topics using this format:

```
${marketplaceCode}${marketplaceShopId}
```

**Examples:**
- Marketplace Code: `00` (Shopee)
- Shop ID: `1640619651`
- **Topic:** `001640619651`

Other marketplace codes:
- `00` - Shopee
- `01` - Tokopedia
- `02` - Lazada

### MQTT Class Implementation

From reverse.txt:

```javascript
class MQTT {
    constructor() {
        this.url = "wss://www.hitoko.co.id/erp/ws-mqtt/mqtt"
    }

    init(clientId) {
        const options = {
            clean: true,
            clientId: clientId,
            username: "user",
            password: "D9Qa85F9Xv4e0K2F41mfzvEP",
            connectTimeout: 3000
        };

        this.client = mqtt.connect(this.url, options);

        this.client.on("error", error => {
            console.log(this.url + "异常中断")
        });

        this.client.on("reconnect", error => {
            console.log(this.url + "重新连接", Error)
        });
    }

    link(topic) {
        this.client.on("connect", () => {
            this.client.subscribe(topic, error => {
                if (!error) {
                    console.log(topic + "订阅成功")
                }
            });
        });
    }

    unsubscribes(topic) {
        this.client.unsubscribe(topic, error => {});
    }

    over() {
        this.client.end();
        console.log("主动断开链接")
    }
}
```

### Topic Generation Logic

```javascript
const topics = shops.map(shop => {
    if (["00", "01", "02"].includes(shop.marketplaceCode) && shop.marketplaceShopId) {
        return shop.marketplaceCode + shop.marketplaceShopId;
    }
}).filter(topic => topic);
```

### Message Format

Messages arrive in binary format with structure:
```
[SHOP_ID_PREFIX][JSON_PAYLOAD]
```

Example:
```
001640619651{"extras":{"appType":"15","message":"..."}}
```

## Implementation in Our Worker

Based on these findings, the MQTT client has been updated with:

1. ✅ Correct MQTT password
2. ✅ Proper topic subscription format (`${marketplaceCode}${shopId}`)
3. ✅ Binary message parsing
4. ✅ Shop ID extraction from message prefix
5. ✅ Nested JSON parsing from `extras.message`

## Security Note

⚠️ **The MQTT password is exposed in the client-side JavaScript bundle.** This means anyone can:
- Connect to the Hitoko MQTT WebSocket
- Subscribe to shop topics
- Receive real-time messages

This appears to be a security issue on Hitoko's side, but we can use it to build our integration.

## Testing

To verify the connection works:

```bash
npm run worker
```

You should see:
```
✓ Connected to Hitoko MQTT WebSocket
📡 Subscribing to shop topic: 001640619651
✓ Successfully subscribed to topic: 001640619651
   Marketplace Code: 00
   Shop ID: 1640619651
```

Then when messages arrive, you'll see them parsed and formatted correctly.
