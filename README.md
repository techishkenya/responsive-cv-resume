# RESPONSIVE CV/RESUME

A modern, AI-powered interactive resume/CV website where visitors can chat with an AI that knows everything about you.

## ✨ Features

- **AI Chatbot** - Visitors ask questions about your background, skills, and experience
- **Rich Content Display** - Projects, Education, and Articles are displayed in beautiful **interactive carousels** (sliders)
- **Smart Link Previews** - External links automatically expand into rich preview cards
- **Beautiful UI** - Dark theme with glassmorphism, animations, and responsive design
- **Admin Dashboard** - Edit all your information without touching code
- **Secure by Design** - API keys encrypted, personal data protected, no leaks possible
- **Free to Run** - Uses free tiers of Gemini API and Vercel

## 🔐 Security

This project is **completely leak-proof**:

| Data Type | Protection |
|-----------|------------|
| API Keys | Encrypted with AES-256, stored server-side only |
| Passwords | Never in code, set via dashboard or environment |
| Personal Data | Gitignored, never committed to repository |
| System Prompts | Server-side only, invisible to visitors |
| Rate Limits | Built-in protection against abuse (100 req/day/IP) |

**Dashboard is hidden** - No visible links on public site. Only you know it exists at `/dashboard`.

## 🚀 Quick Start in 5 Minutes

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd dickson-cv
npm install
```

### 2. Setup Data Files

```bash
# Create local data files from templates
cp data/profile.example.json data/profile.json
cp data/botConfig.example.json data/botConfig.json
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Configure Your Bot

1. Visit `http://localhost:3000/dashboard` in your browser.
2. Login with default password: `admin123`
3. Go to **Settings** → Paste your [Gemini API Key](https://aistudio.google.com/app/apikey).
4. Go to **Profile** → Fill in your bio, skills, and experience.
5. Go to **Bot Settings** → Customize the AI's greeting and personality.

Done! Your CV chatbot is live locally. 🎉

## 🌍 Deployment (Vercel)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Initial deploy"
git push origin main
```

### Step 2: Import to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **"Add New Project"** → Import your GitHub repo.
3. Click **Deploy** (it will fail the first time - that's OK!).

### Step 3: Set Environment Variables (Required)
Go to your project → **Settings** → **Environment Variables** and add:

| Variable | Value | Required |
|----------|-------|----------|
| `DASHBOARD_PASSWORD` | Your secure admin password | ✅ Yes |
| `JWT_SECRET` | Random string (run `openssl rand -base64 32`) | ✅ Yes |
| `GEMINI_API_KEY` | Your [Gemini API Key](https://aistudio.google.com/app/apikey) | ✅ Yes |

⚠️ **IMPORTANT**: Without these, the dashboard login will be disabled for security.

### Step 4. Enable Live Editing (Required for Dashboard)

By default, Vercel is **read-only**. To save profile changes on the live site, you need a database:

1. In your Vercel project, click the **Storage** tab.
2. Click **"Create New"** or browse **Marketplace Database Providers**.
3. Select **"Upstash for Redis"** from the list.
   *   *(Do NOT select Vector, QStash, or Search - just "Upstash for Redis")*
4. Click **"Add Integration"** (Free Tier is default).
5. Select your project → **Continue** → **Connect**.
6. Vercel will automatically add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to your project.

### Step 5: Redeploy
1. Go to **Deployments** tab.
2. Click the `...` menu on the latest deployment → **Redeploy**.
3. Wait ~1 minute for the build to complete.

**Done!** Your live dashboard now saves instantly. 🚀

> 💡 **Tip**: If you skip Step 4, you can still use the site but must edit `data/profile.json` locally and push to GitHub to update content.

## 📁 Project Structure

```
├── app/
│   ├── page.js              # 🌐 Public chatbot interface
│   ├── components/          # 🧩 Reusable UI components (Carousel, etc.)
│   ├── login/               # 🔐 Dashboard login
│   ├── dashboard/           # 📊 Admin pages
│   └── api/                 # 🔌 All API routes
├── lib/
│   ├── utils.js             # 🔧 Shared utilities
│   ├── logger.js            # 📋 Error logging
│   └── secrets.js           # 🔐 API key encryption
├── data/
│   ├── profile.json         # 👤 Your CV data (gitignored)
│   ├── botConfig.json       # 🤖 Bot settings (gitignored)
└── public/                  # Static assets
```

## 🎛️ Dashboard Pages

| Page | Purpose |
|------|---------|
| Overview | Stats and quick actions |
| Profile | Name, bio, avatar, social links |
| Experience | Work history with achievements |
| Education | Degrees and certifications |
| Projects | Portfolio items (Displayed in Carousel) |
| Skills | Technical skills with proficiency |
| Bot Settings | AI personality and quick replies |
| Integrations | Spotify, Twitter, Blog connections |
| Settings | API key management |
| Error Logs | Debug issues |

## 🆓 Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| Google Gemini | 15 requests/minute (Global) |
| Vercel | 100GB bandwidth/month |
| Total Cost | **$0** |

⚠️ **Note on Scalability:** The free tier supports ~100-200 daily active chatters. If you expect high traffic (e.g., 3000+ visitors launching the site simultaneously), you should enable **Pay-As-You-Go** billing in Google Cloud Console to increase the rate limit to 1000+ RPM. The cost is extremely low (~$0.35/million tokens).

## 🛡️ Security Best Practices

1. **Change the default password** immediately in `.env` or Vercel vars.
2. **Generate a proper JWT_SECRET** for production (e.g. `openssl rand -base64 32`).
3. **Never share** your dashboard URL.
4. **Check Error Logs** periodically for issues.

## 📝 License

MIT - Use freely for your own CV!

## 🫡 Accreditation

*   **BUILT BY:** [@DicksonOtieno](https://github.com/techishkenya/)
*   **POWERED BY:** ANTIGRAVITY

---

Built with ❤️ by @DicksonOtieno using Antigravity

