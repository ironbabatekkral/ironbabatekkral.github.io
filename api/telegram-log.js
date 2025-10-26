// 🔐 Telegram Log Serverless Function (Vercel)
// Bu fonksiyon BOT_TOKEN ve CHAT_ID'yi güvenli bir şekilde saklar
// ve frontend'den gelen log verilerini Telegram'a gönderir.

// Environment Variables (Vercel Dashboard'dan ayarlanmalı):
// - TELEGRAM_BOT_TOKEN
// - TELEGRAM_CHAT_ID
// - ALLOWED_ORIGIN (optional, default: *)

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// IP adresini anonim hale getir (GDPR uyumlu)
function anonymizeIP(ip) {
    if (!ip) return 'Unknown';
    const parts = ip.split('.');
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return 'Unknown';
}

// User Agent'tan cihaz tipi çıkar
function getDeviceType(userAgent) {
    if (!userAgent) return 'Unknown';
    if (/mobile/i.test(userAgent)) return '📱 Mobile';
    if (/tablet/i.test(userAgent)) return '📱 Tablet';
    return '💻 Desktop';
}

// Browser bilgisi çıkar
function getBrowser(userAgent) {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
}

// Telegram mesajını formatla
function formatTelegramMessage(logData, ip) {
    const {
        event_type,
        page_url,
        page_title,
        user_agent,
        referrer,
        timestamp,
        additional_data
    } = logData;

    const date = new Date(timestamp);
    const formattedDate = date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const deviceType = getDeviceType(user_agent);
    const browser = getBrowser(user_agent);
    const anonIP = anonymizeIP(ip);

    // Olay tipine göre emoji ve başlık
    const eventIcons = {
        'page_view': '🌐 YENİ ZİYARET',
        'page_exit': '👋 ZİYARET SONU',
        'button_click': '🖱️ BUTON TIKLAMA',
        'form_submit': '📧 FORM GÖNDERİMİ',
        'project_click': '📂 PROJE GÖRÜNTÜLENDİ',
        'social_click': '📱 SOSYAL MEDYA',
        'download': '⬇️ İNDİRME'
    };

    const title = eventIcons[event_type] || '🔔 YENİ OLAY';

    let message = `${title}\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `📅 Tarih: ${formattedDate}\n`;
    message += `📄 Sayfa: ${page_title || 'Unknown'}\n`;
    message += `🔗 URL: ${page_url}\n`;
    message += `🎯 Olay: ${event_type.replace('_', ' ').toUpperCase()}\n`;
    message += `🌍 IP: ${anonIP}\n`;
    message += `${deviceType} (${browser})\n`;

    if (referrer && referrer !== '') {
        message += `🔙 Kaynak: ${referrer}\n`;
    }

    // Ek veriler varsa ekle
    if (additional_data && Object.keys(additional_data).length > 0) {
        message += `\n📊 Ek Bilgiler:\n`;
        Object.entries(additional_data).forEach(([key, value]) => {
            message += `  • ${key}: ${value}\n`;
        });
    }

    message += `━━━━━━━━━━━━━━━━`;

    return message;
}

// Ana handler fonksiyonu
export default async function handler(req, res) {
    // CORS headers
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Sadece POST isteklerini kabul et
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use POST.'
        });
    }

    try {
        // Environment variables kontrolü
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.error('Missing environment variables!');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error'
            });
        }

        // Request body'den log verisini al
        const logData = req.body;

        if (!logData || !logData.event_type) {
            return res.status(400).json({
                success: false,
                error: 'Invalid log data. event_type is required.'
            });
        }

        // IP adresini al (Vercel headers)
        const ip = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection?.remoteAddress || 
                   'Unknown';

        // Telegram mesajını formatla
        const message = formatTelegramMessage(logData, ip);

        // Telegram API'ye POST isteği gönder
        const telegramUrl = `${TELEGRAM_API_URL}${botToken}/sendMessage`;
        const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });

        const telegramData = await telegramResponse.json();

        if (!telegramData.ok) {
            console.error('Telegram API error:', telegramData);
            return res.status(500).json({
                success: false,
                error: 'Failed to send log to Telegram',
                details: telegramData.description
            });
        }

        // Başarılı
        return res.status(200).json({
            success: true,
            message: 'Log sent to Telegram successfully',
            telegram_message_id: telegramData.result.message_id
        });

    } catch (error) {
        console.error('Error in telegram-log handler:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}

