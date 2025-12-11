const axios = require('axios');
require('dotenv').config();

class WebhookForwarder {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl || process.env.WEBHOOK_URL;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  async forward(messageData, retryCount = 0) {
    try {
      console.log(`\n🔄 Forwarding message to webhook: ${this.webhookUrl}`);

      const response = await axios.post(this.webhookUrl, messageData, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Hitoko-Pusher/1.0'
        },
        timeout: 10000
      });

      console.log('✓ Message forwarded successfully');
      console.log('Response status:', response.status);

      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.error(`✗ Error forwarding message (attempt ${retryCount + 1}/${this.retryAttempts}):`, error.message);

      // Retry logic
      if (retryCount < this.retryAttempts - 1) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.forward(messageData, retryCount + 1);
      }

      return {
        success: false,
        error: error.message,
        messageData
      };
    }
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
