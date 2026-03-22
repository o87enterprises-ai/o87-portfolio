# API 530 Error Fix Guide

## Error Received
```json
{"error":"AI service error","status":530,"message":"Service unavailable"}
```

## What is 530 Error?

**HTTP 530** means the origin server (Ollama API) is unreachable from Cloudflare Workers. This is NOT a problem with your worker code - it's a connectivity issue.

---

## Common Causes & Fixes

### Cause 1: Wrong API Base URL ⭐ MOST LIKELY

Your worker is trying to reach `https://api.ollama.ai` but that might not be the correct endpoint.

**Fix:**
1. Go to Cloudflare Dashboard → Workers & Pages → o87-chat → Variables and Secrets
2. Add/Edit variable:
   - **Name:** `OLLAMA_BASE_URL`
   - **Value:** (choose one below)

**Correct URLs:**
| Provider | URL |
|----------|-----|
| Ollama.ai (official) | `https://api.ollama.ai` |
| Self-hosted Ollama | `https://your-domain.com` |
| Local development | `http://localhost:11434` (won't work from Workers) |
| Other providers | Check their documentation |

---

### Cause 2: Invalid or Expired API Key

**Check:**
1. Go to your Ollama dashboard
2. Verify API key is still valid
3. Check if key has the right permissions

**Fix:**
1. In Cloudflare Dashboard → o87-chat → Variables and Secrets
2. Find `OLLAMA_API_KEY` secret
3. Click edit and enter the new key
4. Deploy

---

### Cause 3: Ollama Service Down

**Check if service is up:**
```bash
curl -I https://api.ollama.ai
```

**Expected:** HTTP 200 or 401
**If 530/502/503:** Service is down

**Fix:** Wait for service to recover or switch providers

---

### Cause 4: Firewall/Network Blocking

The Ollama API might be blocking Cloudflare Workers IPs.

**Fix:**
1. Check Ollama dashboard for allowed IPs
2. Add Cloudflare IP ranges if needed
3. Or use a different API provider

---

## Testing Steps

### Step 1: Test Direct API Access
```bash
# Replace YOUR_KEY with your actual key
curl -X POST https://api.ollama.ai/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{
    "model": "llama3.2",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Expected:** Response with message content
**If 530:** Service is unreachable
**If 401:** API key is invalid
**If 200:** Service works - problem is in Worker config

### Step 2: Test Worker with Logging
1. Go to Cloudflare Dashboard → o87-chat → Observability → Logs
2. Send a test request:
```bash
curl -X POST https://o87-chat.o87enterprises.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Test"}]}'
```
3. Check logs for:
   - `Calling Ollama API at: [URL]` - verifies base URL
   - `Ollama response status: [CODE]` - shows actual error

### Step 3: Verify Configuration
In Cloudflare Dashboard → o87-chat → Variables and Secrets:

**Should have:**
| Type | Name | Status |
|------|------|--------|
| Secret | `OLLAMA_API_KEY` | ✅ Set |
| Variable | `OLLAMA_BASE_URL` | ✅ Set (optional) |

---

## Quick Fix Checklist

- [ ] Verify Ollama API key is valid (test in their dashboard)
- [ ] Check `OLLAMA_BASE_URL` is correct for your provider
- [ ] Ensure `OLLAMA_API_KEY` is set as a **Secret** (not plaintext variable)
- [ ] Test direct API access with curl
- [ ] Check Worker logs for detailed error messages
- [ ] Verify Ollama service status (is it down?)

---

## Alternative: Use Ollama Directly (Skip Worker)

If you want to test without the Worker proxy:

**In your portfolio's `index.html`, temporarily change:**
```javascript
// Find this line (~line 2040)
const WORKER_URL = 'https://o87-chat.o87enterprises.workers.dev';

// Replace with direct Ollama call (for testing only!)
const WORKER_URL = 'https://api.ollama.ai/api/chat';
```

**Note:** This won't work in production because:
1. CORS restrictions
2. Exposes your API key in client code
3. No error handling

Only use for debugging!

---

## Still Not Working?

### Enable Worker Debug Logs

1. Go to: Cloudflare Dashboard → o87-chat → Observability
2. Enable "Workers Logs"
3. Set log level to "Debug"
4. Send test request
5. Check logs for detailed error messages

### Check Compatibility Date

In Worker Settings → Runtime:
- **Compatibility date:** Should be recent (2024 or later)
- Current: `Mar 22, 2026` ✅

### Try Different Model

Some models might not be available:
```bash
curl -X POST https://o87-chat.o87enterprises.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

Try these models:
- `llama3.2` (default)
- `llama3.1`
- `mistral`
- `gemma`

---

## Contact Support

If none of the above works:

1. **Ollama Status:** Check https://status.ollama.ai
2. **Cloudflare Status:** Check https://www.cloudflarestatus.com
3. **Worker Logs:** Share error logs from Observability tab

---

Last Updated: March 22, 2026
