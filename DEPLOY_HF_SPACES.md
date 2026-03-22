# Deployment Guide: Hugging Face Spaces

## Quick Deploy

### Option 1: Git Push to HF Spaces (Recommended)

#### Step 1: Create HF Space (if not already created)
1. Go to https://huggingface.co/spaces
2. Click **"Create new Space"**
3. **Space name:** `o87-portfolio` (or your preferred name)
4. **License:** MIT
5. **SDK:** Select **"Static"**
6. Click **"Create Space"**

#### Step 2: Add HF as Git Remote
```bash
cd /Volumes/Duck_Drive/software-dev/o87Dev/o87-portfolio

# Add Hugging Face as a remote (replace YOUR_USERNAME with your HF username)
git remote add huggingface https://huggingface.co/spaces/YOUR_USERNAME/o87-portfolio

# Or if you already have a remote, update it:
git remote set-url huggingface https://huggingface.co/spaces/YOUR_USERNAME/o87-portfolio
```

#### Step 3: Authenticate with HF
```bash
# Install huggingface-cli if not already installed
pip install huggingface_hub

# Login to Hugging Face
huggingface-cli login
```

You'll need your HF token from: https://huggingface.co/settings/tokens

#### Step 4: Push to HF Spaces
```bash
# Commit your changes first
git add .
git commit -m "Update: New hero section, Three.js enhancements, API fixes"

# Push to Hugging Face Spaces
git push huggingface main
```

---

### Option 2: Manual Upload via HF Website

1. Go to your Space: `https://huggingface.co/spaces/YOUR_USERNAME/o87-portfolio`
2. Click **"Files"** tab
3. Click **"Add file"** → **"Upload files"**
4. Upload these files:
   - `index.html`
   - `Gemini_Generated_Image_riqg8xriqg8xriqg.png`
   - `apps/` folder (all subfolders)
   - `brands/` folder
   - `README.md` (with SDK config)
5. Click **"Commit changes to main"**

---

### Option 3: Using huggingface-cli

```bash
# Install if not already installed
pip install huggingface_hub

# Login
huggingface-cli login

# Upload entire directory
huggingface-cli upload YOUR_USERNAME/o87-portfolio . "." --repo-type=space
```

---

## Required Files for HF Spaces

Make sure these files are in your Space:

```
o87-portfolio/
├── index.html              ✅ Required
├── README.md               ✅ Required (with sdk: static)
├── Gemini_Generated_Image_riqg8xriqg8xriqg.png  ✅ Required
├── apps/                   ✅ Required
│   ├── truegle/
│   ├── munch/
│   └── ...
├── brands/                 ✅ Required
└── .gitignore              ✅ Recommended
```

---

## Post-Deployment Checklist

After deploying to HF Spaces:

- [ ] Verify site loads: `https://YOUR_USERNAME-o87-portfolio.hf.space`
- [ ] Test Three.js scene (should see animated planet)
- [ ] Test chat widget (may need API key update)
- [ ] Test Truegle placeholder loads
- [ ] Check browser console for errors

---

## Troubleshooting

### Issue: "Failed to connect to Git remote"

**Fix:**
```bash
# Remove old remote
git remote remove huggingface

# Add again with correct URL
git remote add huggingface https://huggingface.co/spaces/YOUR_USERNAME/o87-portfolio
```

### Issue: "Authentication failed"

**Fix:**
```bash
# Clear cached credentials
git credential-osxkeychain erase

# Re-login
huggingface-cli login
```

### Issue: "Space not building"

**Fix:**
1. Check `README.md` has `sdk: static` at the top
2. Go to Space → Settings → Factory rebuild
3. Check "Logs" tab for build errors

### Issue: "404 Not Found"

**Fix:**
- Wait 2-3 minutes for build to complete
- Check file paths are correct (case-sensitive!)
- Verify `index.html` is in the root directory

---

## Update Existing Space

To push updates after initial deployment:

```bash
# Make your changes, then:
git add .
git commit -m "Your update message"
git push huggingface main
```

HF Spaces will automatically rebuild (~30 seconds).

---

## Environment Variables (for Chat API)

HF Spaces Static doesn't support server-side secrets. For the chat widget to work:

### Option A: Use Cloudflare Worker (Current Setup)
Your chat already uses a Cloudflare Worker:
```javascript
const WORKER_URL = 'https://o87-chat.o87enterprises.workers.dev';
```
This works fine on HF Spaces - no changes needed!

### Option B: Direct API Call (Not Recommended)
Would expose your API key in client code.

---

## Quick Commands Reference

| Action | Command |
|--------|---------|
| Login to HF | `huggingface-cli login` |
| Add remote | `git remote add huggingface https://huggingface.co/spaces/USER/REPO` |
| Push to HF | `git push huggingface main` |
| Upload files | `huggingface-cli upload USER/REPO . "." --repo-type=space` |
| Check status | Visit `https://huggingface.co/spaces/USER/REPO` |

---

## Your HF Space URL

After deployment, your site will be at:
```
https://YOUR_USERNAME-o87-portfolio.hf.space
```

Or with custom domain (configured in Space settings).

---

Last Updated: March 22, 2026
