# Auto-Reply Safety Guide

## ⚠️ IMPORTANT: Read This Before Enabling Auto-Reply

Auto-reply functionality is **DISABLED by default** and must be explicitly enabled by running a separate script. This is by design for safety reasons.

## Default Behavior

### Main Worker (`npm run worker`)
- ✅ Listens to MQTT messages
- ✅ Forwards messages to your webhook
- ❌ Does NOT auto-reply to customers
- ✅ Safe to run 24/7

This is the recommended setup for most use cases.

## Auto-Reply Bot (`npm run auto-reply`)

The auto-reply bot is a **completely separate script** that must be run explicitly.

### Why Auto-Reply is Disabled by Default

1. **Prevents Accidental Responses**: You don't want to accidentally send automated messages to customers without testing first
2. **Requires Customization**: Auto-reply logic must be tailored to your specific business needs
3. **Needs Human Oversight**: Automated responses should be reviewed and approved before use
4. **Potential for Errors**: Generic auto-replies might provide incorrect information
5. **Customer Experience**: Poor auto-replies can damage customer relationships

## Before Enabling Auto-Reply

### ✅ Pre-Flight Checklist

- [ ] I have tested the auto-reply bot with sample messages
- [ ] I have customized the keyword detection for my business
- [ ] I have verified that auto-responses are accurate and helpful
- [ ] I have a plan to monitor auto-reply performance
- [ ] I have considered what happens if the bot gives wrong information
- [ ] I have discussed this with my team/stakeholders
- [ ] I understand that customers will receive these messages automatically

### ❌ Don't Enable Auto-Reply If:

- You haven't tested it thoroughly
- You're not sure what messages it will send
- You don't have time to monitor it regularly
- Your product catalog changes frequently
- You need to provide personalized responses
- You're in a highly regulated industry (healthcare, finance, etc.)

## How to Enable Auto-Reply Safely

### 1. Test in Development

```bash
# Set webhook to a test endpoint
WEBHOOK_URL=http://localhost:3000/test

# Run auto-reply bot
npm run auto-reply
```

### 2. Customize the Logic

Edit `examples/example-auto-reply.js` and customize the `generateReply()` function:

```javascript
generateReply(customerMessage) {
  const message = customerMessage.toLowerCase();

  // Add your custom logic here
  if (message.includes('your-specific-keyword')) {
    return 'Your custom response';
  }

  // Default safe response
  return 'Thank you for your message. Our team will respond shortly.';
}
```

### 3. Test with Real Messages

1. Send test messages from a test account
2. Verify the bot responds correctly
3. Check timing and accuracy
4. Test edge cases (emojis, special characters, long messages)

### 4. Monitor Performance

```bash
# Watch auto-reply logs
npm run auto-reply | tee auto-reply-$(date +%Y%m%d).log
```

### 5. Have a Kill Switch

Know how to stop the bot immediately:

```bash
# Find the process
ps aux | grep auto-reply

# Or if running in terminal, just press Ctrl+C

# In Docker:
docker-compose stop auto-reply
```

## Best Practices

### ✅ Do:

- Start with simple, generic responses
- Include a disclaimer that it's an automated message
- Provide a way to reach a human
- Monitor customer feedback
- Update responses based on actual questions
- Keep a log of all auto-replies
- Have escalation rules for complex questions

### ❌ Don't:

- Make promises you can't keep
- Provide specific pricing (use product catalog instead)
- Give medical, legal, or financial advice
- Reply to angry/frustrated customers automatically
- Send promotional messages automatically
- Use auto-reply for order status (use tracking instead)

## Example Safe Auto-Reply

```javascript
generateReply(customerMessage) {
  const message = customerMessage.toLowerCase();

  // Very generic, safe response
  if (message.includes('harga') || message.includes('price')) {
    return 'Halo! Harga produk bisa dilihat di deskripsi produk. Tim kami siap membantu jika ada pertanyaan. Terima kasih! 😊';
  }

  if (message.includes('ready') || message.includes('stock')) {
    return 'Halo! Produk yang ditampilkan ready stock. Silakan order langsung ya. Terima kasih! 😊';
  }

  // Default: acknowledge and say human will respond
  return 'Halo! Terima kasih atas pesan Anda. Tim kami akan segera merespons. Mohon tunggu sebentar ya. Terima kasih! 😊';
}
```

## Monitoring and Troubleshooting

### Check Auto-Reply Status

```bash
# Check if auto-reply is running
ps aux | grep auto-reply

# Check recent auto-replies in logs
tail -f auto-reply.log
```

### Common Issues

**Issue: Bot responding to seller messages**
- ✅ Fix: The bot already filters for customer messages only (`isFromBuyer` check)

**Issue: Inappropriate responses**
- ✅ Fix: Review and update `generateReply()` function

**Issue: Too many auto-replies**
- ✅ Fix: Add rate limiting or cooldown period

**Issue: Bot not responding**
- ✅ Fix: Check logs, verify MQTT connection, test manually

## Emergency Shutdown

If auto-reply is causing issues:

```bash
# 1. Stop the bot immediately
Ctrl+C (if running in terminal)

# 2. Or kill the process
pkill -f auto-reply

# 3. In Docker
docker-compose stop auto-reply

# 4. Remove from startup if auto-starting
# Edit docker-compose.yml and comment out auto-reply service
```

## Legal Considerations

Depending on your jurisdiction, automated responses may need to:
- Disclose they are automated
- Comply with consumer protection laws
- Follow platform terms of service (Shopee, Tokopedia, etc.)
- Respect customer privacy
- Provide opt-out options

**Consult with legal counsel if unsure.**

## Summary

- ✅ Auto-reply is **OFF by default** - this is intentional
- ⚠️  Only enable if you understand the implications
- 🧪 Test thoroughly before production use
- 👀 Monitor continuously when enabled
- 🛑 Have a plan to shut it down quickly
- 📝 Keep logs of all automated responses
- 👥 Consider human oversight for important decisions

**When in doubt, don't auto-reply. Forward to webhook and let humans handle it.**
