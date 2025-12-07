/**
 * Home Page - Main Chatbot Interface
 * 
 * This is the public-facing page visitors see.
 * Features:
 * - Profile header with avatar and name
 * - Chat interface to ask questions
 * - Quick reply suggestions
 * - Smooth animations and modern UI
 */

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './page.module.css';
import ThemeSwitcher from './components/ThemeSwitcher';
import Carousel from './components/Carousel';
import LinkPreview from './components/LinkPreview';

// Helper: Extract raw text from markdown AST node
const getRawText = (node) => {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (node.value) return node.value;
  if (node.children) return node.children.map(getRawText).join('');
  return '';
};

// Helper: Parse JSON content robustly
const parseCarouselData = (content) => {
  if (!content) return null;

  // Clean up content
  let clean = content.replace(/\n$/, '')
    .replace(/^```\w*\n?/, '') // Remove start fence
    .replace(/\n?```$/, '')    // Remove end fence
    .trim();

  // Basic check before parsing
  if (!clean.startsWith('{') && !clean.includes('"items"')) return null;

  try {
    // Attempt basic cleanup for common LLM JSON errors (trailing commas)
    const sanitized = clean
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/[\u0000-\u0019]+/g, ''); // Remove control chars

    const data = JSON.parse(sanitized);

    // Validate schema
    if (data.items && Array.isArray(data.items) &&
      ['projects', 'education', 'articles', 'experience'].includes(data.type)) {
      return data;
    }
  } catch (e) {
    // Try original if sanitized failed
    try {
      const data = JSON.parse(clean);
      if (data.items && Array.isArray(data.items)) return data;
    } catch (e2) {
      // Failed
      return { error: e.message };
    }
  }
  return null;
};

