/**
 * Truegle Backend - Quick Search Fix
 * 
 * Copy this entire file to your Railway backend as: src/routes/search.js
 * 
 * This provides:
 * 1. Mock results for testing (always works)
 * 2. DuckDuckGo integration (no API key needed)
 * 3. Google Custom Search (when properly configured)
 */

import express from 'express';

const router = express.Router();

// Mock results fallback
function getMockResults(query) {
  const mockData = [
    {
      id: `result-1`,
      title: `${query} - Latest News and Updates`,
      url: `https://example.com/news/${query.replace(/\s+/g, '-')}`,
      snippet: `Stay informed with the latest news and updates about ${query}. Comprehensive coverage and analysis.`,
      source: 'Example News',
      category: 'news',
      bias: 'center',
      timestamp: new Date().toISOString()
    },
    {
      id: `result-2`,
      title: `Understanding ${query}: A Complete Guide`,
      url: `https://example.com/guide/${query.replace(/\s+/g, '-')}`,
      snippet: `Everything you need to know about ${query}. Expert insights, tips, and comprehensive information.`,
      source: 'Example Guide',
      category: 'education',
      bias: 'neutral',
      timestamp: new Date().toISOString()
    },
    {
      id: `result-3`,
      title: `${query} - Wikipedia`,
      url: `https://en.wikipedia.org/wiki/${query.replace(/\s+/g, '_')}`,
      snippet: `${query} - Wikipedia entry with detailed information, history, and references.`,
      source: 'Wikipedia',
      category: 'reference',
      bias: 'neutral',
      timestamp: new Date().toISOString()
    },
    {
      id: `result-4`,
      title: `Top 10 Facts About ${query}`,
      url: `https://example.com/facts/${query.replace(/\s+/g, '-')}`,
      snippet: `Discover interesting facts and trivia about ${query}. You won't believe number 7!`,
      source: 'Fact Central',
      category: 'entertainment',
      bias: 'neutral',
      timestamp: new Date().toISOString()
    },
    {
      id: `result-5`,
      title: `${query} Research and Studies`,
      url: `https://example.com/research/${query.replace(/\s+/g, '-')}`,
      snippet: `Academic research and scientific studies related to ${query}. Peer-reviewed articles.`,
      source: 'Research Gate',
      category: 'academic',
      bias: 'neutral',
      timestamp: new Date().toISOString()
    }
  ];
  
  return mockData;
}

// DuckDuckGo search (no API key needed)
async function searchDuckDuckGo(query, page = 1) {
  try {
    const ddgUrl = 'https://html.duckduckgo.com/html/';
    
    const response = await fetch(ddgUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; TruegleBot/1.0)'
      },
      body: new URLSearchParams({ q: query })
    });

    if (!response.ok) {
      throw new Error('DuckDuckGo request failed');
    }

    const html = await response.text();
    const results = parseDuckDuckGoHTML(html);
    
    return { success: true, results, source: 'DuckDuckGo' };
  } catch (error) {
    console.error('DuckDuckGo error:', error.message);
    return { success: false, results: [], error: error.message };
  }
}

// Parse DuckDuckGo HTML results
function parseDuckDuckGoHTML(html) {
  const results = [];
  
  // Extract result links
  const linkRegex = /<a class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  const snippetRegex = /<a class="result__snippet"[^>]*>([^<]+)<\/a>/gi;
  
  let match;
  let count = 0;
  
  while ((match = linkRegex.exec(html)) !== null && count < 10) {
    const url = match[1];
    const title = match[2];
    
    // Skip DuckDuckGo internal links
    if (url.includes('duckduckgo.com') && !url.includes('html')) {
      continue;
    }
    
    results.push({
      id: `ddg-${count}`,
      title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
      url: url,
      snippet: 'Search result from DuckDuckGo',
      source: 'DuckDuckGo',
      category: 'web',
      bias: 'neutral',
      timestamp: new Date().toISOString()
    });
    
    count++;
  }
  
  return results;
}

// Google Custom Search
async function searchGoogle(query) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!apiKey || !searchEngineId) {
    return { success: false, results: [], error: 'Google API not configured' };
  }
  
  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', apiKey);
    url.searchParams.append('cx', searchEngineId);
    url.searchParams.append('q', query);
    url.searchParams.append('num', 10);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Google API request failed');
    }
    
    const data = await response.json();
    const results = (data.items || []).map((item, index) => ({
      id: `google-${index}`,
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      displayUrl: item.displayLink,
      source: 'Google',
      category: 'web',
      bias: 'neutral',
      timestamp: new Date().toISOString()
    }));
    
    return { success: true, results, source: 'Google' };
  } catch (error) {
    console.error('Google search error:', error.message);
    return { success: false, results: [], error: error.message };
  }
}

// Main search endpoint
router.post('/api/search', async (req, res) => {
  try {
    const { query, page = 1, perPage = 10, category = 'all' } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    console.log('🔍 Search request:', { query, page, perPage });

    // Determine which provider to use
    const provider = process.env.SEARCH_PROVIDER || 'mock';
    let searchResult;

    if (provider === 'duckduckgo' && process.env.DDG_ENABLED === 'true') {
      searchResult = await searchDuckDuckGo(query, page);
      
      // Fallback to mock if DuckDuckGo fails
      if (!searchResult.success || searchResult.results.length === 0) {
        console.log('DuckDuckGo failed, using mock results');
        searchResult = { success: true, results: getMockResults(query), source: 'Mock' };
      }
    } else if (provider === 'google') {
      searchResult = await searchGoogle(query);
      
      // Fallback to mock if Google fails
      if (!searchResult.success || searchResult.results.length === 0) {
        console.log('Google failed, using mock results');
        searchResult = { success: true, results: getMockResults(query), source: 'Mock' };
      }
    } else {
      // Default to mock results
      searchResult = { success: true, results: getMockResults(query), source: 'Mock' };
    }

    res.json({
      success: true,
      query,
      filters: {
        category,
        dateRange: 'any',
        bias: 'all',
        safeSearch: true,
        page,
        perPage
      },
      results: searchResult.results,
      resultCount: searchResult.results.length,
      provider: searchResult.source,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error);
    
    // Always return mock results as fallback
    const { query } = req.body;
    const mockResults = getMockResults(query || 'search');
    
    res.json({
      success: true,
      query: query || 'search',
      filters: {
        category: 'all',
        dateRange: 'any',
        bias: 'all',
        safeSearch: true,
        page: 1,
        perPage: 10
      },
      results: mockResults,
      resultCount: mockResults.length,
      provider: 'Mock (Fallback)',
      timestamp: new Date().toISOString(),
      debug: {
        original_error: error.message
      }
    });
  }
});

// Debug endpoint to check configuration
router.get('/api/search/debug', (req, res) => {
  res.json({
    providers: {
      mock: { enabled: true, status: 'ready' },
      duckduckgo: { 
        enabled: process.env.DDG_ENABLED === 'true',
        status: process.env.DDG_ENABLED === 'true' ? 'ready' : 'disabled'
      },
      google: {
        enabled: !!(process.env.GOOGLE_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID),
        api_key_configured: !!process.env.GOOGLE_API_KEY,
        search_engine_id_configured: !!process.env.GOOGLE_SEARCH_ENGINE_ID
      }
    },
    current_provider: process.env.SEARCH_PROVIDER || 'mock',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

export default router;
