# Ollama API 530 Error - Immediate Fix

## Problem
Your worker returns 530 because it can't reach the Ollama API service.

## Quick Diagnosis

### Test 1: Check if API Key Works
```bash
# Replace YOUR_KEY with your actual key
curl -X POST https://api.ollama.ai/api/chat \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.2","messages":[{"role":"user","content":"test"}]}'
```

**If 401:** Key is invalid - get new key
**If 530/502:** Service is down
**If 200:** Service works - problem is worker config

### Test 2: Check Worker Logs
1. Go to: **Cloudflare Dashboard → Workers & Pages → o87-chat**
2. Click **"Observability"** → **"Logs"**
3. Send a test request
4. Look for error messages

---

## Solution Options

### Option 1: Use Cloudflare Workers AI (Recommended ⭐)

Instead of external Ollama, use Cloudflare's built-in AI:

**In Cloudflare Dashboard:**
1. Go to: **Workers & Pages → o87-chat → Bindings**
2. Click **"Add binding"** → **"AI"**
3. **Variable name:** `AI`
4. Click **"Save"**

**Update worker code:**
```javascript
export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      
      // Use Cloudflare Workers AI
      const response = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
        messages: body.messages || []
      });

      return new Response(JSON.stringify({
        choices: [{
          message: { role: 'assistant', content: response.response }
        }]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message,
        choices: [{
          message: { role: 'assistant', content: 'Sorry, error occurred.' }
        }]
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
```

**Benefits:**
- ✅ No external API needed
- ✅ No API keys to manage
- ✅ Faster (runs on Cloudflare)
- ✅ Free tier: 10,000 neurons/day

---

### Option 2: Fix Ollama Configuration

If you want to keep using Ollama:

**Step 1: Verify API Key**
1. Log into your Ollama dashboard
2. Check if key is still active
3. Regenerate if needed

**Step 2: Add Secret in Cloudflare**
1. Go to: **Workers & Pages → o87-chat → Variables and Secrets**
2. Click **"Add variable"** → **"Secret"**
3. **Name:** `OLLAMA_API_KEY`
4. **Value:** Your actual Ollama API key
5. Click **"Deploy"**

**Step 3: Add Base URL**
1. Same section
2. **Name:** `OLLAMA_BASE_URL`
3. **Value:** `https://api.ollama.ai` (or your provider's URL)
4. Click **"Deploy"**

---

### Option 3: Use Alternative AI Provider

**Groq (Fast, Free Tier):**
1. Get API key: https://console.groq.com
2. Add secret: `GROQ_API_KEY`
3. Update worker to use Groq API

**OpenRouter (Multiple Models):**
1. Get API key: https://openrouter.ai
2. Add secret: `OPENROUTER_KEY`
3. Use their API endpoint

---

## Deploy Updated Worker

**Option A: Quick Edit in Dashboard**
1. Go to: **Workers & Pages → o87-chat → Quick edit**
2. Replace all code
3. Click **"Deploy"**

**Option B: Use Wrangler CLI**
```bash
cd /Volumes/Duck_Drive/software-dev/o87Dev/o87-portfolio

# Deploy the fixed worker
wrangler deploy worker.js --name o87-chat
```

---

## Test After Fix

```bash
curl -X POST https://o87-chat.o87enterprises.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello!"}]}'
```

**Expected:** Response with message content
**Still 530:** Try Option 1 (Cloudflare Workers AI)

---

## Recommended: Switch to Cloudflare Workers AI

It's the most reliable option:

**Pros:**
- No external dependencies
- No API keys to manage
- Free for reasonable usage
- Fast response times

**Cons:**
- Different model (Llama 3.2 3B instead of Ollama's models)
- Slightly different API format

---

Last Updated: March 22, 2026
