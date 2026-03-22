# o87 Cloudflare Configuration Guide

## Current Setup (March 22, 2026)

### ✅ Already Deployed

#### 1. o87-chat Worker
- **URL:** `https://o87-chat.o87enterprises.workers.dev`
- **Status:** Deployed and active
- **Secrets Configured:**
  - `NTFY_TOPIC` (encrypted)
  - `OLLAMA_API_KEY` ⚠️ **Currently showing as plaintext - needs to be converted to secret**

#### 2. o87-portfolio Pages
- **GitHub:** `o87enterprises-ai/o87-portfolio`
- **Production Branch:** `main`
- **Automatic Deployments:** Enabled
- **Secrets Configured:**
  - `o87 portfolio ollama key` (encrypted)

---

## ⚠️ Security Issue: OLLAMA_API_KEY Exposed

Your Ollama API key is currently visible as plaintext in the Cloudflare dashboard. This is a security risk.

### Fix: Convert to Secret

1. **Delete the plaintext variable:**
   - Go to: Workers & Pages → o87-chat → Variables and Secrets
   - Find `OLLAMA_API_KEY` under "Variables" (not Secrets)
   - Click the three dots → Delete

2. **Add as a Secret:**
   - In the same "Variables and Secrets" section
   - Click "Add variable" → Select "Secret"
   - Name: `OLLAMA_API_KEY`
   - Value: `12d0ed3bbc184906ab6ad09aa99553c8.pBBv-21oS25DS3DRBARPopKi`
   - Click "Deploy"

3. **Alternatively, use Wrangler CLI:**
   ```bash
   wrangler secret put OLLAMA_API_KEY --name o87-chat
   # Enter the key when prompted
   ```

---

## 🔧 Worker Code Update

Your current worker may not be handling requests correctly. Update it with this improved version:

### Updated worker.js (copy to Cloudflare)

Go to: Workers & Pages → o87-chat → Quick edit

Replace the entire code with:

```javascript
export default {
  async fetch(request, env) {
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed',
        info: 'Send POST requests with JSON body containing "messages" array'
      }), { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      
      // Validate request
      if (!body.messages || !Array.isArray(body.messages)) {
        return new Response(JSON.stringify({
          error: 'Invalid request',
          required: { messages: 'array of {role, content} objects' },
          example: {
            model: 'llama3.2',
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: 'Hello!' }
            ]
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get config from secrets
      const apiKey = env.OLLAMA_API_KEY;
      const baseUrl = env.OLLAMA_BASE_URL || 'https://api.ollama.ai';

      if (!apiKey) {
        return new Response(JSON.stringify({
          error: 'Server configuration error',
          message: 'API key not configured. Contact administrator.'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Call Ollama API
      const ollamaResponse = await fetch(baseUrl + '/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: body.model || 'llama3.2',
          messages: body.messages,
          stream: false
        })
      });

      if (!ollamaResponse.ok) {
        const errorText = await ollamaResponse.text();
        console.error('Ollama error:', ollamaResponse.status, errorText);
        
        return new Response(JSON.stringify({
          error: 'AI service error',
          status: ollamaResponse.status,
          message: ollamaResponse.status === 401 
            ? 'Invalid API key'
            : ollamaResponse.status === 429
            ? 'Rate limit exceeded'
            : 'Service unavailable'
        }), {
          status: ollamaResponse.status === 401 ? 500 : ollamaResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const data = await ollamaResponse.json();

      // Return formatted response
      return new Response(JSON.stringify({
        id: 'chat-' + Date.now(),
        model: body.model || 'llama3.2',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: data.message?.content || 'No response'
          },
          finish_reason: data.done ? 'stop' : 'length'
        }]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal error',
        message: error.message,
        choices: [{
          message: { role: 'assistant', content: 'Sorry, I encountered an error. Please try again!' }
        }]
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
```

---

## 🧪 Testing the Worker

### Test 1: Direct API Call
```bash
curl -X POST https://o87-chat.o87enterprises.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "messages": [
      {"role": "user", "content": "Hello, are you working?"}
    ]
  }'
```

**Expected Response:**
```json
{
  "id": "chat-1234567890",
  "model": "llama3.2",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! Yes, I'm working correctly..."
    },
    "finish_reason": "stop"
  }]
}
```

### Test 2: Browser Console Test
Open your portfolio site and run in console:
```javascript
fetch('https://o87-chat.o87enterprises.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Test from browser' }]
  })
}).then(r => r.json()).then(console.log).catch(console.error);
```

### Test 3: Chat Widget Test
1. Open `https://o87-portfolio.pages.dev/`
2. Click the chat bubble (bottom right)
3. Type a message and send
4. Check browser console (F12) for any errors

---

## 🔍 Troubleshooting

### Issue: "Connection error — make sure the Worker is deployed!"

**Causes:**
1. Worker not deployed
2. CORS not configured
3. Wrong URL in portfolio

**Fix:**
```javascript
// In index.html, verify this line:
const WORKER_URL = 'https://o87-chat.o87enterprises.workers.dev';
```

### Issue: "Invalid API key"

**Causes:**
1. API key expired
2. Key not set as secret
3. Wrong key format

**Fix:**
1. Verify secret is set (not plaintext variable)
2. Test key directly:
   ```bash
   curl https://api.ollama.ai/api/chat \
     -H "Authorization: Bearer YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"llama3.2","messages":[{"role":"user","content":"test"}]}'
   ```

### Issue: Truegle 404

**Already Fixed:** Updated to use `placeholder.html`

**To use full app later:**
1. Rebuild Truegle with correct base path
2. Update modal link in index.html
3. Ensure assets load correctly

---

## 📋 Checklist

- [ ] Convert `OLLAMA_API_KEY` from plaintext to secret
- [ ] Update worker code with improved version
- [ ] Test worker with curl command
- [ ] Test chat widget in portfolio
- [ ] Verify Truegle placeholder loads
- [ ] Check browser console for errors

---

## 🔗 Quick Links

| Resource | URL |
|----------|-----|
| Worker Dashboard | https://dash.cloudflare.com/workers |
| o87-chat Worker | https://dash.cloudflare.com/workers/o87-chat |
| o87-portfolio Pages | https://dash.cloudflare.com/pages/o87-portfolio |
| Live Site | https://o87-portfolio.pages.dev/ |
| Worker API | https://o87-chat.o87enterprises.workers.dev |

---

Last Updated: March 22, 2026
