# 🚀 Setup Guide - Interactive CV Chatbot

This guide explains how to set up your own instance of this project.

**This codebase is designed for individual deployment** - each person gets their own site with their own data. Nothing is shared between users.

---

## 📋 Table of Contents

1. [How Security Works](#-how-security-works)
2. [Quick Start](#-quick-start)
3. [Detailed Setup](#-detailed-setup)
4. [Deployment](#-deployment)
5. [Customization](#-customization)
6. [Troubleshooting](#-troubleshooting)

---

## 🔐 How Security Works

This project is designed so that **different people can use it independently** without any data leaking:

### What's NEVER Committed to Git

| Item | Location | Why It's Safe |
|------|----------|---------------|
| API Keys | `.env.local` | Gitignored - stays on your machine/server only |
| Passwords | `.env.local` | Gitignored - you set your own |
| Personal Data | `data/profile.json` | Gitignored - your CV data stays private |
| Bot Settings | `data/botConfig.json` | Gitignored - your bot config stays private |

### What IS Committed (Safe for Sharing)

| Item | Purpose |
|------|---------|
| `.env.example` | Template showing what variables you need (no real values) |
| `data/profile.example.json` | Template showing data structure (dummy data) |
| `data/botConfig.example.json` | Template for bot settings (dummy data) |
| All source code | The application logic (no secrets embedded) |

### How Each Person's Setup is Isolated

```
Person A's Site                    Person B's Site
─────────────────                  ─────────────────
.env.local                         .env.local
├── GEMINI_API_KEY=aaaa...         ├── GEMINI_API_KEY=bbbb...
├── DASHBOARD_PASSWORD=SecretA     ├── DASHBOARD_PASSWORD=SecretB
└── JWT_SECRET=xxxx...             └── JWT_SECRET=yyyy...

data/profile.json                  data/profile.json
├── name: "Alice"                  ├── name: "Bob"
├── skills: [...]                  ├── skills: [...]
└── (Alice's complete CV)          └── (Bob's complete CV)
```

**There is ZERO overlap between different deployments.**

---

## ⚡ Quick Start

```bash
# 1. Clone or fork this repository
git clone <your-repo-url>
cd dickson-cv

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env.local

# 4. Create your data files
cp data/profile.example.json data/profile.json
cp data/botConfig.example.json data/botConfig.json

# 5. Edit .env.local with your API keys
# 6. Edit data/profile.json with your information
# 7. Start the development server
npm run dev
```

---

## 📝 Detailed Setup

### Step 1: Get Your Gemini API Key (Free)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key - you'll need it for `.env.local`

### Step 2: Set Up Environment Variables

Create your `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Your Gemini API key from Step 1
GEMINI_API_KEY=AIzaSyC...your-actual-key

# Choose a strong password for your dashboard
DASHBOARD_PASSWORD=YourSecurePassword123!

# Generate a random secret (run this command):
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
JWT_SECRET=your-generated-random-string
```

### Step 3: Set Up Your Profile Data

Create your profile file:

```bash
cp data/profile.example.json data/profile.json
```

Edit `data/profile.json` with your information:

```json
{
  "name": "Your Name",
  "title": "Your Job Title",
  "bio": "Your biography...",
  "skills": [...],
  "experience": [...],
  // etc.
}
```

### Step 4: Configure Bot Settings (Optional)

```bash
cp data/botConfig.example.json data/botConfig.json
```

Customize the chatbot personality, greeting, and blocked topics in `data/botConfig.json`.

### Step 5: Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to see your site!

---

## 🌐 Deployment

### Deploy to Vercel (Recommended - Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. **Add Environment Variables:**
   - Go to Project Settings > Environment Variables
   - Add `GEMINI_API_KEY`, `DASHBOARD_PASSWORD`, `JWT_SECRET`
5. Deploy!

**Important:** Your `data/profile.json` and `data/botConfig.json` will be included in the deployment. Only the `.env` variables are set separately in Vercel.

### Deploy to Other Platforms

The same principle applies:
1. Deploy your code
2. Set environment variables in the platform's settings
3. Your data files (`data/*.json`) are part of the deployment

---

## 🎨 Customization

### Change Colors/Styling

Edit `app/globals.css` - the CSS variables at the top control the theme.

### Add Dashboard Sections

Create a new page in `app/dashboard/your-section/page.js`.

### Modify Bot Behavior

Edit `data/botConfig.json` via the dashboard or directly in the file.

---

## ❓ Troubleshooting

### "Chat returns error message"
- Check that `GEMINI_API_KEY` is set correctly in `.env.local`
- Restart the dev server after changing `.env.local`

### "Can't log into dashboard"
- Check that `DASHBOARD_PASSWORD` is set in `.env.local`
- Make sure there are no extra spaces in the password

### "Data not loading"
- Ensure `data/profile.json` exists and is valid JSON
- Check the browser console for errors

### "Changes not appearing"
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Restart the dev server: `npm run dev`

---

## 🔒 Security Checklist

Before deploying, verify:

- [ ] `.env.local` is NOT committed (check with `git status`)
- [ ] `data/profile.json` is NOT committed (check `.gitignore`)
- [ ] Your `DASHBOARD_PASSWORD` is strong
- [ ] Your `JWT_SECRET` is at least 32 characters

---

## 📞 Support

If you have issues, check:
1. The Error Logs page in your dashboard (`/dashboard/errors`)
2. Browser console for JavaScript errors
3. Terminal output for server errors

---

**Remember:** Your API keys, passwords, and personal data never leave your deployment. Each person running this code has completely separate, private data.
