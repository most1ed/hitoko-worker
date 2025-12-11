#!/usr/bin/env node

/**
 * Example: Auto-reply bot that responds to customer messages
 *
 * This demonstrates how to:
 * 1. Listen to incoming messages from MQTT
 * 2. Parse message content
 * 3. Automatically send a reply
 */

const HitokoAPI = require('../src/hitoko-api');
const HitokoMQTTClient = require('../src/mqtt-client');
const { formatMessage, isFromBuyer } = require('../src/message-parser');
require('dotenv').config();

class AutoReplyBot {
  constructor() {
    this.api = new HitokoAPI();
    this.mqttClient = null;
    this.shopInfo = null;
  }

  async initialize() {
    console.log('🤖 Auto-Reply Bot Starting...\n');

    // Fetch shop information
    const shopsData = await this.api.getShops();
    if (shopsData.code === 0 && shopsData.data && shopsData.data.length > 0) {
      this.shopInfo = shopsData.data[0];
      console.log(`✓ Connected to shop: ${this.shopInfo.marketplaceShopName}`);
    }

    // Start MQTT client
    this.mqttClient = new HitokoMQTTClient({
      companyId: this.shopInfo.companyId.toString(),
      onMessage: this.handleMessage.bind(this)
    });

    this.mqttClient.connect();
    console.log('\n✅ Auto-Reply Bot is running!\n');
    console.log('Press Ctrl+C to stop\n');
  }

  async handleMessage(messageData) {
    const formatted = formatMessage(messageData);

    // Only respond to messages from buyers (customers)
    if (!formatted.fromBuyer) {
      console.log('⏭️  Skipping - message from seller');
      return;
    }

    // Only respond to text messages
    if (formatted.content.type !== 'text') {
      console.log('⏭️  Skipping - not a text message');
      return;
    }

    console.log('─'.repeat(60));
    console.log('📨 New customer message received');
    console.log(`From: ${formatted.replyInfo.buyerNickName}`);
    console.log(`Message: "${formatted.content.text}"`);

    // Generate auto-reply based on message content
    const replyText = this.generateReply(formatted.content.text);

    console.log(`\n🤖 Auto-replying with: "${replyText}"`);

    // Send reply
    const result = await this.api.replyMessage({
      sessionId: formatted.replyInfo.sessionId,
      shopId: formatted.replyInfo.shopId,
      buyerId: formatted.replyInfo.buyerId,
      text: replyText,
      marketplaceCode: formatted.replyInfo.marketplaceCode
    });

    if (result.success) {
      console.log('✅ Reply sent successfully!');
    } else {
      console.log('❌ Failed to send reply:', result.error);
    }
    console.log('─'.repeat(60) + '\n');
  }

  generateReply(customerMessage) {
    const message = customerMessage.toLowerCase();

    // Simple keyword-based auto-reply
    if (message.includes('harga') || message.includes('price')) {
      return 'Halo! Untuk informasi harga, silakan cek deskripsi produk atau hubungi customer service kami. Terima kasih!';
    }

    if (message.includes('stock') || message.includes('stok') || message.includes('ready')) {
      return 'Halo! Produk yang ditampilkan ready stock. Silakan langsung order ya. Terima kasih!';
    }

    if (message.includes('kirim') || message.includes('ongkir') || message.includes('shipping')) {
      return 'Halo! Ongkir akan otomatis terhitung saat checkout sesuai dengan alamat tujuan. Terima kasih!';
    }

    if (message.includes('buka') || message.includes('jam') || message.includes('open')) {
      return 'Halo! Kami melayani chat setiap hari pukul 09.00-17.00 WIB. Terima kasih!';
    }

    // Default reply
    return 'Halo! Terima kasih atas pesan Anda. Tim kami akan segera merespons. Mohon tunggu sebentar ya. Terima kasih! 😊';
  }

  shutdown() {
    console.log('\n🛑 Shutting down Auto-Reply Bot...');
    if (this.mqttClient) {
      this.mqttClient.disconnect();
    }
    console.log('✓ Goodbye!\n');
    process.exit(0);
  }
}

// Main execution
const bot = new AutoReplyBot();

// Handle graceful shutdown
process.on('SIGINT', () => bot.shutdown());
process.on('SIGTERM', () => bot.shutdown());

// Start the bot
bot.initialize().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
