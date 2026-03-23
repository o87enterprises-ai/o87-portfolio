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
      return new Response('POST only', { status: 405, headers: corsHeaders });
    }

    const apiKey = env.OLLAMA_API_KEY;
    const baseUrl = env.OLLAMA_BASE_URL || 'https://api.ollama.ai';

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'OLLAMA_API_KEY secret not set',
        hint: 'Add it in Variables and Secrets'
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    try {
      const body = await request.json();
      
      const response = await fetch(baseUrl + '/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: body.model || 'llama3.2',
          messages: body.messages || [],
          stream: false
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      return new Response(JSON.stringify({
        choices: [{
          message: { role: 'assistant', content: data.message?.content || 'Hello!' }
        }]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message,
        hint: 'Check if Ollama API key is valid and service is running'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
  }
};
