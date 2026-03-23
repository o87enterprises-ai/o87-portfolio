export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST only' }), { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      
      if (!body.messages || !Array.isArray(body.messages)) {
        return new Response(JSON.stringify({
          error: 'Invalid request',
          required: { messages: 'array of {role, content} objects' }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Try multiple possible endpoints
      const apiKey = env.OLLAMA_API_KEY;
      
      if (!apiKey) {
        return new Response(JSON.stringify({
          error: 'Configuration error',
          message: 'OLLAMA_API_KEY secret not set',
          hint: 'Add secret in Cloudflare Dashboard → o87-chat → Variables and Secrets'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // List of possible Ollama endpoints to try
      const endpoints = [
        'https://api.ollama.ai',
        'https://ollama-api.onrender.com',
        'https://ollama.hf.space',
      ];

      let lastError = null;
      
      // Try each endpoint
      for (const baseUrl of endpoints) {
        try {
          console.log(`Trying endpoint: ${baseUrl}`);
          
          const response = await fetch(baseUrl + '/api/chat', {
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

          console.log(`Response from ${baseUrl}: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            return new Response(JSON.stringify({
              id: 'chat-' + Date.now(),
              model: body.model || 'llama3.2',
              choices: [{
                message: {
                  role: 'assistant',
                  content: data.message?.content || 'Response received'
                }
              }]
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          lastError = { status: response.status, text: await response.text() };
        } catch (e) {
          console.log(`Failed ${baseUrl}: ${e.message}`);
          lastError = { status: 'network', text: e.message };
        }
      }

      // All endpoints failed
      return new Response(JSON.stringify({
        error: 'All Ollama endpoints unreachable',
        status: 530,
        message: 'AI service is unavailable. Please try again later.',
        debug: lastError,
        hint: 'Check if your Ollama API key is valid and the service is running'
      }), {
        status: 530,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
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
