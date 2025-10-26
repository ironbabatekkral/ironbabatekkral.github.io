# 🚀 Iron's Portfolio - Telegram Log Sistemi

**Güvenli, gerçek zamanlı web sitesi analitik sistemi**

---

## 📂 DOSYA YAPISI

```
📁 Proje Kökü
│
├── 🔐 GÜVENLİK DOSYALARI (GitHub'a GİTMEYECEK)
│   ├── .env                    # ← OLUŞTUR! Token'ların burada
│   └── SENIN_TOKENLAR.txt      # ← Token'larını hatırla
│
├── 📚 DOKÜMANTASYON
│   ├── HIZLI_BASLANGIC.md      # ← BURADAN BAŞLA!
│   ├── SECURITY_SETUP.md       # ← Güvenlik detayları
│   ├── TELEGRAM_DEPLOYMENT_GUIDE.md
│   ├── TELEGRAM_LOG_ARCHITECTURE.md
│   └── TELEGRAM_README.md
│
├── 💻 KOD DOSYALARI
│   ├── api/
│   │   └── telegram-log.js     # Backend (Serverless)
│   ├── telegram-logger.js      # Frontend tracker
│   ├── index.html              # Ana sayfa
│   ├── script.js               # Site JavaScript
│   └── styles.css              # Siteler
│
└── ⚙️ YAPLANDIRMA
    ├── vercel.json             # Vercel config
    ├── .env.example            # Environment variables template
    └── .gitignore              # Git ignore rules
```

---

## ⚡ HIZLI BAŞLANGIÇ

### 1️⃣ Token'larını Hazırla (ZATEN HAZIR!)

✅ Bot Token: Var (`SENIN_TOKENLAR.txt` dosyasında)
✅ Chat ID: Var (`SENIN_TOKENLAR.txt` dosyasında)

### 2️⃣ Lokal .env Oluştur

```bash
# Windows PowerShell
New-Item -Path ".env" -ItemType File
notepad .env
```

`SENIN_TOKENLAR.txt` dosyasındaki token'ları kopyala ve `.env`'ye yapıştır:

```env
TELEGRAM_BOT_TOKEN=7807...
TELEGRAM_CHAT_ID=7474...
ALLOWED_ORIGIN=https://ironbabatekkral.github.io
```

### 3️⃣ GitHub'a Push

```bash
git add .
git commit -m "feat: Telegram log sistemi"
git push
```

⚠️ `.env` ve `SENIN_TOKENLAR.txt` commit edilmeyecek (`.gitignore`'da)

### 4️⃣ Vercel'e Deploy

1. [vercel.com](https://vercel.com) → GitHub ile giriş
2. Import Repository → **ironbabatekkral.github.io**
3. Environment Variables ekle:
   - `TELEGRAM_BOT_TOKEN`: [Token'ını yapıştır]
   - `TELEGRAM_CHAT_ID`: [Chat ID'ni yapıştır]
   - `ALLOWED_ORIGIN`: `https://ironbabatekkral.github.io`
4. Deploy!

### 5️⃣ Test Et

Console'da:

```javascript
telegramLogger.trackButtonClick("test", "Test");
```

Telegram'da mesaj gelmelidir! 🎉

---

## 🔒 GÜVENLİK KONTROL

### ✅ Token'lar Güvende mi?

| Yer                  | Token Var mı? | Durum                  |
| -------------------- | ------------- | ---------------------- |
| `.env` (lokal)       | ✅ EVET       | Ama `.gitignore`'da    |
| `SENIN_TOKENLAR.txt` | ✅ EVET       | Ama `.gitignore`'da    |
| GitHub Repository    | ❌ HAYIR      | ✅ GÜVENLİ             |
| Sayfa Kaynak Kodu    | ❌ HAYIR      | ✅ GÜVENLİ             |
| Vercel Dashboard     | ✅ EVET       | ✅ GÜVENLİ (encrypted) |

---

## 📊 LOGLANACAK OLAYLAR

### 🤖 Otomatik

- ✅ Sayfa görüntüleme
- ✅ Sayfa çıkış
- ✅ Tab değiştirme

### 🎯 Manuel (Entegre Edildi!)

- ✅ **Start butonu** tıklama
- ✅ **Sosyal medya** butonları (Instagram, GitHub, Discord)
- ✅ **Proje kartları** tıklama

---

## 📱 TELEGRAM MESAJ ÖRNEĞİ

```
🌐 YENİ ZİYARET
━━━━━━━━━━━━━━━━
📅 Tarih: 26.10.2024 18:32:19
📄 Sayfa: Iron's Page
🔗 URL: https://ironbabatekkral.github.io/
🎯 Olay: PAGE VIEW
🌍 IP: 185.123.xxx.xxx
💻 Desktop (Chrome)
━━━━━━━━━━━━━━━━
```

---

## 🆘 SORUN GIDERME

### Telegram'a mesaj gelmiyor

**Kontrol Listesi**:

1. Vercel environment variables doğru mu?
2. Bot token ve chat ID doğru mu?
3. Deploy başarılı mı?
4. Frontend endpoint URL güncel mi?

### Debug Mode

`telegram-logger.js` içinde:

```javascript
const telegramLogger = new TelegramLogger({
  debug: true, // Console'da logları göster
});
```

---

## 📚 DETAYLI DOKÜMANTASYON

| Dosya                        | Açıklama           | Öncelik         |
| ---------------------------- | ------------------ | --------------- |
| **HIZLI_BASLANGIC.md**       | 5 dakikada kurulum | 🔴 ÖNCE BU!     |
| **SECURITY_SETUP.md**        | Güvenlik detayları | 🟡 Önemli       |
| **SENIN_TOKENLAR.txt**       | Token notları      | 🔴 Gizli tut!   |
| TELEGRAM_DEPLOYMENT_GUIDE.md | Deployment rehberi | 🟢 Referans     |
| TELEGRAM_README.md           | Genel bilgiler     | 🟢 Referans     |
| TELEGRAM_LOG_ARCHITECTURE.md | Mimari             | 🟢 Teknik detay |

---

## ✅ KURULUM KONTROLÜ

- [ ] `SENIN_TOKENLAR.txt` oluşturuldu
- [ ] `.env` oluşturuldu (lokal)
- [ ] `.gitignore` güncel
- [ ] GitHub'a commit edildi
- [ ] Vercel'e import edildi
- [ ] Environment variables eklendi
- [ ] Deploy tamamlandı
- [ ] Test edildi
- [ ] Telegram'da mesaj geldi ✅

---

## 🎯 ÖZELLİKLER

- ✅ Gerçek zamanlı tracking
- ✅ Token'lar %100 güvenli
- ✅ GDPR uyumlu (IP anonimizasyonu)
- ✅ Rate limiting (spam koruması)
- ✅ Ücretsiz (Vercel/Netlify)
- ✅ Kolay kurulum

---

## 🚀 SONRAKI ADIMLAR

1. ✅ **Token'lar hazır** (`SENIN_TOKENLAR.txt`)
2. 📝 **HIZLI_BASLANGIC.md** dosyasını oku
3. 🔧 `.env` dosyasını oluştur
4. 🚀 Vercel'e deploy et
5. 🎉 Telegram'dan siteyi izle!

---

**Başarılar!** 🔥

Made with ❤️ by [Iron](https://github.com/ironbabatekkral)
