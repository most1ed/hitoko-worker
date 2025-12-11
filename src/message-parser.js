/**
 * Helper functions to parse Hitoko MQTT messages
 */

/**
 * Extract reply information from a Hitoko message
 * @param {Object} messageData - The message data from MQTT
 * @returns {Object|null} Reply info with sessionId, shopId, buyerId, or null if not a chat message
 */
function extractReplyInfo(messageData) {
  try {
    if (!messageData.payload || !messageData.payload.parsed) {
      return null;
    }

    const parsed = messageData.payload.parsed;
    const chatMsg = parsed.compChatMessageVO;
    const session = parsed.compChatSessionVO;

    if (!chatMsg && !session) {
      return null;
    }

    return {
      sessionId: chatMsg?.sessionId || session?.sessionId,
      shopId: messageData.shopIdFromMessage || session?.shopId?.toString(),
      buyerId: chatMsg?.fromAccountId || session?.buyerId?.toString(),
      buyerNickName: session?.buyerNickName,
      marketplaceCode: parsed.marketplaceCode || '00',

      // Original message details
      originalMessage: {
        messageId: chatMsg?.messageId,
        sendTime: chatMsg?.sendTime,
        content: chatMsg?.content,
        fromAccountType: chatMsg?.fromAccountType,
        templateId: chatMsg?.templateId
      },

      // Session details
      sessionInfo: {
        unreadCount: session?.unreadCount,
        lastMessageId: session?.lastMessageId,
        summary: session?.summary
      }
    };
  } catch (error) {
    console.error('Error extracting reply info:', error);
    return null;
  }
}

/**
 * Extract text content from a chat message
 * @param {Object} messageData - The message data from MQTT
 * @returns {string|null} The text content or null
 */
function extractTextContent(messageData) {
  try {
    if (!messageData.payload || !messageData.payload.parsed) {
      return null;
    }

    const chatMsg = messageData.payload.parsed.compChatMessageVO;
    if (!chatMsg || !chatMsg.content) {
      return null;
    }

    const content = JSON.parse(chatMsg.content);
    return content.text || null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract image content from a chat message
 * @param {Object} messageData - The message data from MQTT
 * @returns {Object|null} Image info {imgUrl, width, height} or null
 */
function extractImageContent(messageData) {
  try {
    if (!messageData.payload || !messageData.payload.parsed) {
      return null;
    }

    const chatMsg = messageData.payload.parsed.compChatMessageVO;
    if (!chatMsg || !chatMsg.content) {
      return null;
    }

    const content = JSON.parse(chatMsg.content);
    if (content.imgUrl) {
      return {
        imgUrl: content.imgUrl,
        width: content.width,
        height: content.height
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if message is from buyer (customer)
 * @param {Object} messageData - The message data from MQTT
 * @returns {boolean} True if from buyer
 */
function isFromBuyer(messageData) {
  try {
    if (!messageData.payload || !messageData.payload.parsed) {
      return false;
    }

    const chatMsg = messageData.payload.parsed.compChatMessageVO;
    // fromAccountType "1" means from buyer, "2" means from seller
    return chatMsg?.fromAccountType === '1';
  } catch (error) {
    return false;
  }
}

/**
 * Format message data for easier consumption
 * @param {Object} messageData - The message data from MQTT
 * @returns {Object} Formatted message data
 */
function formatMessage(messageData) {
  const replyInfo = extractReplyInfo(messageData);
  const textContent = extractTextContent(messageData);
  const imageContent = extractImageContent(messageData);
  const fromBuyer = isFromBuyer(messageData);

  return {
    topic: messageData.topic,
    timestamp: messageData.timestamp,
    shopId: messageData.shopId,
    fromBuyer,

    // Reply information
    replyInfo,

    // Message content
    content: {
      text: textContent,
      image: imageContent,
      type: textContent ? 'text' : imageContent ? 'image' : 'unknown'
    },

    // Original payload
    raw: messageData.payload
  };
}

/**
 * Create a clean webhook payload without duplicates and fully parsed
 * @param {Object} messageData - The message data from MQTT
 * @returns {Object} Clean webhook payload
 */
function createCleanWebhookPayload(messageData) {
  try {
    const parsed = messageData.payload?.parsed;
    if (!parsed) {
      return null;
    }

    const chatMsg = parsed.compChatMessageVO;
    const session = parsed.compChatSessionVO;

    // Parse message content (remove extra stringify)
    let messageContent = null;
    if (chatMsg && chatMsg.content) {
      try {
        messageContent = JSON.parse(chatMsg.content);
      } catch {
        messageContent = chatMsg.content;
      }
    }

    // Build clean payload
    return {
      // Event metadata
      event: {
        type: 'chat_message',
        timestamp: messageData.timestamp,
        topic: messageData.topic
      },

      // Shop information
      shop: {
        id: session?.shopId || messageData.shopId,
        name: session?.marketplaceShopName,
        marketplaceCode: session?.marketplaceCode || parsed.marketplaceCode
      },

      // Message information
      message: {
        id: chatMsg?.messageId,
        sessionId: chatMsg?.sessionId || session?.sessionId,
        sentTime: chatMsg?.sendTime,
        templateId: chatMsg?.templateId,

        // Fully parsed content
        content: {
          type: messageContent?.text ? 'text' : messageContent?.imgUrl ? 'image' : 'unknown',
          text: messageContent?.text || null,
          image: messageContent?.imgUrl ? {
            url: messageContent.imgUrl,
            width: messageContent.width,
            height: messageContent.height
          } : null
        },

        // Direction
        from: {
          accountId: chatMsg?.fromAccountId,
          accountType: chatMsg?.fromAccountType,
          isCustomer: chatMsg?.fromAccountType === '1'
        },
        to: {
          accountId: chatMsg?.toAccountId,
          accountType: chatMsg?.toAccountType
        }
      },

      // Customer/Buyer information
      customer: {
        id: session?.buyerId,
        nickname: session?.buyerNickName,
        avatar: session?.buyerHeadUrl
      },

      // Session information
      session: {
        id: session?.sessionId,
        status: session?.sessionStatus,
        unreadCount: session?.unreadCount,
        lastMessageId: session?.lastMessageId,
        lastMessageTime: session?.lastMessageTime,
        summary: session?.summary
      },

      // Reply helper (everything needed to send a reply)
      replyWith: {
        sessionId: chatMsg?.sessionId || session?.sessionId,
        shopId: (session?.shopId || messageData.shopId)?.toString(),
        buyerId: (chatMsg?.fromAccountId || session?.buyerId)?.toString(),
        marketplaceCode: session?.marketplaceCode || parsed.marketplaceCode || '00',

        // Example curl command
        exampleCurl: chatMsg?.fromAccountType === '1' ?
          `curl -X POST http://localhost:3001/api/reply/text -H "Content-Type: application/json" -d '{"sessionId":"${chatMsg?.sessionId}","shopId":"${session?.shopId}","buyerId":"${chatMsg?.fromAccountId}","text":"Your reply here"}'`
          : null
      }
    };
  } catch (error) {
    console.error('Error creating clean webhook payload:', error);
    return null;
  }
}

module.exports = {
  extractReplyInfo,
  extractTextContent,
  extractImageContent,
  isFromBuyer,
  formatMessage,
  createCleanWebhookPayload
};
