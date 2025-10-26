# 🔐 GÜVENLİK KURULUMU - TOKEN'LARI SAKLA

## ⚠️ ÖNEMLİ: Token'lar Asla GitHub'da Görünmeyecek!

Bu rehber, token'larınızı güvenli bir şekilde saklamanız için hazırlanmıştır.

---

## 📝 ADIM 1: Lokal `.env` Dosyası Oluştur

Proje kök dizininde **`.env`** dosyası oluştur ve aşağıdaki içeriği yapıştır:

```env
# 🔐 Telegram Logger Environment Variables
# ⚠️ BU DOSYA GİTHUB'A COMMIT EDİLMEMELİ (.gitignore'da)

# Telegram Bot Token (BotFather'dan aldığın token'ı buraya yaz)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Telegram Chat ID (@userinfobot'tan aldığın ID'yi buraya yaz)
TELEGRAM_CHAT_ID=your_chat_id_here

# İzin verilen origin (GitHub Pages URL'n)
ALLOWED_ORIGIN=https://ironbabatekkral.github.io
```

### ✅ Kontrol Et:

```bash
# .gitignore dosyasında .env var mı kontrol et
cat .gitignore | grep ".env"
```

Çıktı: `.env` görmelisin (zaten ekledik ✅)

---

## 🚀 ADIM 2: Vercel'e Deploy ve Environment Variables Ekle

### 2.1. GitHub'a Commit ve Push

```bash
git add .
git commit -m "feat: Güvenli Telegram log sistemi eklendi"
git push
```

