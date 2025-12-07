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

1. Push your code to GitHub.
2. Import project into Vercel.
3. Add the following **Environment Variables** in Vercel project settings:

```env
DASHBOARD_PASSWORD = <your-secure-password>
JWT_SECRET         = <random-string-generate-with-openssl>
GEMINI_API_KEY     = <your-gemini-key>
```
4. Deploy!

*(Note: `GEMINI_API_KEY` can be set in Vercel OR managed via the dashboard Settings page after deployment)*

### ☁️ Enabling Live Edits (Required for Dashboard)

By default, Vercel deployments are **Read-Only**. To edit your profile on the live site:

1.  Go to your project dashboard on Vercel.
2.  Click the **Storage** tab.
3.  Click **Create Database** → Select **KV** (Redis).
4.  Click **Create** → **Connect** (Accept defaults).
5.  Wait 1 minute, then **Redeploy** (Deployment tab → Redeploy).

Now your Dashboard will save changes instantly! 🚀

*(If you skip this, you must edit files locally and push to GitHub to update content.)*

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

