#!/bin/bash

# Test script for Hitoko Pusher Server

SERVER_URL="http://localhost:3001"

echo "========================================"
echo "Hitoko Pusher Server Test Script"
echo "========================================"
echo ""

# Check if server is running
echo "1. Testing health check..."
HEALTH_CHECK=$(curl -s -w "\nHTTP_STATUS:%{http_code}" $SERVER_URL/health)
HTTP_STATUS=$(echo "$HEALTH_CHECK" | grep "HTTP_STATUS" | cut -d: -f2)

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ Server is running"
    echo "$HEALTH_CHECK" | grep -v "HTTP_STATUS" | jq '.'
else
    echo "✗ Server is not running or not responding"
    echo "Please start the server with: npm run server"
    exit 1
fi

echo ""
echo "2. Testing shop list endpoint..."
SHOPS=$(curl -s -w "\nHTTP_STATUS:%{http_code}" $SERVER_URL/api/shops)
HTTP_STATUS=$(echo "$SHOPS" | grep "HTTP_STATUS" | cut -d: -f2)

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ Shop list retrieved successfully"
    echo "$SHOPS" | grep -v "HTTP_STATUS" | jq '.data[0] | {shopName: .marketplaceShopName, shopId: .marketplaceShopId, companyId: .companyId}'
else
    echo "✗ Failed to retrieve shop list"
    echo "$SHOPS" | grep -v "HTTP_STATUS"
fi

echo ""
echo "========================================"
echo "Test Complete!"
echo "========================================"
echo ""
echo "To send a test message, use:"
echo ""
echo "curl -X POST $SERVER_URL/api/reply/text \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"sessionId\": \"YOUR_SESSION_ID\","
echo "    \"shopId\": \"YOUR_SHOP_ID\","
echo "    \"buyerId\": \"BUYER_ID\","
echo "    \"text\": \"Hello from test script!\""
echo "  }'"
echo ""
