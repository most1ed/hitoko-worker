#!/usr/bin/env node

/**
 * Example webhook handler that receives clean Hitoko messages
 *
 * This shows how to process incoming webhook messages from the Hitoko worker
 */

const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const payload = req.body;

  console.log('\n' + '='.repeat(60));
  console.log('📨 New Message Received via Webhook');
  console.log('='.repeat(60));

  // Check if message is from customer
  if (payload.message?.from?.isCustomer) {
    console.log('✅ Message from CUSTOMER');
    console.log(`   Customer: ${payload.customer.nickname} (${payload.customer.id})`);
    console.log(`   Shop: ${payload.shop.name}`);
    console.log(`   Message: "${payload.message.content.text}"`);
    console.log(`   Time: ${payload.message.sentTime}`);

    // Example: Auto-reply logic
    const messageText = payload.message.content.text?.toLowerCase() || '';

    if (messageText.includes('harga') || messageText.includes('price')) {
      console.log('\n💡 Keyword detected: PRICE');
      console.log('   Suggested reply: "Silakan cek deskripsi produk untuk info harga."');
    } else if (messageText.includes('stock') || messageText.includes('ready')) {
      console.log('\n💡 Keyword detected: STOCK');
      console.log('   Suggested reply: "Produk ready stock, silakan order langsung."');
    } else {
      console.log('\n💡 Generic message');
      console.log('   Suggested reply: "Terima kasih! Kami akan segera merespons."');
    }

    // Show how to reply
    console.log('\n📤 To send auto-reply:');
    console.log(`   Session ID: ${payload.replyWith.sessionId}`);
    console.log(`   Shop ID: ${payload.replyWith.shopId}`);
    console.log(`   Buyer ID: ${payload.replyWith.buyerId}`);
    console.log(`\n   ${payload.replyWith.exampleCurl}`);

  } else {
    console.log('⏭️  Message from SELLER (ignoring)');
  }

  console.log('='.repeat(60) + '\n');

  // Respond to webhook
  res.json({
    success: true,
    received: true,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🎣 Webhook Handler Started');
  console.log('='.repeat(60));
  console.log(`📡 Listening on http://localhost:${PORT}/webhook`);
  console.log('\nWaiting for messages from Hitoko worker...\n');
  console.log('Make sure to:');
  console.log('1. Set WEBHOOK_URL=http://localhost:3000/webhook in .env');
  console.log('2. Run the worker: npm run worker');
  console.log('='.repeat(60) + '\n');
});
