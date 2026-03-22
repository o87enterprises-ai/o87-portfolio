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
      // Default to Ollama.ai if not set
      const baseUrl = env.OLLAMA_BASE_URL || 'https://api.ollama.ai';

      if (!apiKey) {
        return new Response(JSON.stringify({
          error: 'Server configuration error',
          message: 'API key not configured. Contact administrator.',
          debug: 'OLLAMA_API_KEY secret is missing'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('Calling Ollama API at:', baseUrl);

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
        }),
        // Add timeout handling
        cf: {
          timeout: 30000
        }
      });

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
