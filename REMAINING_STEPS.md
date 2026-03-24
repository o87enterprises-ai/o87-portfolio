# 🔧 REMAINING STEPS TO COMPLETE CONFIGURATION

## ✅ COMPLETED

### 1. Frugle App
- ✅ Updated with latest build
- ✅ Logo configured and showing
- ✅ Paths fixed for portfolio embedding

### 2. Portfolio Structure  
- ✅ Services section moved to bottom
- ✅ Top replaced with 3-card Value Proposition
- ✅ Navigation updated

### 3. Truegle Backend
- ✅ Railway URL configured: `https://joyful-stillness-production-788b.up.railway.app`
- ✅ Built JS file patched with correct backend URL

---

## 🔴 REMAINING STEPS

### Step 1: Verify Truegle Search Works

**Test it now:**
1. Open your portfolio: `index.html` in browser
2. Click on Truegle card
3. Try a search query
4. Check browser console (F12) for errors

**If it doesn't work:**
- Open browser console
- Look for CORS errors
- Railway may need CORS headers configured

---

### Step 2: Munch App Configuration

**Current Status:** API_URL is empty

**Option A - If you have a Munch backend URL:**

1. Edit `/apps/munch/app.js` line 2:
```javascript
// Change from:
const API_URL = '';

// To:
const API_URL = 'https://your-munch-backend-url.com';
```

**Option B - If backend not deployed:**

You need to:
1. Find/build the Munch backend
2. Deploy to Cloudflare Workers or Railway
3. Get the URL
4. Update `app.js` with the URL

---

### Step 3: OSINT App Configuration

**Current Status:** Uses relative paths (`/analyze/phone`)

**To Fix:**

Edit `/apps/osint/index.html` - find the script section and add:

```javascript
// Add this at the top of the script section:
const OSINT_API_BASE = 'https://your-osint-backend-url.com';

// Then update all fetch calls, for example:
// Change from:
fetch('/analyze/phone', {...})

// To:
fetch(OSINT_API_BASE + '/analyze/phone', {...})
```

Do this for these endpoints:
- `/analyze/phone`
- `/analyze/text`
- `/analyze/username`

---

### Step 4: o87 Chat AI - Cloudflare Worker

**Current Status:** Worker deployed but needs API key verification

**To Complete:**

#### A. Install Wrangler CLI (if not already installed)
```bash
npm install -g wrangler
```

#### B. Login to Cloudflare
```bash
wrangler login
```

#### C. Check current secrets
```bash
wrangler secret list --name o87-chat
```

#### D. Add OLLAMA_API_KEY secret
```bash
wrangler secret put OLLAMA_API_KEY --name o87-chat
```
When prompted, paste your Ollama API key.

#### E. Test the worker
```bash
curl -X POST https://o87-chat.o87enterprises.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "messages": [{"role": "user", "content": "Hello, are you working?"}]
  }'
```

**Expected response:**
```json
{
  "id": "chat-1234567890",
  "model": "llama3.2",
  "choices": [{
    "message": {"role": "assistant", "content": "Hello! Yes, I'm working."}
  }]
}
```

#### F. If you don't have an Ollama API key:
1. Go to https://ollama.ai
2. Sign up for API access
3. Get your API key
4. Run step D above

---

## 📋 QUICK REFERENCE

### Files That Need Editing

| File | What to Change | Line |
|------|---------------|------|
| `/apps/munch/app.js` | Set `API_URL` | Line 2 |
| `/apps/osint/index.html` | Add `OSINT_API_BASE` + update fetch calls | Script section |
| Cloudflare Worker | Add `OLLAMA_API_KEY` secret | Via wrangler |

### URLs You Need

| Service | Status | Action |
|---------|--------|--------|
| Truegle | ✅ Configured | Test it |
| Munch | ❓ Need URL | Provide or deploy backend |
| OSINT | ❓ Need URL | Provide or deploy backend |
| Chat AI | ⚠️ Need API Key | Add to Cloudflare |

---

## 🧪 TESTING CHECKLIST

After completing all steps:

- [ ] Open portfolio in browser
- [ ] Click Truegle → Search works
- [ ] Click Munch → Can analyze conversations
- [ ] Click OSINT → Phone/text analysis works
- [ ] Chat bubble → AI responds
- [ ] Services section at bottom
- [ ] Value prop cards at top
- [ ] Frugle logo displays

---

## 🆘 TROUBLESHOOTING

### Truegle Search Not Working

**Check browser console for:**
- `404` → Backend URL wrong
- `CORS error` → Backend needs CORS headers
- `Network error` → Backend not running

**Fix CORS on Railway:**
Add this to your Railway backend:
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

### Chat Widget Not Working

**Check:**
1. Worker deployed: https://dash.cloudflare.com/workers
2. Secret set: `wrangler secret list --name o87-chat`
3. API key valid: Test with curl command above

**Common errors:**
- "Invalid API key" → Key wrong or expired
- "Service unavailable" → Ollama service down
- "Connection error" → Worker not deployed

---

## 📞 NEED HELP?

Provide these details:
1. Which app isn't working?
2. What error message do you see? (screenshot)
3. Browser console errors? (F12 → Console)

---

Last Updated: March 24, 2026
Next Action: Test Truegle search, then provide Munch/OSINT backend URLs
