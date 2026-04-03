export default {
  async fetch(request, env) {
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Security headers
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };

    const allHeaders = { ...corsHeaders, ...securityHeaders };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: allHeaders, status: 204 });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed',
        info: 'Send POST requests with JSON body containing "messages" array'
      }), {
        status: 405,
        headers: { ...allHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Rate limiting using Cloudflare KV (if available)
    if (env.RATE_LIMIT_KV) {
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
      const rateLimitKey = `ratelimit:${clientIP}`;
      const currentCount = await env.RATE_LIMIT_KV.get(rateLimitKey);
      const count = currentCount ? parseInt(currentCount) : 0;
      
      // Limit to 20 requests per minute
      if (count >= 20) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retry_after: 60
        }), {
          status: 429,
          headers: { 
            ...allHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        });
      }
      
      // Increment counter with 60-second TTL
      await env.RATE_LIMIT_KV.put(rateLimitKey, String(count + 1), { expirationTtl: 60 });
    }

    try {
      const body = await request.json();

      // Validate request body size and structure
      if (!body || typeof body !== 'object') {
        return new Response(JSON.stringify({
          error: 'Invalid request',
          required: { messages: 'array of {role, content} objects' }
        }), {
          status: 400,
          headers: { ...allHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate messages array
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
          headers: { ...allHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate messages array length (prevent abuse)
      if (body.messages.length > 50) {
        return new Response(JSON.stringify({
          error: 'Request too large',
          message: 'Maximum 50 messages per request',
          limit: 50
        }), {
          status: 413,
          headers: { ...allHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Sanitize message content
      const sanitizedMessages = body.messages.map(msg => {
        if (!msg.role || !msg.content) {
          throw new Error('Each message must have "role" and "content" fields');
        }
        
        // Validate role
        if (!['system', 'user', 'assistant'].includes(msg.role)) {
          throw new Error('Invalid role. Must be: system, user, or assistant');
        }
        
        // Validate content length (prevent abuse)
        if (typeof msg.content !== 'string' || msg.content.length > 10000) {
          throw new Error('Content must be a string under 10,000 characters');
        }
        
        return {
          role: msg.role,
          content: msg.content
        };
      });

      // Validate model
      const allowedModels = ['llama3.2', 'llama3', 'mistral', 'gemma'];
      const model = body.model || 'llama3.2';
      if (!allowedModels.includes(model)) {
        return new Response(JSON.stringify({
          error: 'Invalid model',
          message: `Model must be one of: ${allowedModels.join(', ')}`,
          allowed: allowedModels
        }), {
          status: 400,
          headers: { ...allHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get config from secrets
      const apiKey = env.OLLAMA_API_KEY;
      const baseUrl = env.OLLAMA_BASE_URL || 'https://api.ollama.ai';

      if (!apiKey) {
        return new Response(JSON.stringify({
          error: 'Server configuration error',
          message: 'API key not configured. Contact administrator.',
          debug: 'OLLAMA_API_KEY secret is missing'
        }), {
          status: 500,
          headers: { ...allHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('Calling Ollama API at:', baseUrl);

      // Call Ollama API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const ollamaResponse = await fetch(baseUrl + '/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: sanitizedMessages,
            stream: false
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log('Ollama response status:', ollamaResponse.status);

        if (!ollamaResponse.ok) {
          const errorText = await ollamaResponse.text();
          console.error('Ollama error:', ollamaResponse.status, errorText);

          // Specific error handling
          let userMessage = 'Service unavailable';
          if (ollamaResponse.status === 401) {
            userMessage = 'Invalid API key configuration';
          } else if (ollamaResponse.status === 429) {
            userMessage = 'Rate limit exceeded. Please try again later.';
          } else if (ollamaResponse.status === 530 || ollamaResponse.status === 502 || ollamaResponse.status === 503) {
            userMessage = 'AI service is temporarily unavailable. Please try again in a few moments.';
          } else if (ollamaResponse.status === 500) {
            userMessage = 'AI service encountered an internal error.';
          }

          return new Response(JSON.stringify({
            error: 'AI service error',
            status: ollamaResponse.status,
            message: userMessage,
            hint: ollamaResponse.status === 530 ? 'The Ollama service is unreachable. Check your OLLAMA_BASE_URL configuration.' : undefined
          }), {
            status: ollamaResponse.status === 401 ? 500 : ollamaResponse.status,
            headers: { ...allHeaders, 'Content-Type': 'application/json' }
          });
        }

        const data = await ollamaResponse.json();

        // Return formatted response
        return new Response(JSON.stringify({
          id: 'chat-' + Date.now(),
          model: model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: data.message?.content || 'No response'
            },
            finish_reason: data.done ? 'stop' : 'length'
          }]
        }), {
          headers: { ...allHeaders, 'Content-Type': 'application/json' }
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          return new Response(JSON.stringify({
            error: 'Request timeout',
            message: 'AI service request timed out after 30 seconds',
            choices: [{
              message: { role: 'assistant', content: 'Sorry, the request timed out. Please try again!' }
            }]
          }), {
            status: 504,
            headers: { ...allHeaders, 'Content-Type': 'application/json' }
          });
        }
        throw fetchError; // Re-throw for outer catch
      }

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
        headers: { ...allHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
