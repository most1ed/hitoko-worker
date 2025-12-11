#!/usr/bin/env node

const express = require('express');
const HitokoAPI = require('./src/hitoko-api');
require('dotenv').config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Hitoko API
const hitokoAPI = new HitokoAPI();

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Reply to message endpoint
app.post('/api/reply', async (req, res) => {
  try {
    const messageData = req.body;

    // Validate required fields
    const requiredFields = ['sessionId', 'shopId', 'buyerId'];
    const missingFields = requiredFields.filter(field => !messageData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate that either text or imgUrl is provided
    if (!messageData.text && !messageData.imgUrl) {
      return res.status(400).json({
        success: false,
        error: 'Message must contain either text or imgUrl'
      });
    }

    console.log('\n📤 Sending reply message...');
    console.log('Message data:', JSON.stringify(messageData, null, 2));

    // Send message via Hitoko API
    const result = await hitokoAPI.replyMessage(messageData);

    if (result.success) {
      console.log('✅ Message sent successfully');
      return res.status(200).json({
        success: true,
        message: 'Message sent successfully',
        data: result.data
      });
    } else {
      console.error('❌ Failed to send message');
      return res.status(result.status).json({
        success: false,
        error: result.error,
        data: result.data
      });
    }
  } catch (error) {
    console.error('Error in /api/reply:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send text message helper endpoint
app.post('/api/reply/text', async (req, res) => {
  try {
    const { sessionId, shopId, buyerId, text, marketplaceCode } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const messageData = {
      sessionId,
      shopId,
      buyerId,
      text,
      marketplaceCode
    };

    const result = await hitokoAPI.replyMessage(messageData);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Text message sent successfully',
        data: result.data
      });
    } else {
      return res.status(result.status).json({
        success: false,
        error: result.error,
        data: result.data
      });
    }
  } catch (error) {
    console.error('Error in /api/reply/text:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send image message helper endpoint
app.post('/api/reply/image', async (req, res) => {
  try {
    const { sessionId, shopId, buyerId, imgUrl, width, height, marketplaceCode } = req.body;

    if (!imgUrl) {
      return res.status(400).json({
        success: false,
        error: 'imgUrl is required'
      });
    }

    const messageData = {
      sessionId,
      shopId,
      buyerId,
      imgUrl,
      width: width || 300,
      height: height || 300,
      marketplaceCode
    };

    const result = await hitokoAPI.replyMessage(messageData);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Image message sent successfully',
        data: result.data
      });
    } else {
      return res.status(result.status).json({
        success: false,
        error: result.error,
        data: result.data
      });
    }
  } catch (error) {
    console.error('Error in /api/reply/image:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get shops endpoint
app.get('/api/shops', async (req, res) => {
  try {
    const result = await hitokoAPI.getShops();
    return res.json(result);
  } catch (error) {
    console.error('Error fetching shops:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get sessions endpoint
app.get('/api/sessions/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { page = 1, size = 30 } = req.query;

    const result = await hitokoAPI.getSessionList(shopId, parseInt(page), parseInt(size));
    return res.json(result);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Hitoko Reply Server Started');
  console.log('='.repeat(60));
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log(`  GET  /health                    - Health check`);
  console.log(`  POST /api/reply                 - Send message (text or image)`);
  console.log(`  POST /api/reply/text            - Send text message`);
  console.log(`  POST /api/reply/image           - Send image message`);
  console.log(`  GET  /api/shops                 - Get shop list`);
  console.log(`  GET  /api/sessions/:shopId      - Get chat sessions`);
  console.log('\n' + '='.repeat(60));
});

module.exports = app;
