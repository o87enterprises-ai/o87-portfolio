#!/bin/bash

# o87 Cloudflare Worker Deployment Script
# This script deploys the AI chat worker to Cloudflare

set -e

echo "╔════════════════════════════════════════════╗"
echo "║     o87 Cloudflare Worker Deployment      ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if logged in
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  Not logged in to Cloudflare. Opening browser..."
    wrangler login
fi

# Deploy the worker
echo ""
echo "🚀 Deploying o87-chat worker..."
wrangler deploy worker.js --name o87-chat --compatibility-date 2024-01-01

echo ""
echo "✅ Worker deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Set your Ollama API key:"
echo "      wrangler secret put OLLAMA_API_KEY --name o87-chat"
echo ""
echo "   2. Set the Ollama base URL:"
echo "      wrangler secret put OLLAMA_BASE_URL --name o87-chat"
echo "      (e.g., https://api.ollama.ai or your self-hosted URL)"
echo ""
echo "   3. Test the worker:"
echo "      curl -X POST https://o87-chat.o87enterprises.workers.dev \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}'"
echo ""
echo "🌐 Worker URL: https://o87-chat.o87enterprises.workers.dev"
echo ""
