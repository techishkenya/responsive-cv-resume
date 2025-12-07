/**
 * =============================================================================
 * INTEGRATIONS SERVICE
 * =============================================================================
 * 
 * Handles fetching and processing data from external integrations:
 * - Favorite Playlists (manual entry - no API needed)
 * - Latest Tweet/Quote (manual entry - no API needed)
 * - Blog/RSS Feed (fetches and parses RSS - no API key needed)
 * 
 * All this data is fed to the AI chatbot so it can answer questions like:
 * - "What music do you listen to?"
 * - "What was your latest tweet?"
 * - "What have you written about recently?"
 * 
 * =============================================================================
 */

import { logger } from './logger';

// =============================================================================
// RSS FEED PARSER
// =============================================================================

/**
 * Fetch and parse an RSS feed
 * 
 * RSS feeds are just XML - no API key needed!
 * This fetches the feed and extracts article titles, links, and dates.
 * 
 * @param {string} feedUrl - URL of the RSS feed
 * @param {number} limit - Maximum number of articles to return
 * @returns {Promise<Array>} Array of article objects
 * 
 * @example
 * const articles = await fetchRssFeed('https://blog.example.com/feed.xml', 5);
 * // Returns: [{ title: '...', link: '...', date: '...' }, ...]
 */
export async function fetchRssFeed(feedUrl, limit = 5) {
    if (!feedUrl) {
        return [];
    }

    try {
        logger.debug('Fetching RSS feed', { url: feedUrl });

        // Fetch the RSS feed
        const response = await fetch(feedUrl, {
            headers: {
                'User-Agent': 'Interactive-CV-Bot/1.0',
                'Accept': 'application/rss+xml, application/xml, text/xml'
            },
            // Timeout after 5 seconds
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            throw new Error(`RSS fetch failed: ${response.status}`);
        }

        const xml = await response.text();

        // Simple XML parsing for RSS
        // RSS format: <item><title>...</title><link>...</link><pubDate>...</pubDate></item>
        const articles = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
        let match;

        while ((match = itemRegex.exec(xml)) !== null && articles.length < limit) {
            const itemContent = match[1];

            // Extract title
            const titleMatch = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i.exec(itemContent);
            const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

            // Extract link
            const linkMatch = /<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i.exec(itemContent);
            const link = linkMatch ? linkMatch[1].trim() : '';

            // Extract date
            const dateMatch = /<pubDate>(.*?)<\/pubDate>/i.exec(itemContent);
            const date = dateMatch ? formatDate(dateMatch[1]) : '';

            // Extract description (optional)
            const descMatch = /<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/i.exec(itemContent);
            const description = descMatch
                ? descMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 150) + '...'
                : '';

            articles.push({ title, link, date, description });
        }

        logger.debug('RSS feed parsed', { articlesFound: articles.length });
        return articles;

    } catch (error) {
        logger.warn('Failed to fetch RSS feed', {
            url: feedUrl,
            error: error.message
        });
        return [];
    }
}

/**
 * Format a date string nicely
 * @param {string} dateStr - Date string from RSS
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

// =============================================================================
// INTEGRATION DATA BUILDER
// =============================================================================

/**
 * Build integration context for the AI prompt
 * 
 * This formats all integration data into text the AI can understand.
 * Called from buildSystemPrompt() in the chat API.
 * 
 * @param {object} config - Bot configuration with integrations
 * @returns {Promise<string>} Formatted integration context
 */
export async function buildIntegrationsContext(config) {
    const sections = [];
    const integrations = config.integrations || {};

    // ---------------------------------------------------------------------------
    // FAVORITE PLAYLISTS
    // ---------------------------------------------------------------------------
    if (integrations.playlists?.enabled && integrations.playlists?.items?.length > 0) {
        const playlistList = integrations.playlists.items
            .map(p => `- "${p.name}" - ${p.platform || 'Music'}: ${p.url}`)
            .join('\n');

        sections.push(`
## Favorite Playlists
The profile owner enjoys these music playlists:
${playlistList}
When asked about music, share these playlists!
`);
    }

    // ---------------------------------------------------------------------------
    // LATEST TWEET/QUOTE
    // ---------------------------------------------------------------------------
    if (integrations.twitter?.enabled && integrations.twitter?.latestTweet) {
        sections.push(`
## Latest Tweet/Thought
The profile owner recently shared this thought:
"${integrations.twitter.latestTweet}"
${integrations.twitter.tweetDate ? `(Shared on ${integrations.twitter.tweetDate})` : ''}
${integrations.twitter.username ? `Twitter/X: @${integrations.twitter.username}` : ''}
`);
    }

    // ---------------------------------------------------------------------------
    // BLOG ARTICLES (fetch from RSS)
    // ---------------------------------------------------------------------------
    if (integrations.blog?.enabled && integrations.blog?.rssUrl) {
        try {
            const articles = await fetchRssFeed(integrations.blog.rssUrl, 5);

            if (articles.length > 0) {
                const articleList = articles
                    .map(a => `- "${a.title}" (${a.date}): ${a.link}`)
                    .join('\n');

                sections.push(`
## Recent Blog Articles
The profile owner has written these articles recently:
${articleList}
When asked about articles or blog posts, share these!
`);
            }
        } catch (error) {
            logger.warn('Failed to build blog context', { error: error.message });
        }
    }

    return sections.join('\n');
}

// =============================================================================
// DEFAULT INTEGRATIONS STRUCTURE
// =============================================================================

/**
 * Default structure for integrations
 * Used when creating new bot config
 */
export const DEFAULT_INTEGRATIONS = {
    // Favorite playlists - admin manually adds links
    playlists: {
        enabled: false,
        items: [
            // Example: { name: "Chill Vibes", platform: "Spotify", url: "https://open.spotify.com/..." }
        ]
    },

    // Latest tweet/quote - admin manually updates
    twitter: {
        enabled: false,
        username: '',
        latestTweet: '',
        tweetDate: ''
    },

    // Blog RSS feed - auto-fetched
    blog: {
        enabled: false,
        rssUrl: '',
        blogName: ''
    }
};
