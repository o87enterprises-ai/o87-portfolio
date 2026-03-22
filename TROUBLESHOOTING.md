# Troubleshooting Guide

## Issue 1: Truegle 404 Error

### Problem
The Truegle landing page shows a 404 error when accessed through the portfolio modal.

### Root Cause
The Truegle app is a Vite-built React application with hashed asset filenames. The paths in `index.html` reference these hashed files, but they may not load correctly when embedded in an iframe.

### Solution Options

#### Option A: Fix the iframe path (Quick Fix)
In your main `index.html`, update the Truegle modal link:

**Current (line ~560):**
```html
<div class="card-preview" onclick="openModal('Truegle','/apps/truegle/index.html','iframe')">
```

**Change to:**
```html
<div class="card-preview" onclick="openModal('Truegle','./apps/truegle/index.html','iframe')">
```

#### Option B: Rebuild Truegle with correct base path
1. Navigate to the Truegle source directory
2. Update `vite.config.js` to set the correct base path:
   ```js
   export default {
     base: '/apps/truegle/',
     // ... rest of config
   }
   ```
3. Rebuild: `npm run build`

#### Option C: Use absolute URLs for deployment
If deploying to Cloudflare Pages, use absolute paths:
```html
<div class="card-preview" onclick="openModal('Truegle','https://o87-portfolio.pages.dev/apps/truegle/index.html','iframe')">
```

### Testing
Open the browser console and check for:
- 404 errors in the Network tab
- CORS errors when loading the iframe
- Missing asset files (JS/CSS)

---

## Issue 2: AI Chat API Not Working

### Problem
The chat widget doesn't receive responses from the Ollama API via Cloudflare Worker.

### Root Cause
The Cloudflare Worker at `https://o87-chat.o87enterprises.workers.dev` needs to:
1. Have the Ollama API key properly configured
2. Handle CORS correctly
3. Proxy requests to the Ollama API

### Solution

#### Step 1: Verify Cloudflare Worker Configuration

1. **Check if the Worker is deployed:**
   ```bash
   curl https://o87-chat.o87enterprises.workers.dev
   ```
   Should return a 200 OK or 405 (Method Not Allowed for GET)

2. **Verify the secret is set:**
   In Cloudflare Dashboard → Workers → o87-chat → Settings → Variables
   - Ensure `OLLAMA_API_KEY` is set
   - Ensure `OLLAMA_BASE_URL` is set (e.g., `https://api.ollama.com`)

#### Step 2: Deploy/Update the Worker

Create a `worker.js` file:

```javascript
export default {
  async fetch(request, env) {
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }

    try {
      const body = await request.json();
      
      // Forward to Ollama API
      const response = await fetch(env.OLLAMA_BASE_URL + '/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OLLAMA_API_KEY}`
        },
        body: JSON.stringify({
          model: body.model || 'llama3.2',
          messages: body.messages,
          stream: false
        })
      });

      const data = await response.json();

      return new Response(JSON.stringify({
        choices: [{
          message: {
            content: data.message?.content || 'No response generated'
          }
        }]
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: error.message,
        choices: [{
          message: { content: 'Sorry, something went wrong. Try again!' }
        }]
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};
```

#### Step 3: Deploy the Worker

```bash
# Install Wrangler if not already installed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler deploy worker.js --name o87-chat
```

#### Step 4: Set Environment Variables

```bash
# Set the Ollama API key
wrangler secret put OLLAMA_API_KEY

# Set the Ollama base URL
wrangler secret put OLLAMA_BASE_URL
# Example: https://api.ollama.com or your self-hosted instance
```

#### Step 5: Update Portfolio Chat Widget

In your main `index.html`, verify the WORKER_URL is correct:

```javascript
const WORKER_URL = 'https://o87-chat.o87enterprises.workers.dev';
```

### Testing the API

1. **Test the Worker directly:**
   ```bash
   curl -X POST https://o87-chat.o87enterprises.workers.dev \
     -H "Content-Type: application/json" \
     -d '{"model":"llama3.2","messages":[{"role":"user","content":"Hello"}]}'
   ```

2. **Test in browser console:**
   ```javascript
   fetch('https://o87-chat.o87enterprises.workers.dev', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       model: 'llama3.2',
       messages: [{ role: 'user', content: 'Test' }]
     })
   }).then(r => r.json()).then(console.log);
   ```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `NetworkError` | CORS issue | Add CORS headers to Worker |
| `401 Unauthorized` | Invalid API key | Re-set the OLLAMA_API_KEY secret |
| `404 Not Found` | Wrong Worker URL | Check Worker is deployed |
| `500 Internal Error` | Ollama API down | Check OLLAMA_BASE_URL |

---

## Quick Fixes Summary

### For Truegle 404:
```bash
# Option 1: Check if files exist
ls -la /Volumes/Duck_Drive/software-dev/o87Dev/o87-portfolio/apps/truegle/

# Option 2: Rebuild Truegle
cd /Volumes/Duck_Drive/software-dev/o87Dev/o87-portfolio/apps/truegle
npm install && npm run build
```

### For Chat API:
```bash
# Deploy the worker
cd /Volumes/Duck_Drive/software-dev/o87Dev/o87-portfolio
wrangler deploy worker.js --name o87-chat

# Set secrets
wrangler secret put OLLAMA_API_KEY
wrangler secret put OLLAMA_BASE_URL
```

---

## File Structure Reference

```
o87-portfolio/
├── index.html              # Main portfolio (has chat widget)
├── apps/
│   ├── truegle/
│   │   ├── index.html     # Built Vite app
│   │   └── assets/        # Hashed JS/CSS files
│   ├── munch/
│   └── ...
└── worker.js              # Cloudflare Worker (create this)
```

---

Last Updated: March 2026
