#!/usr/bin/env node

/**
 * Hitoko Pusher - Main Worker
 *
 * This worker listens to MQTT messages and forwards them to your webhook.
 * It does NOT automatically reply to messages.
 */

const HitokoAPI = require('./src/hitoko-api');
const HitokoMQTTClient = require('./src/mqtt-client');
const WebhookForwarder = require('./src/webhook-forwarder');
const { formatMessage, extractReplyInfo, isFromBuyer, createCleanWebhookPayload } = require('./src/message-parser');
require('dotenv').config();

class HitokoPusher {
  constructor() {
    this.api = new HitokoAPI();
    this.webhookForwarder = new WebhookForwarder();
    this.mqttClient = null;
    this.shopInfo = null;
  }

  async initialize() {
    console.log('='.repeat(60));
    console.log('🚀 Hitoko Pusher Worker Starting...');
    console.log('='.repeat(60));

    try {
      // Fetch shop information
      console.log('\n📋 Fetching shop information...');
      const shopsData = await this.api.getShops();

      if (shopsData.code === 0 && shopsData.data && shopsData.data.length > 0) {
        this.shopInfo = shopsData.data[0];
        console.log('✓ Shop Info:');
        console.log(`  - Shop Name: ${this.shopInfo.marketplaceShopName}`);
        console.log(`  - Shop ID: ${this.shopInfo.marketplaceShopId}`);
        console.log(`  - Marketplace: ${this.shopInfo.marketplaceCode}`);
        console.log(`  - Company ID: ${this.shopInfo.companyId}`);
      } else {
        throw new Error('No shop data available');
      }

      // Fetch initial session list
      console.log('\n📋 Fetching chat sessions...');
      const sessions = await this.api.getSessionList(this.shopInfo.marketplaceShopId);

      if (sessions.code === 0) {
        console.log(`✓ Found ${sessions.total} chat session(s)`);
        sessions.data.slice(0, 3).forEach(session => {
          console.log(`  - ${session.buyerNickName}: ${session.summary.substring(0, 50)}...`);
        });
      }

      // Start MQTT client with message handler
      console.log('\n🔌 Starting MQTT client...');
      this.mqttClient = new HitokoMQTTClient({
        companyId: this.shopInfo.companyId.toString(),
        onMessage: this.handleMessage.bind(this)
      });

      this.mqttClient.connect();

      console.log('\n✅ Hitoko Pusher Worker is running');
      console.log(`📤 Forwarding messages to: ${process.env.WEBHOOK_URL}`);
      console.log('\nPress Ctrl+C to stop\n');
      console.log('='.repeat(60));

    } catch (error) {
      console.error('\n❌ Initialization Error:', error.message);
      process.exit(1);
    }
  }

  async handleMessage(messageData) {
    console.log('\n' + '─'.repeat(60));
    console.log('📥 New Message Received');
    console.log('─'.repeat(60));

    // Format message for easier reading
    const formatted = formatMessage(messageData);

    console.log(`Topic: ${formatted.topic}`);
    console.log(`Time: ${formatted.timestamp}`);
    console.log(`Shop ID: ${formatted.shopId}`);
    console.log(`From Buyer: ${formatted.fromBuyer ? 'Yes ✓' : 'No (from seller)'}`);

    // Show message content
    if (formatted.content.type === 'text') {
      console.log(`\n💬 Message: "${formatted.content.text}"`);
    } else if (formatted.content.type === 'image') {
      console.log(`\n🖼️  Image: ${formatted.content.image.imgUrl}`);
      console.log(`   Size: ${formatted.content.image.width}x${formatted.content.image.height}`);
    }

    // Show reply info if available
    if (formatted.replyInfo) {
      console.log('\n📝 Reply Info:');
      console.log(`   Session ID: ${formatted.replyInfo.sessionId}`);
      console.log(`   Buyer ID: ${formatted.replyInfo.buyerId}`);
      console.log(`   Buyer Name: ${formatted.replyInfo.buyerNickName || 'N/A'}`);
      console.log(`   Unread Count: ${formatted.replyInfo.sessionInfo.unreadCount || 0}`);

      // Show example reply command
      if (formatted.fromBuyer) {
        console.log('\n💡 To reply, use:');
        console.log(`   curl -X POST http://localhost:3001/api/reply/text \\`);
        console.log(`     -H "Content-Type: application/json" \\`);
        console.log(`     -d '{"sessionId":"${formatted.replyInfo.sessionId}","shopId":"${formatted.replyInfo.shopId}","buyerId":"${formatted.replyInfo.buyerId}","text":"Your reply here"}'`);
      }
    }

    // Create clean webhook payload
    const cleanPayload = createCleanWebhookPayload(messageData);

    // Forward to webhook
    console.log('\n🔄 Forwarding to webhook...');
    const result = await this.webhookForwarder.forward(cleanPayload || {
      error: 'Failed to parse message',
      raw: messageData
    });

    if (result.success) {
      console.log('✅ Message successfully forwarded to webhook');
    } else {
      console.error('❌ Failed to forward message to webhook');
    }
    console.log('─'.repeat(60));
  }

  shutdown() {
    console.log('\n\n🛑 Shutting down Hitoko Pusher Worker...');

    if (this.mqttClient) {
      this.mqttClient.disconnect();
    }

    console.log('✓ Goodbye!\n');
    process.exit(0);
  }
}

// Main execution
const pusher = new HitokoPusher();

// Handle graceful shutdown
process.on('SIGINT', () => pusher.shutdown());
process.on('SIGTERM', () => pusher.shutdown());

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  pusher.shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the worker
pusher.initialize();
