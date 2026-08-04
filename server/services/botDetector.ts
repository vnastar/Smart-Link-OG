import { db } from '../db.js';

export class BotDetector {
  /**
   * Detects if incoming User-Agent string belongs to a social media link crawler / bot.
   */
  static isBot(userAgent: string | undefined): { isBot: boolean; matchedAgent?: string } {
    if (!userAgent) return { isBot: false };

    const lowerUA = userAgent.toLowerCase();
    const settings = db.getSettings();
    const customBots = settings.bot_list
      ? settings.bot_list.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      : [];

    const defaultBotTokens = [
      'facebookexternalhit',
      'facebookexternalua',
      'facebookcatalog',
      'facebot',
      'facebook',
      'telegrambot',
      'telegram',
      'telegram-bot',
      't.me',
      'twitterbot',
      'twitter',
      'discordbot',
      'linkedinbot',
      'slackbot',
      'whatsapp',
      'pinterest',
      'googleinspectiontool',
      'bingbot',
      'googlebot',
      'applebot',
      'yandex',
      'duckduckbot',
      'baiduspider',
      'skypeuripreview',
      'vkshare',
      'outbrain',
      'zalobot',
      'zalo',
      'viber',
      'curl',
      'wget'
    ];

    const allTokens = Array.from(new Set([...defaultBotTokens, ...customBots]));

    for (const token of allTokens) {
      if (lowerUA.includes(token)) {
        return { isBot: true, matchedAgent: token };
      }
    }

    return { isBot: false };
  }

