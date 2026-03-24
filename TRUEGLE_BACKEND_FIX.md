# Truegle Backend Fix - Google Search Integration

## Issue
The backend is returning empty results even though `GOOGLE_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID` are configured.

## Solution

### Option 1: Quick Fix - Update Backend Search Handler

Create or update this file in your Railway backend:

**File: `src/routes/search.js`** (or wherever your search route is)

```javascript
import express from 'express';
const router = express.Router();

router.post('/api/search', async (req, res) => {
  try {
    const { query, page = 1, perPage = 10 } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    // Check if Google API credentials are configured
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      console.error('Google API credentials not configured');
      return res.status(500).json({
        success: false,
        error: 'Search provider not configured'
      });
    }

    // Call Google Custom Search API
    const googleUrl = new URL('https://www.googleapis.com/customsearch/v1');
    googleUrl.searchParams.append('key', apiKey);
    googleUrl.searchParams.append('cx', searchEngineId);
    googleUrl.searchParams.append('q', query);
    googleUrl.searchParams.append('start', ((page - 1) * perPage) + 1);
    googleUrl.searchParams.append('num', Math.min(perPage, 10));

    const googleResponse = await fetch(googleUrl.toString());
    
    if (!googleResponse.ok) {
      const errorData = await googleResponse.json();
      console.error('Google API error:', errorData);
      throw new Error(errorData.error?.message || 'Google API request failed');
    }

    const searchData = await googleResponse.json();

    // Transform Google results to Truegle format
    const results = (searchData.items || []).map((item, index) => ({
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

    res.json({
      success: true,
      query,
      filters: {
        category: 'all',
        dateRange: 'any',
        bias: 'all',
        safeSearch: true,
        page,
        perPage
      },
      results,
      resultCount: results.length,
      totalResults: searchData.searchInformation?.totalResults || results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      results: []
    });
  }
});

export default router;
```

### Option 2: Environment Variable Check

Add this debug endpoint to verify your credentials:

**File: `src/routes/debug.js`**

```javascript
import express from 'express';
const router = express.Router();

router.get('/api/debug/vars', (req, res) => {
  res.json({
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? '***' + process.env.GOOGLE_API_KEY.slice(-4) : 'NOT SET',
    GOOGLE_SEARCH_ENGINE_ID: process.env.GOOGLE_SEARCH_ENGINE_ID ? '***' + process.env.GOOGLE_SEARCH_ENGINE_ID.slice(-4) : 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'development'
  });
});

export default router;
```

Then visit: `https://joyful-stillness-production-788b.up.railway.app/api/debug/vars`

### Option 3: Test Google API Directly

Test your Google Custom Search credentials:

```bash
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_SEARCH_ENGINE_ID&q=test"
```

If this returns results, your credentials are working.

### Option 4: Railway Deployment Steps

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your project**: `joyful-stillness-production-788b`
3. **Click Deployments** tab
4. **Redeploy** to ensure latest code is running
5. **Check Logs** for any errors

### Option 5: Check Railway Logs

In Railway dashboard:
1. Click on your service
2. Click **Deployments**
3. Click on the latest deployment
4. Click **View Logs**
5. Look for errors related to Google API

---

## Quick Test

After deploying the fix, test with:

```bash
curl -X POST https://joyful-stillness-production-788b.up.railway.app/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"news","page":1,"perPage":10}'
```

Expected response should have `resultCount > 0` and actual results in the `results` array.

---

## If Still Not Working

1. **Verify Google CSE is configured:**
   - Go to https://programmablesearchengine.google.com/
   - Make sure your search engine is active
   - Check that "Search the entire web" is enabled

2. **Check API quota:**
   - Google gives 100 free queries/day
   - Check usage at https://console.cloud.google.com/apis/api/customsearch.googleapis.com/usage

3. **Enable Custom Search API:**
   - Go to https://console.cloud.google.com/apis/library/customsearch.googleapis.com
   - Click "Enable" if not already enabled

---

Last Updated: March 24, 2026
