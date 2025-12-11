const axios = require('axios');
require('dotenv').config();

class WebhookForwarder {
  constructor(webhookUrl) {
    const urlString = webhookUrl || process.env.WEBHOOK_URL;

    // Support multiple webhook URLs separated by comma
    this.webhookUrls = urlString
      ? urlString.split(',').map(url => url.trim()).filter(url => url)
      : [];

    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second

    if (this.webhookUrls.length === 0) {
      console.warn('⚠️  No webhook URLs configured');
    } else if (this.webhookUrls.length > 1) {
      console.log(`📡 Configured ${this.webhookUrls.length} webhook endpoints`);
    }
  }

  async forwardToSingleWebhook(url, messageData, retryCount = 0) {
    try {
      const response = await axios.post(url, messageData, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Hitoko-Pusher/1.0'
        },
        timeout: 10000
      });

      return {
        success: true,
        url: url,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      // Retry logic
      if (retryCount < this.retryAttempts - 1) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.forwardToSingleWebhook(url, messageData, retryCount + 1);
      }

      return {
        success: false,
        url: url,
        error: error.message,
        status: error.response?.status
      };
    }
  }

  async forward(messageData) {
    if (this.webhookUrls.length === 0) {
      console.warn('⚠️  No webhook URLs configured, skipping forward');
      return {
        success: false,
        error: 'No webhook URLs configured'
      };
    }

    console.log(`\n🔄 Forwarding message to ${this.webhookUrls.length} webhook(s)...`);

    // Forward to all webhooks in parallel
    const results = await Promise.all(
      this.webhookUrls.map(url => this.forwardToSingleWebhook(url, messageData))
    );

    // Log results
    results.forEach(result => {
      if (result.success) {
        console.log(`✅ ${result.url} - Status: ${result.status}`);
      } else {
        console.error(`❌ ${result.url} - Error: ${result.error}`);
      }
    });

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    console.log(`\n📊 Results: ${successful}/${results.length} succeeded, ${failed} failed`);

    return {
      success: successful > 0, // Success if at least one webhook succeeded
      total: results.length,
      successful,
      failed,
      results
    };
  }

  async forwardBatch(messages) {
    console.log(`\n🔄 Forwarding batch of ${messages.length} messages`);

    const results = await Promise.allSettled(
      messages.map(msg => this.forward(msg))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`Batch forwarding complete: ${successful} succeeded, ${failed} failed`);

    return {
      total: messages.length,
      successful,
      failed,
      results
    };
  }
}

module.exports = WebhookForwarder;