  /**
   * Detect MIME type of image URL for og:image:type
   */
  private static detectMimeType(imageUrl: string): string {
    if (!imageUrl) return 'image/jpeg';
    const lower = imageUrl.toLowerCase();
    if (lower.includes('/api/og-image')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.svg')) return 'image/svg+xml';
    return 'image/jpeg';
  }

  /**
   * Generates clean HTML response containing OpenGraph tags for social crawlers.
   */
  static generateOGHtml(options: {
    title: string;
    description: string;
    image: string;
    url: string;
    siteName: string;
    ogType?: string;
    ogUrl?: string;
    ogSiteName?: string;
    siteDomain?: string;
  }): string {
    const { title, description, image, url, siteName, ogType, ogUrl, ogSiteName, siteDomain } = options;

    const currentDomain = siteDomain || this.extractDomainFromUrl(url);
    let formattedImage = this.formatImageUrl(image, currentDomain);

    // Fallback to site logo if link has no image
    if (!formattedImage) {
      const settings = db.getSettings();
      if (settings.logo) {
        formattedImage = this.formatImageUrl(settings.logo, currentDomain);
      }
    }

    const formattedUrl = (ogUrl && ogUrl.trim()) ? this.formatUrl(ogUrl.trim(), currentDomain) : url;

    const safeTitle = this.escapeHtml(title || siteName);
    const safeDesc = this.escapeHtml(description || '');
    const safeImage = this.escapeHtml(formattedImage);
    const safeUrl = this.escapeHtml(formattedUrl);
    const safeType = this.escapeHtml((ogType && ogType.trim()) ? ogType.trim() : 'website');
    const safeSite = this.escapeHtml((ogSiteName && ogSiteName.trim()) ? ogSiteName.trim() : siteName);
    const safeMime = this.detectMimeType(formattedImage);

    return `<!DOCTYPE html>
<html lang="vi" prefix="og: http://ogp.me/ns#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>

    <!-- Essential Open Graph / Facebook / Zalo / Telegram / WhatsApp -->
    <meta property="og:site_name" content="${safeSite}">
    <meta property="og:type" content="${safeType}">
    <meta property="og:url" content="${safeUrl}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDesc}">
    ${safeImage ? `
    <meta property="og:image" content="${safeImage}">
    <meta property="og:image:url" content="${safeImage}">
    <meta property="og:image:secure_url" content="${safeImage}">
    <meta property="og:image:type" content="${safeMime}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${safeTitle}">
    ` : ''}

    <!-- Twitter Card Meta Tags (Telegram & Twitter/X) -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="${safeSite}">
    <meta name="twitter:url" content="${safeUrl}">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDesc}">
    ${safeImage ? `
    <meta name="twitter:image" content="${safeImage}">
    <meta name="twitter:image:src" content="${safeImage}">
    ` : ''}

    <!-- Schema.org / Microdata -->
    <meta itemprop="name" content="${safeTitle}">
    <meta itemprop="description" content="${safeDesc}">
    ${safeImage ? `<meta itemprop="image" content="${safeImage}">` : ''}

    <!-- Canonical & Legacy Image Links -->
    <link rel="canonical" href="${safeUrl}">
    ${safeImage ? `<link rel="image_src" href="${safeImage}">` : ''}
</head>
<body>
    <div style="font-family: sans-serif; padding: 20px; text-align: center;">
        <h1>${safeTitle}</h1>
        <p>${safeDesc}</p>
        ${safeImage ? `<img src="${safeImage}" alt="${safeTitle}" style="max-width:100%; height:auto;" />` : ''}
    </div>
</body>
</html>`;
  }

  private static extractDomainFromUrl(fullUrl: string): string {
    try {
      if (!fullUrl) return '';
      const parsed = new URL(fullUrl);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return '';
    }
  }

  private static formatImageUrl(rawImage: string, currentDomain?: string): string {
    if (!rawImage || !rawImage.trim()) return '';
    let img = rawImage.trim();

    let cleanDomain = (currentDomain || '').trim().replace(/\/$/, '');
    
    // Ensure cleanDomain starts with http(s)://
    if (cleanDomain && !cleanDomain.startsWith('http://') && !cleanDomain.startsWith('https://')) {
      cleanDomain = `https://${cleanDomain}`;
    }

    // Auto upgrade http to https for non-localhost domains
    if (cleanDomain.startsWith('http://') && !cleanDomain.includes('localhost') && !cleanDomain.includes('127.0.0.1')) {
      cleanDomain = cleanDomain.replace('http://', 'https://');
    }

    let finalUrl = '';

    // Full URL http(s)://...
    if (img.startsWith('http://') || img.startsWith('https://')) {
      const uploadsIndex = img.indexOf('/uploads/');
      const proxyIndex = img.indexOf('/api/og-image');

      if (uploadsIndex !== -1 && cleanDomain) {
        const pathAfterUploads = img.substring(uploadsIndex);
        finalUrl = `${cleanDomain}${pathAfterUploads}`;
      } else if (proxyIndex !== -1 && cleanDomain) {
        const pathAfterProxy = img.substring(proxyIndex);
        finalUrl = `${cleanDomain}${pathAfterProxy}`;
      } else {
        // If it's an external URL on another domain, route through our image proxy optimizer /api/og-image
        let isOwnDomain = false;
        try {
          if (cleanDomain) {
            const hostClean = new URL(cleanDomain).host;
            const hostImg = new URL(img).host;
            if (hostClean === hostImg) isOwnDomain = true;
          }
        } catch {
          // ignore
        }

        if (isOwnDomain) {
          finalUrl = img;
        } else {
          // External URL -> route through our image proxy optimizer for instant bot preview
          finalUrl = cleanDomain 
            ? `${cleanDomain}/api/og-image?url=${encodeURIComponent(img)}`
            : `/api/og-image?url=${encodeURIComponent(img)}`;
          return finalUrl;
        }
      }
    }
    // Relative path starting with /
    else if (img.startsWith('/')) {
      finalUrl = cleanDomain ? `${cleanDomain}${img}` : img;
    }
    // Relative path starting with uploads/
    else if (img.startsWith('uploads/')) {
      finalUrl = cleanDomain ? `${cleanDomain}/${img}` : `/${img}`;
    }
    // Plain filename or other relative path
    else {
      finalUrl = cleanDomain ? `${cleanDomain}/uploads/${img}` : `/uploads/${img}`;
    }

    // Encode spaces and special characters in URL path while keeping protocol intact
    try {
      if (finalUrl.startsWith('http://') || finalUrl.startsWith('https://')) {
        const urlObj = new URL(finalUrl);
        urlObj.pathname = urlObj.pathname.split('/').map(segment => encodeURIComponent(decodeURIComponent(segment))).join('/');
        return urlObj.toString();
      }
      return encodeURI(finalUrl);
    } catch {
      return finalUrl;
    }
  }

  private static formatUrl(rawUrl: string, currentDomain?: string): string {
    if (!rawUrl || !rawUrl.trim()) return currentDomain || '';
    let u = rawUrl.trim();
    if (u.startsWith('/')) {
      const cleanDomain = (currentDomain || '').replace(/\/$/, '');
      return `${cleanDomain}${u}`;
    }
    return u;
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

