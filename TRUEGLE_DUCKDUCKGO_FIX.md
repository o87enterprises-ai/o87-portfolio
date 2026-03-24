# Truegle Backend - DuckDuckGo Search Fix

## Problem
- Google Programmable Search Engine no longer allows "Search the entire web" for new engines
- Google API key authentication is failing (401 error)
- DuckDuckGo is enabled but needs proper implementation

## Solution: Use Free Search Providers

### Option 1: DuckDuckGo HTML Scraper (Recommended)

Create this file in your backend: `src/services/search/duckduckgo.js`

```javascript
export async function searchDuckDuckGo(query, page = 1, perPage = 10) {
  try {
    // Use DuckDuckGo HTML interface (no API key needed)
    const ddgUrl = new URL('https://html.duckduckgo.com/html/');
    
    const response = await fetch(ddgUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: new URLSearchParams({
        q: query,
        p: page
      })
    });

    if (!response.ok) {
      throw new Error('DuckDuckGo request failed');
    }

    const html = await response.text();
    
    // Parse HTML results
    const results = parseDuckDuckGoHTML(html, perPage);
    
    return {
      success: true,
      results,
      resultCount: results.length,
      source: 'DuckDuckGo'
    };
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

function parseDuckDuckGoHTML(html, limit) {
  const results = [];
  const resultRegex = /<a class="result__a" href="([^"]+)">([^<]+)<\/a>/g;
  const snippetRegex = /<a class="result__snippet" href="[^"]+">([^<]+)<\/a>/g;
  
  let match;
  let count = 0;
  
  while ((match = resultRegex.exec(html)) !== null && count < limit) {
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
      snippet: 'Click to view result',
      source: 'DuckDuckGo',
      category: 'web',
      bias: 'neutral',
      timestamp: new Date().toISOString()
    });
    
    count++;
  }
  
  return results;
}
```

### Option 2: Use Multiple Free Providers

Create: `src/services/search/multi-provider.js`

```javascript
import { searchDuckDuckGo } from './duckduckgo.js';

export async function searchMultiProvider(query, options = {}) {
  const providers = [
    { name: 'DuckDuckGo', fn: searchDuckDuckGo, enabled: process.env.DDG_ENABLED === 'true' },
    // Add more providers here as you get API keys
  ];

  const enabledProviders = providers.filter(p => p.enabled);
  
  if (enabledProviders.length === 0) {
    throw new Error('No search providers configured');
  }

  // Try each provider until one succeeds
  for (const provider of enabledProviders) {
    try {
      console.log(`Trying provider: ${provider.name}`);
      const result = await provider.fn(query, options.page, options.perPage);
      
      if (result.success && result.results.length > 0) {
        return {
          ...result,
          provider: provider.name
        };
      }
    } catch (error) {
      console.error(`${provider.name} failed:`, error.message);
      continue;
    }
  }

  throw new Error('All search providers failed');
}
```

### Option 3: Update Main Search Route

Update your search route: `src/routes/search.js`

```javascript
import express from 'express';
import { searchMultiProvider } from '../services/search/multi-provider.js';

const router = express.Router();

router.post('/api/search', async (req, res) => {
  try {
    const { query, page = 1, perPage = 10, category = 'all' } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    console.log('Search request:', { query, page, perPage, category });

    // Use multi-provider search
    const searchResult = await searchMultiProvider(query, { page, perPage });

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
      resultCount: searchResult.resultCount,
      provider: searchResult.provider,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      results: [],
      debug: {
        message: 'All search providers failed',
        providers: {
          duckduckgo: process.env.DDG_ENABLED || 'false',
          google: process.env.GOOGLE_API_KEY ? 'configured' : 'not configured'
        }
      }
    });
  }
});

export default router;
```

### Option 4: Add Debug Endpoint

Create: `src/routes/debug.js`

```javascript
import express from 'express';

const router = express.Router();

router.get('/api/debug/config', (req, res) => {
  res.json({
    search_providers: {
      duckduckgo: {
        enabled: process.env.DDG_ENABLED === 'true',
        status: 'ready'
      },
      google: {
        enabled: !!(process.env.GOOGLE_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID),
        api_key_configured: !!process.env.GOOGLE_API_KEY,
        search_engine_id_configured: !!process.env.GOOGLE_SEARCH_ENGINE_ID
      }
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

export default router;
```

Then add to your main app:

```javascript
import debugRoutes from './routes/debug.js';
app.use('/api', debugRoutes);
```

---

## Deployment Steps

### 1. Add Files to Backend

Upload these files to your Railway backend project:
- `src/services/search/duckduckgo.js`
- `src/services/search/multi-provider.js`
- Update `src/routes/search.js`
- Add `src/routes/debug.js`

### 2. Update Main App File

In your main `src/app.js` or `src/index.js`:

```javascript
import searchRoutes from './routes/search.js';
import debugRoutes from './routes/debug.js';

app.use('/api', searchRoutes);
app.use('/api', debugRoutes);
```

### 3. Verify Railway Variables

Make sure these are set in Railway:
```
DDG_ENABLED=true
SEARCH_PROVIDER=duckduckgo
NODE_ENV=production
```

### 4. Redeploy to Railway

1. Commit and push changes to your backend repo
2. Railway will auto-deploy
3. Wait ~1 minute for deployment to complete

### 5. Test

Visit: https://o87-portfolio.pages.dev/apps/truegle/test-backend.html

Click "Test Search Endpoint" - you should now see results!

---

## Alternative: Quick Mock Data (For Testing Only)

If you just want to test the UI while fixing the backend:

```javascript
// Add this to your search route as a fallback
function getMockResults(query) {
  return [
    {
      id: 'mock-1',
      title: `Result 1 for "${query}"`,
      url: 'https://example.com/result-1',
      snippet: 'This is a mock search result for testing purposes.',
      source: 'Mock',
      category: 'web',
      bias: 'neutral'
    },
    {
      id: 'mock-2',
      title: `Result 2 for "${query}"`,
      url: 'https://example.com/result-2',
      snippet: 'Another mock result to test the UI.',
      source: 'Mock',
      category: 'web',
      bias: 'neutral'
    }
  ];
}
```

---

## Troubleshooting

### DuckDuckGo returns no results
- DuckDuckGo HTML scraping can be rate-limited
- Add delays between requests
- Consider using a proxy service

### Still getting empty results
1. Check Railway logs for errors
2. Test debug endpoint: `/api/debug/config`
3. Verify `DDG_ENABLED=true` is set

### Need more reliable search
Consider these paid alternatives:
- **Bing Search API**: $15/month for 1000 queries
- **Google Custom Search**: $5 per 1000 queries (after 100 free/day)
- **Serper API**: Free tier available, uses Google

---

Last Updated: March 24, 2026
