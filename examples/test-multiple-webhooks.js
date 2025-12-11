#!/usr/bin/env node

/**
 * Test script to verify multiple webhook functionality
 *
 * This creates a WebhookForwarder with multiple URLs and simulates sending a message
 */

const WebhookForwarder = require('../src/webhook-forwarder');

console.log('='.repeat(60));
console.log('Testing Multiple Webhooks Functionality');
console.log('='.repeat(60));

// Test 1: Single webhook
console.log('\n📝 Test 1: Single webhook URL');
const singleForwarder = new WebhookForwarder('http://webhook1.com/hook');
console.log(`   URLs parsed: ${singleForwarder.webhookUrls.length}`);
console.log(`   URLs: ${JSON.stringify(singleForwarder.webhookUrls)}`);

// Test 2: Multiple webhooks
console.log('\n📝 Test 2: Multiple webhook URLs (comma-separated)');
const multiForwarder = new WebhookForwarder(
  'https://flow.devotetolove.com/webhook-test/f45a3ade-f381-45ad-9e8d-ebe514bc64d9,https://flow.devotetolove.com/webhook/f45a3ade-f381-45ad-9e8d-ebe514bc64d9'
);
console.log(`   URLs parsed: ${multiForwarder.webhookUrls.length}`);
multiForwarder.webhookUrls.forEach((url, i) => {
  console.log(`   [${i + 1}] ${url}`);
});

// Test 3: Multiple webhooks with spaces
console.log('\n📝 Test 3: Multiple webhook URLs with spaces');
const spacedForwarder = new WebhookForwarder(
  'http://webhook1.com/hook, http://webhook2.com/hook , http://webhook3.com/hook'
);
console.log(`   URLs parsed: ${spacedForwarder.webhookUrls.length}`);
spacedForwarder.webhookUrls.forEach((url, i) => {
  console.log(`   [${i + 1}] ${url}`);
});

// Test 4: Empty/null webhook
console.log('\n📝 Test 4: No webhook URL (should warn)');
const emptyForwarder = new WebhookForwarder('');
console.log(`   URLs parsed: ${emptyForwarder.webhookUrls.length}`);

// Test 5: From environment variable
console.log('\n📝 Test 5: From environment variable');
process.env.WEBHOOK_URL = 'http://env-webhook1.com,http://env-webhook2.com';
const envForwarder = new WebhookForwarder();
console.log(`   URLs parsed: ${envForwarder.webhookUrls.length}`);
envForwarder.webhookUrls.forEach((url, i) => {
  console.log(`   [${i + 1}] ${url}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ All tests completed!');
console.log('='.repeat(60));
console.log('\nNote: This only tests URL parsing. To test actual forwarding,');
console.log('run the worker with multiple webhook URLs in your .env file:');
console.log('  WEBHOOK_URL=http://webhook1.com,http://webhook2.com');
console.log('='.repeat(60));