⚠️ **ÖNEMLİ**: `.env` dosyası commit edilmeyecek (`.gitignore`'da olduğu için)

### 2.2. Vercel'e Import Et

1. [vercel.com](https://vercel.com) adresine git
2. "Sign Up" ile GitHub hesabınla giriş yap
3. "Add New..." > "Project" tıkla
4. **ironbabatekkral.github.io** repository'sini seç
5. "Import" butonuna tıkla

### 2.3. Environment Variables Ekle

Deploy sayfasında **"Environment Variables"** bölümünde şunları ekle:

#### Variable 1: TELEGRAM_BOT_TOKEN

```
Name: TELEGRAM_BOT_TOKEN
Value: [BotFather'dan aldığın token'ı buraya yapıştır]
```

**"Add"** butonuna tıkla

#### Variable 2: TELEGRAM_CHAT_ID

```
Name: TELEGRAM_CHAT_ID
Value: [Chat ID'ni buraya yapıştır]
```

**"Add"** butonuna tıkla

#### Variable 3: ALLOWED_ORIGIN

```
Name: ALLOWED_ORIGIN
Value: https://ironbabatekkral.github.io
```

**"Add"** butonuna tıkla

### 2.4. Deploy Et

"Deploy" butonuna tıkla ve 1-2 dakika bekle.

Deploy tamamlandığında Vercel sana bir URL verecek (örn: `https://ironbabatekkral.vercel.app`)

---

## 🧪 ADIM 3: Test Et

### Test 1: Vercel Backend Endpoint

Tarayıcı console'da:

```javascript
fetch("https://ironbabatekkral.vercel.app/api/telegram-log", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    event_type: "test",
    page_url: "https://test.com",
    page_title: "Test Page",
    user_agent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  }),
})
  .then((r) => r.json())
  .then((d) => console.log(d));
```

**Telegram'da mesaj gelmelidir!** 🎉

### Test 2: Frontend Logger

Siteyi aç ve console'da:

```javascript
telegramLogger.trackButtonClick("test-button", "Test Button");
```

**Telegram'da "🖱️ BUTON TIKLAMA" mesajı gelmelidir!**

---

## 🔍 GÜVENLİK KONTROL LİSTESİ

### ✅ Token'lar Gizli mi?

1. **GitHub Repository Kontrolü**:

   - GitHub'da repo'ya git
   - `api/telegram-log.js` dosyasını aç
   - Token görünüyor mu? ❌ HAYIR (sadece `process.env.TELEGRAM_BOT_TOKEN` var)

2. **Sayfa Kaynak Kodu Kontrolü**:

   - Siteyi aç (https://ironbabatekkral.github.io)
   - Sağ tık > "Kaynağı Göster" (View Page Source)
   - Ctrl+F ile `7807099407` ara
   - Token görünüyor mu? ❌ HAYIR

3. **Frontend JavaScript Kontrolü**:

   - `telegram-logger.js` dosyasını aç
   - Token var mı? ❌ HAYIR (sadece endpoint URL var)

4. **.gitignore Kontrolü**:
   - `.gitignore` dosyasını aç
   - `.env` var mı? ✅ EVET

### ✅ Token'lar Nerede Saklanıyor?

| Yer                   | Token Var mı? | Açıklama                             |
| --------------------- | ------------- | ------------------------------------ |
| `.env` (lokal)        | ✅ EVET       | Ama `.gitignore`'da, GitHub'a gitmez |
| GitHub Repository     | ❌ HAYIR      | Asla commit edilmez                  |
| Vercel Dashboard      | ✅ EVET       | Environment Variables'da (güvenli)   |
| Sayfa Kaynak Kodu     | ❌ HAYIR      | Frontend'de token yok                |
| `api/telegram-log.js` | ❌ HAYIR      | `process.env` ile okuyor             |

---

## 🔒 GÜVENLİK MİMARİSİ

```
┌─────────────────────────────────┐
│  GitHub Repository              │
│  (PUBLIC - Token YOK!)          │
│  ✅ index.html                   │
│  ✅ telegram-logger.js           │
│  ✅ api/telegram-log.js          │
│  ❌ .env (gitignore'da)         │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  Vercel Dashboard               │
│  (PRIVATE - Token BURADA!)      │
│  🔐 Environment Variables:      │
│     TELEGRAM_BOT_TOKEN=7807...  │
│     TELEGRAM_CHAT_ID=7474...    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  İstemci (Browser)              │
│  (PUBLIC - Token YOK!)          │
│  ✅ telegram-logger.js çalışır  │
│  ✅ Sadece log data gönderir    │
│  ❌ Token görmez                │
└─────────────────────────────────┘
```

---

## ⚠️ UYARILAR

### ❌ ASLA YAPMA:

1. ❌ `.env` dosyasını GitHub'a commit etme
2. ❌ Token'ı frontend JavaScript'ine yazma
3. ❌ Token'ı HTML'e yazma
4. ❌ Token'ı `console.log()` ile yazdırma
5. ❌ Token'ı birisiyle paylaşma

### ✅ YAPMAN GEREKENLER:

1. ✅ `.env` dosyasını `.gitignore`'a ekle (zaten ekli ✅)
2. ✅ Token'ları Vercel Environment Variables'a ekle
3. ✅ Backend'de `process.env` ile oku
4. ✅ Token'ları güvenli tut

---

## 🔄 Token'ı Değiştirmen Gerekirse

Eğer token ifşa olursa (yanlışlıkla commit ettiysen):

1. **BotFather'da Token'ı Yenile**:

   ```
   Telegram'da @BotFather'ı aç
   Gönder: /revoke
   Bot'unu seç
   Yeni token alacaksın
   ```

2. **Vercel'de Güncelle**:

   - Vercel Dashboard > Settings > Environment Variables
   - TELEGRAM_BOT_TOKEN'ı düzenle
   - Yeni token'ı yaz
   - Redeploy yap

3. **Lokal .env'yi Güncelle**:
   - `.env` dosyasını aç
   - Yeni token'ı yaz

---

## 📊 BAŞARILI KURULUM KONTROLÜ

Tüm adımları tamamladıysan:

- [x] `.env` dosyası oluşturuldu (lokal)
- [x] `.gitignore`'da `.env` var
- [x] GitHub'a commit ve push yapıldı
- [x] Vercel'e import edildi
- [x] Environment variables eklendi
- [x] Deploy tamamlandı
- [x] Backend endpoint test edildi
- [x] Telegram'da mesaj geldi ✅

---

## 🎉 TAMAMLANDI!

Token'ların artık **tamamen güvenli**!

- ✅ GitHub'da görünmüyor
- ✅ Sayfa kaynak kodunda görünmüyor
- ✅ Sadece Vercel'de güvenli bir şekilde saklanıyor
- ✅ Backend serverless function ile kullanılıyor

**Telegram'dan site ziyaretlerini takip edebilirsin!** 🚀

---

## 🆘 Sorun mu Var?

### "Missing environment variables" hatası

**Çözüm**: Vercel dashboard'da environment variables'ı kontrol et.

### Telegram'a mesaj gelmiyor

**Kontrol Listesi**:

- ✅ Bot token doğru mu?
- ✅ Chat ID doğru mu?
- ✅ Vercel'de environment variables var mı?
- ✅ Deploy başarılı mı?

---

**Hazırsın!** 🔥
