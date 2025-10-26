# 🚀 Iron's Portfolio Website

Personal portfolio website with real-time Telegram logging system.

## 🔥 Features

- 🎨 Modern dark theme with Kali Linux terminal background
- 🎵 MR. Robot theme music (auto-muted to 30%)
- 📊 Real-time Telegram logging system
- 🔐 Secure token management (Vercel environment variables)
- 📱 Responsive design
- ⚡ Animated terminal logs
- 🎯 Social media integration (GitHub, Instagram, Discord)
- 📂 Auto-loading GitHub projects

## 📊 Telegram Logging

This site uses a secure serverless function to log all activities to Telegram:

### Logged Events:

- ✅ Page views (automatic)
- ✅ Button clicks (Start button)
- ✅ Social media clicks (GitHub, Instagram, Discord)
- ✅ Project card clicks
- ✅ Page exits and tab switches

### Security:

- 🔒 Bot tokens stored in Vercel environment variables
- 🔒 Never exposed in frontend code
- 🔒 Serverless backend (api/telegram-log.js)
- 🌍 Full IP address logging (no anonymization)

## 🚀 Setup

### 1. Create .env file

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
ALLOWED_ORIGIN=https://ironbabatekkral.github.io
```

### 2. Deploy to Vercel

1. Import GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

### 3. Test

Open browser console:

```javascript
telegramLogger.trackButtonClick("test", "Test Button");
```

Check Telegram for the message! 🎉

## 📁 File Structure

```
├── api/
│   └── telegram-log.js       # Serverless backend
├── telegram-logger.js         # Frontend tracker
├── index.html                 # Main page
├── script.js                  # Site logic
├── styles.css                 # Styling
└── vercel.json                # Vercel config
```

## 📱 Telegram Message Format

```
🌐 YENİ ZİYARET
━━━━━━━━━━━━━━━━
📅 Tarih: 26.10.2024 18:32:19
📄 Sayfa: Iron's Page
🔗 URL: https://ironbabatekkral.github.io/
🎯 Olay: PAGE VIEW
🌍 IP Adresi: 185.123.45.67
💻 Desktop (Chrome)
📱 User Agent: Mozilla/5.0...
━━━━━━━━━━━━━━━━
```

## 🔧 Technologies

- HTML5, CSS3, JavaScript (ES6+)
- Vercel (Serverless Functions)
- Telegram Bot API
- Particles.js
- Vanilla Tilt.js

## 📝 License

MIT License

---

Made with ❤️ by [Iron](https://github.com/ironbabatekkral)
