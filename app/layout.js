/**
 * Root Layout Component
 * 
 * This is the main layout wrapper for the entire application.
 * It includes:
 * - Google Fonts (Inter) for modern typography
 * - Global CSS styles
 * - Metadata for SEO
 */

import { Inter } from 'next/font/google';
import './globals.css';

// Load Inter font with various weights for flexibility
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// SEO Metadata - Update this with your actual information
// SEO Metadata - Generic defaults for the template
export const metadata = {
  title: 'Responsive CV/Resume',
  description: 'An AI-powered interactive resume. Built by @DicksonOtieno using Antigravity.',
  generator: 'Antigravity',
  authors: [{ name: 'Dickson Otieno', url: 'https://github.com/techishkenya' }],
  other: {
    'platform-credit': 'Built by @DicksonOtieno using ANTIGRAVITY'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/*
         * BUILT BY @DicksonOtieno using ANTIGRAVITY
         * https://github.com/techishkenya/
         */}
        <meta name="copyright" content="Built by @DicksonOtieno using Antigravity" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
