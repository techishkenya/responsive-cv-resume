
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Simple in-memory cache for preview data
const previewCache = new Map();

/**
 * GET /api/preview?url=...
 * 
 * Fetches Open Graph metadata for a given URL.
 * Returns title, description, image, and domain.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Check cache first
    if (previewCache.has(url)) {
        return NextResponse.json(previewCache.get(url));
    }

    try {
        // Validation: Must be http or https
        if (!url.startsWith('http')) {
            return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
        }

        // Fetch the page with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'DicksonCV-Bot/1.0', // Polite UA
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status}`);
        }

        const html = await response.text();

        // Extract Metadata using Regex (simple implementation)
        // Note: For production with arbitrary URLs, a parser like cheerio is safer
        const getMetaTag = (prop) => {
            const regex = new RegExp(`<meta\\s+(?:name|property)=["']${prop}["']\\s+content=["'](.*?)["']`, 'i');
            const match = html.match(regex);
            return match ? match[1] : null;
        };

        const getTitle = () => {
            // Try og:title, then twitter:title, then <title>
            const og = getMetaTag('og:title');
            if (og) return og;
            const twitter = getMetaTag('twitter:title');
            if (twitter) return twitter;
            const titleMatch = html.match(/<title>(.*?)<\/title>/i);
            return titleMatch ? titleMatch[1] : null;
        };

        const metadata = {
            url,
            domain: new URL(url).hostname.replace('www.', ''),
            title: getTitle(),
            description: getMetaTag('og:description') || getMetaTag('description') || getMetaTag('twitter:description'),
            image: getMetaTag('og:image') || getMetaTag('twitter:image'),
        };

        // Cache successful results for 1 hour
        previewCache.set(url, metadata);
        setTimeout(() => previewCache.delete(url), 60 * 60 * 1000);

        return NextResponse.json(metadata);

    } catch (error) {
        logger.warn('Link preview fetch failed', { url, error: error.message });
        return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 });
    }
}