export default function Home() {
  // State for chat messages and input
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [botConfig, setBotConfig] = useState(null);

  // Counter for stable message IDs
  const messageIdCounter = useRef(0);
  const getNextMessageId = () => `msg-${++messageIdCounter.current}`;

  // Refs for auto-scrolling and input focus
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load profile and bot config on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, configRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/bot-config')
        ]);

        const profileData = await profileRes.json();
        const configData = await configRes.json();

        setProfile(profileData);
        setBotConfig(configData);

        // Add initial greeting message
        if (configData?.personality?.greeting) {
          setMessages([{
            id: 'greeting',
            role: 'assistant',
            content: configData.personality.greeting
          }]);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    }
    loadData();

    // Accreditation
    console.log(
      '%cBUILT BY @DicksonOtieno using ANTIGRAVITY\nhttps://github.com/techishkenya/',
      'background: #222; color: #bada55; font-size: 12px; padding: 10px; border-radius: 4px; line-height: 1.5;'
    );
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  async function sendMessage(messageText) {
    const text = (messageText || input).trim();
    if (!text || isLoading) return;

    // Add user message to chat
    const userMessage = {
      id: getNextMessageId(),
      role: 'user',
      content: text
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10)
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: getNextMessageId(),
        role: 'assistant',
        content: data.response || 'Sorry, I had a little hiccup! Try asking again. 😅'
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: getNextMessageId(),
        role: 'assistant',
        content: 'Oops! Something went wrong. Please try again in a moment. 🔧'
      }]);
    } finally {
      setIsLoading(false);
      // Small delay to ensure render is done before focus
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleSubmit(e, overrideText) {
    if (e) e.preventDefault();
    sendMessage(overrideText);
  }

  // Memoized Markdown components to prevent re-renders
  const markdownComponents = useMemo(() => ({
    // Override paragraph to use span if needed
    p: ({ children }) => <p>{children}</p>,
    strong: ({ children }) => <strong className={styles.mdBold}>{children}</strong>,
    em: ({ children }) => <em className={styles.mdItalic}>{children}</em>,
    ul: ({ children }) => <ul className={styles.mdList}>{children}</ul>,
    ol: ({ children }) => <ol className={styles.mdList}>{children}</ol>,

    // Custom List Item (Clickable Questions & Skill Bars)
    li: ({ children, node }) => {
      const rawText = node ? getRawText(node) : '';
      const isQuestion = rawText.includes('?');
      const percentMatch = rawText.match(/(\d+)%/);

      return (
        <li
          className={`${styles.mdListItem} ${isQuestion ? styles.clickableQuestion : ''}`}
          onClick={(e) => {
            const text = e.currentTarget.textContent || rawText;
            if (isQuestion && text) {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(null, text.trim());
            }
          }}
        >
          {children}
          {percentMatch && (
            <div className={styles.skillBar}>
              <div
                className={styles.skillProgress}
                style={{ width: `${percentMatch[1]}%` }}
              />
            </div>
          )}
        </li>
      );
    },

    // Custom Code Block (Carousel Renderer)
    code: ({ node, inline, className, children, ...props }) => {
      if (!inline) {
        // Robust content extraction
        let content = '';
        if (Array.isArray(children)) content = children.join('');
        else if (typeof children === 'string') content = children;
        else content = String(children);

        // Attempt parsing
        const carouselData = parseCarouselData(content);

        if (carouselData && !carouselData.error) {
          return <Carousel items={carouselData.items} type={carouselData.type} />;
        }

        // Check if we should show debug info (it looked like JSON but failed)
        const showDebug = (className?.includes('json') || content.trim().startsWith('{')) && carouselData?.error;

        return (
          <div className={styles.codeBlockWrapper}>
            <code className={className} {...props}>
              {children}
            </code>
            {showDebug && (
              <div className={styles.parseError}>
                JSON Parse Error: {carouselData.error}
              </div>
            )}
          </div>
        );
      }
      return <code className={styles.mdCode} {...props}>{children}</code>;
    },

    // Custom Link (Rich Preview)
    a: ({ href, children }) => <LinkPreview href={href}>{children}</LinkPreview>,

    h1: ({ children }) => <h3 className={styles.mdHeading}>{children}</h3>,
    h2: ({ children }) => <h4 className={styles.mdHeading}>{children}</h4>,
    h3: ({ children }) => <h5 className={styles.mdHeading}>{children}</h5>,
    hr: () => <hr className={styles.mdDivider} />,
  }), []);

  return (
    <main className={styles.main}>
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
      <div className={styles.bgOrb3} />

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarGlow} />
            <img
              src={profile?.avatar || '/avatar.png'}
              alt={profile?.name || 'Profile'}
              className={styles.avatar}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=7c3aed&color=fff&size=128`;
              }}
            />
            <span className={styles.onlineIndicator} />
          </div>

          <div className={styles.profileInfo}>
            <h1 className={styles.name}>{profile?.name || 'Loading...'}</h1>
            <p className={styles.title}>{profile?.title || ''}</p>
            {profile?.tagline && <p className={styles.tagline}>{profile.tagline}</p>}
          </div>

          {/* Social Links & Contact */}
          <div className={styles.socialActions}>
            {profile?.social && (
              <div className={styles.socialLinks} style={{ marginTop: 0 }}>
                {Object.entries(profile.social).map(([platform, url]) => (
                  url && (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className={styles.socialLink} title={platform}>
                      {platform === 'github' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>}
                      {platform === 'linkedin' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>}
                      {platform === 'twitter' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>}
                    </a>
                  )
                ))}
              </div>
            )}

            {profile?.email && (
              <a href={`mailto:${profile.email}`} className={styles.contactBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Contact Me
              </a>
            )}
          </div>
        </header>

        {/* Chat Area */}
        <div className={styles.chatContainer}>
          <div className={styles.messagesArea}>
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`${styles.message} ${styles[message.role]}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {message.role === 'assistant' && (
                  <div className={styles.messageAvatar}>
                    <img
                      src={profile?.avatar || '/avatar.png'}
                      alt=""
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=Bot&background=7c3aed&color=fff&size=40`;
                      }}
                    />
                  </div>
                )}
                <div className={styles.messageContent}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className={`${styles.message} ${styles.assistant}`}>
                <div className={styles.messageAvatar}>
                  <img src={profile?.avatar || '/avatar.png'} alt="" onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=Bot&background=7c3aed&color=fff&size=40`} />
                </div>
                <div className={styles.messageContent}>
                  <div className={styles.typingIndicator}>
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 1 && botConfig?.quickReplies && (
            <div className={styles.quickReplies}>
              {botConfig.quickReplies.map((reply, index) => (
                <button
                  key={index}
                  className={styles.quickReplyBtn}
                  onClick={() => handleSubmit(null, reply)}
                  disabled={isLoading}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form className={styles.inputArea} onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className={styles.chatInput}
              placeholder={`Ask about ${profile?.name?.split(' ')[0] || 'me'}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <div className={styles.spinner} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
      <ThemeSwitcher />
    </main>
  );
}
