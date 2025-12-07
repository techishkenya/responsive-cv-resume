import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { readProfile, readBotConfig, validateChatMessage } from '@/lib/utils';

/* ===========================================
   HELPER FUNCTIONS (Local Rules)
   =========================================== */

function findBestMatch(message, profile) {
    const lowerMsg = message.toLowerCase();
    const cleanMsg = lowerMsg.replace(/[^\w\s]/g, '');

    // 1. Direct Greetings
    if (['hi', 'hello', 'hey', 'greetings', 'hola', 'sup'].includes(cleanMsg.trim())) {
        return {
            type: 'text',
            content: `Hello! I'm an AI assistant for **${profile.name}**. \n\nI can tell you about my **Experience** 💼, **Skills** 🛠️, or how to **Contact** me 📬. What would you like to know?`
        };
    }

    // 2. Keyword Matching for Sections
    const keywords = {
        skills: ['skill', 'stack', 'technology', 'technologies', 'language', 'program', 'coding', 'framework'],
        experience: ['experience', 'work', 'job', 'career', 'history', 'role', 'position', 'resume'],
        projects: ['project', 'portfolio', 'app', 'site', 'website', 'build', 'created', 'demo'],
        articles: ['article', 'blog', 'writing', 'publication', 'post', 'read', 'medium'],
        education: ['education', 'school', 'degree', 'university', 'college', 'study', 'bachelor', 'master'],
        contact: ['contact', 'email', 'phone', 'reach', 'connect', 'social', 'linkedin', 'github', 'twitter', 'x'],
        about: ['about', 'who are you', 'who is', 'bio', 'summary', 'profile', 'story', 'tell me about']
    };

    for (const [section, terms] of Object.entries(keywords)) {
        if (terms.some(term => lowerMsg.includes(term))) {
            return {
                type: 'data',
                section: section,
                data: profile[section] || profile
            };
        }
    }

    return null; // No local match found, use AI
}

function formatResponse(match, profile) {
    if (match.type === 'text') return match.content;

    const { section, data } = match;

    if (section === 'skills') {
        if (Array.isArray(data)) {
            // Group flat skills by category
            const groups = data.reduce((acc, skill) => {
                const cat = skill.category || 'Other';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(skill.name);
                return acc;
            }, {});

            return `### 🛠️ Technical Skills\n\n` +
                Object.entries(groups).map(([cat, items]) => `**${cat}**: ${items.join(', ')}`).join('\n\n');
        }
        return `### 🛠️ Skills\n\n${JSON.stringify(data)}`;
    }

    if (section === 'experience') {
        const jobs = Array.isArray(data) ? data : [];
        // Show top 3 by default to avoid huge walls of text
        const displayJobs = jobs.slice(0, 3);

        return `### 💼 Work Experience\n\n` +
            displayJobs.map(job => `**${job.role}** @ ${job.company}\n_${job.period}_\n${job.description}`).join('\n\n') +
            (jobs.length > 3 ? `\n\n_(And ${jobs.length - 3} more roles...)_` : '');
    }

    if (section === 'projects') {
        // Return a special code block that the frontend Carousel can parse
        const items = Array.isArray(data) ? data : [];
        if (items.length === 0) return "I don't have any projects listed yet.";

        return `Here are some featured projects:\n\n` +
            `\`\`\`json\n` +
            JSON.stringify({ type: 'projects', items: items }) +
            `\n\`\`\``;
    }

    if (section === 'contact') {
        let socialLinks = Object.entries(profile.social || {})
            .map(([k, v]) => `[${k.charAt(0).toUpperCase() + k.slice(1)}](${v})`)
            .join(' | ');

        return `### 📬 Contact Info\n\n` +
            `You can reach ${profile.name} at: **${profile.email}**\n\n` +
            `**Links**: ${socialLinks}`;
    }

    if (section === 'about' || section === 'bio') {
        return `### 👋 About ${profile.name}\n\n` +
            `**${profile.title}**\n\n` +
            `${profile.about}\n\n` +
            `*${profile.tagline}*`;
    }

    return null;
}

function formatHistory(history) {
    if (!history || !Array.isArray(history)) return [];
    return history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));
}

/* ===========================================
   MAIN API HANDLER (POST)
   =========================================== */

export async function POST(req) {
    try {
        const body = await req.json();
        const message = validateChatMessage(body.message); // Use utility validation

        if (!message) {
            return NextResponse.json({ response: "Please type a valid message." });
        }

        const cleanKey = (process.env.GEMINI_API_KEY || '').trim();

        if (!cleanKey) {
            return NextResponse.json(
                { error: 'API Key missing. Please check server configuration.' },
                { status: 500 }
            );
        }

        // 1. Data Loading (Corrected Function Names)
        const profile = await readProfile();
        const botConfig = await readBotConfig();

        // 2. HYBRID RULE ENGINE (Local Check)
        // -----------------------------------
        const localMatch = findBestMatch(message, profile);
        if (localMatch) {
            const localResponse = formatResponse(localMatch, profile);
            if (localResponse) {
                console.log(`⚡️ [Hybrid] served local response for: ${localMatch.section || 'greeting'}`);
                return NextResponse.json({ response: localResponse });
            }
        }

        // 3. AI GENERATION (Gemini Fallback)
        // -----------------------------------
        const genAI = new GoogleGenerativeAI(cleanKey);
        const MODELS_TO_TRY = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.0-pro'];

        // System Prompt
        const systemPrompt = `You are a portfolio assistant for ${profile.name}.
    
    CONTEXT:
    ${JSON.stringify({ ...profile, personality: botConfig.personality })}
    
    RULES:
    - Respond in first person as the AI assistant (using "I").
    - Be professional, concise, and friendly.
    - If asked about "projects", output a JSON block like: \`\`\`json { "type": "projects", "items": [...] } \`\`\`
    - If asked about "experience", summarize the roles.
    - Do not make up facts.`;

        const formattedHistory = formatHistory(body.history);
        let lastError = null;

        for (const modelName of MODELS_TO_TRY) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemPrompt,
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    ]
                });

                const chat = model.startChat({
                    history: formattedHistory,
                    generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.5,
                    }
                });

                const result = await chat.sendMessage(message);
                const response = await result.response;
                const text = response.text();

                if (text) {
                    return NextResponse.json({ response: text });
                }

            } catch (error) {
                console.warn(`⚠️ Model ${modelName} failed: ${error.message}`);
                lastError = error;
                // Continue to next model
            }
        }

        throw lastError || new Error("All models failed.");

    } catch (error) {
        console.error('Chat API Error:', error);

        let userMessage = "Oops! I encountered a temporary issue. Please try again in a moment! 🧠";
        if (error.message?.includes('429')) userMessage = "I'm getting too many requests! Please wait a moment. 🕒";

        return NextResponse.json({ response: userMessage });
    }
}
