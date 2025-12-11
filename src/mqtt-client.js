const mqtt = require('mqtt');
require('dotenv').config();

class HitokoMQTTClient {
  constructor(options = {}) {
    this.wsUrl = process.env.HITOKO_WS_URL || 'wss://www.hitoko.co.id/erp/ws-mqtt/mqtt';
    this.shopId = process.env.SHOP_ID;
    this.companyId = options.companyId || '34417';
    this.client = null;
    this.onMessageCallback = options.onMessage || null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  connect() {
    console.log('Connecting to Hitoko MQTT WebSocket...');

    // MQTT connection options (extracted from reverse.txt)
    const options = {
      protocol: 'wss',
      protocolVersion: 4,
      clientId: `user_${this.companyId}_${Date.now()}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 3000,
      keepalive: 60,
      username: 'user',
      password: 'D9Qa85F9Xv4e0K2F41mfzvEP', // Found in reverse.txt
      rejectUnauthorized: false,
      // WebSocket specific options
      wsOptions: {
        headers: {
          'Origin': 'https://www.hitoko.co.id',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-WebSocket-Protocol': 'mqtt',
          'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
        },
        perMessageDeflate: true
      }
    };

    this.client = mqtt.connect(this.wsUrl, options);

    this.client.on('connect', () => {
      console.log('✓ Connected to Hitoko MQTT WebSocket');
      this.reconnectAttempts = 0;

      // Subscribe to shop topic (format from reverse.txt: marketplaceCode + shopId)
      // For marketplace code "00" and shop ID "1640619651" -> topic is "001640619651"
      const marketplaceCode = process.env.MARKETPLACE_CODE || '00';
      const shopTopic = `${marketplaceCode}${this.shopId}`;

      console.log(`📡 Subscribing to shop topic: ${shopTopic}`);

      this.client.subscribe(shopTopic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`❌ Error subscribing to ${shopTopic}:`, err);
        } else {
          console.log(`✓ Successfully subscribed to topic: ${shopTopic}`);
          console.log(`   Marketplace Code: ${marketplaceCode}`);
          console.log(`   Shop ID: ${this.shopId}`);
        }
      });
    });

    this.client.on('message', (topic, message) => {
      try {
        // Handle binary message
        let payload;
        if (Buffer.isBuffer(message)) {
          payload = message.toString('utf8');
        } else {
          payload = message;
        }

        console.log(`\n📨 Message received on topic: ${topic}`);
        console.log('Raw Payload (length: ' + payload.length + '):', payload.substring(0, 200) + '...');

        // Extract shop ID prefix if present (format: 001640619651{json...})
        let shopIdFromMessage = null;
        let jsonPayload = payload;

        // Check if payload starts with digits followed by JSON
        const match = payload.match(/^(\d+)(\{.*\})/s);
        if (match) {
          shopIdFromMessage = match[1];
          jsonPayload = match[2];
          console.log(`📍 Shop ID from message: ${shopIdFromMessage}`);
          console.log(`📦 JSON Payload: ${jsonPayload.substring(0, 100)}...`);
        }

        let parsedMessage;
        try {
          parsedMessage = JSON.parse(jsonPayload);
          console.log('Parsed Message:', JSON.stringify(parsedMessage, null, 2));

          // Extract chat message details if available
          if (parsedMessage.extras && parsedMessage.extras.message) {
            try {
              const messageContent = JSON.parse(parsedMessage.extras.message);
              console.log('\n📝 Chat Message Details:');

              if (messageContent.compChatMessageVO) {
                const chatMsg = messageContent.compChatMessageVO;
                console.log(`  From: ${chatMsg.fromAccountId} (Type: ${chatMsg.fromAccountType})`);
                console.log(`  To: ${chatMsg.toAccountId} (Type: ${chatMsg.toAccountType})`);
                console.log(`  Message ID: ${chatMsg.messageId}`);
                console.log(`  Session ID: ${chatMsg.sessionId}`);
                console.log(`  Time: ${chatMsg.sendTime}`);

                // Parse message content
                try {
                  const content = JSON.parse(chatMsg.content);
                  if (content.text) {
                    console.log(`  Text: ${content.text}`);
                  }
                  if (content.imgUrl) {
                    console.log(`  Image: ${content.imgUrl}`);
                  }
                } catch {
                  console.log(`  Content: ${chatMsg.content}`);
                }
              }

              if (messageContent.compChatSessionVO) {
                const session = messageContent.compChatSessionVO;
                console.log(`\n👤 Session Info:`);
                console.log(`  Buyer: ${session.buyerNickName} (ID: ${session.buyerId})`);
                console.log(`  Shop: ${session.marketplaceShopName} (ID: ${session.shopId})`);
                console.log(`  Unread: ${session.unreadCount}`);
                console.log(`  Summary: ${session.summary}`);
              }

              // Add parsed message content to the payload
              parsedMessage.parsed = messageContent;
            } catch (e) {
              console.error('Error parsing nested message:', e.message);
            }
          }
        } catch (e) {
          // Not JSON, keep as string
          parsedMessage = payload;
          console.log('Non-JSON payload');
        }

        const messageData = {
          topic,
          payload: parsedMessage,
          timestamp: new Date().toISOString(),
          shopId: shopIdFromMessage || this.shopId,
          shopIdFromConfig: this.shopId,
          shopIdFromMessage: shopIdFromMessage
        };

        if (this.onMessageCallback) {
          this.onMessageCallback(messageData);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    this.client.on('error', (error) => {
      console.error('MQTT Error:', error.message);
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached. Closing connection.');
        this.client.end();
      }
    });

    this.client.on('close', () => {
      console.log('MQTT connection closed');
    });

    this.client.on('offline', () => {
      console.log('MQTT client is offline');
    });
  }

  disconnect() {
    if (this.client) {
      console.log('Disconnecting from MQTT...');
      this.client.end();
    }
  }

  publish(topic, message) {
    if (this.client && this.client.connected) {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error('Error publishing message:', err);
        } else {
          console.log(`✓ Message published to ${topic}`);
        }
      });
    } else {
      console.error('MQTT client is not connected');
    }
  }
}

module.exports = HitokoMQTTClient;
