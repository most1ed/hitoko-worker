const axios = require('axios');
require('dotenv').config();

class HitokoAPI {
  constructor() {
    this.baseURL = process.env.HITOKO_API_BASE;
    this.authToken = process.env.HITOKO_AUTH_TOKEN;
    this.headers = {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'id,en-US;q=0.9,en;q=0.8,be;q=0.7',
      'authorization': `Bearer ${this.authToken}`,
      'c': '02',
      'locale': 'en_US',
      'time-zone': '+0700',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest'
    };
  }

  async getShops() {
    try {
      const response = await axios.get(
        `${this.baseURL}/chat/api/comp/comp-chat-shop`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching shops:', error.message);
      throw error;
    }
  }

  async getSessionList(shopId, page = 1, size = 30) {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/api/comp/chat-process/get-session-list`,
        {
          page,
          size,
          marketplaceCode: process.env.MARKETPLACE_CODE || '00',
          sessionStatus: 3,
          buyerNickName: '',
          shopId: shopId.toString()
        },
        {
          headers: {
            ...this.headers,
            'content-type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching session list:', error.message);
      throw error;
    }
  }

  async replyMessage(messageData) {
    try {
      const {
        sessionId,
        shopId,
        buyerId,
        text,
        imgUrl,
        width,
        height,
        marketplaceCode = '00',
        messageId = '',
        messageStatus = 0
      } = messageData;

      // Determine template ID and content based on message type
      let templateId;
      let content;

      if (text) {
        // Text message
        templateId = '00';
        content = JSON.stringify({ text });
      } else if (imgUrl) {
        // Image message
        templateId = '01';
        content = JSON.stringify({ imgUrl, width, height });
      } else {
        throw new Error('Message must contain either text or imgUrl');
      }

      const payload = {
        marketplaceCode,
        sessionId,
        shopId: parseInt(shopId),
        fromAccountType: '2',
        content,
        templateId,
        buyerId,
        messageId,
        messageStatus
      };

      console.log('Sending message:', payload);

      const response = await axios.post(
        `${this.baseURL}/chat/api/comp/chat-process/reply-message`,
        payload,
        {
          headers: {
            ...this.headers,
            'content-type': 'application/json'
          }
        }
      );

      const success = response.status === 200;

      return {
        success,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.error('Error sending message:', error.message);
      return {
        success: false,
        status: error.response?.status || 500,
        error: error.message,
        data: error.response?.data
      };
    }
  }
}

module.exports = HitokoAPI;
