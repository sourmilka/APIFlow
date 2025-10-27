/**
 * 🎨 APIFlow - Professional API Discovery & Analysis Platform
 * 
 * Brand Identity & SEO Configuration
 */

export const BRAND = {
  // Main brand name
  name: 'APIFlow',
  tagline: 'Discover, Analyze, and Master APIs',
  
  // SEO
  seo: {
    title: 'APIFlow - Professional API Discovery & Analysis Platform',
    description: 'APIFlow is the ultimate tool for developers to discover, analyze, and understand website APIs. Real-time API capture, WebSocket monitoring, authentication detection, and advanced parsing for any website.',
    keywords: [
      'API discovery',
      'API analysis',
      'API parser',
      'API monitoring',
      'WebSocket inspector',
      'API testing',
      'HTTP inspector',
      'Network analysis',
      'Developer tools',
      'API documentation',
      'REST API',
      'GraphQL',
      'API debugging',
      'Request analysis',
      'Response inspector'
    ],
    author: 'APIFlow Team',
    og: {
      type: 'website',
      siteName: 'APIFlow',
      title: 'APIFlow - Professional API Discovery Platform',
      description: 'Discover and analyze APIs from any website with advanced parsing, real-time monitoring, and intelligent detection.',
      image: '/og-image.png', // You can add this later
    },
    twitter: {
      card: 'summary_large_image',
      site: '@apiflow',
      title: 'APIFlow - Professional API Discovery',
      description: 'The ultimate API discovery and analysis platform for developers.'
    }
  },

  // Company info
  company: {
    name: 'APIFlow Technologies',
    year: new Date().getFullYear(),
    website: 'https://apiflow.dev', // Change to your domain
    email: 'contact@apiflow.dev',
    support: 'support@apiflow.dev'
  },

  // Logo configuration
  logo: {
    icon: '⚡', // Can be replaced with SVG
    primaryColor: '#3b82f6', // Blue
    secondaryColor: '#8b5cf6', // Purple
    accentColor: '#06b6d4', // Cyan
  },

  // Version
  version: '2.0.0',
  versionName: 'Professional Edition',

  // Features for SEO/Marketing
  features: [
    'Real-time API Discovery',
    'WebSocket Monitoring',
    'Authentication Detection',
    'Advanced Bot Evasion',
    'Proxy Rotation',
    'DNS Blocking Detection',
    'Multi-Profile Parsing',
    'Console Log Capture',
    'Screenshot on Error',
    'Export to Multiple Formats',
    'Session History',
    'Smart Retry Logic'
  ],

  // Social links
  social: {
    github: 'https://github.com/apiflow',
    twitter: 'https://twitter.com/apiflow',
    discord: 'https://discord.gg/apiflow',
    docs: 'https://docs.apiflow.dev'
  }
};

// SEO Meta tags helper
export const generateMetaTags = () => {
  return {
    title: BRAND.seo.title,
    meta: [
      { name: 'description', content: BRAND.seo.description },
      { name: 'keywords', content: BRAND.seo.keywords.join(', ') },
      { name: 'author', content: BRAND.seo.author },
      { property: 'og:type', content: BRAND.seo.og.type },
      { property: 'og:site_name', content: BRAND.seo.og.siteName },
      { property: 'og:title', content: BRAND.seo.og.title },
      { property: 'og:description', content: BRAND.seo.og.description },
      { property: 'og:image', content: BRAND.seo.og.image },
      { name: 'twitter:card', content: BRAND.seo.twitter.card },
      { name: 'twitter:site', content: BRAND.seo.twitter.site },
      { name: 'twitter:title', content: BRAND.seo.twitter.title },
      { name: 'twitter:description', content: BRAND.seo.twitter.description },
    ]
  };
};

export default BRAND;
