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
      'facebot',
      'twitterbot',
      'discordbot',
      'telegrambot',
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
      'zalo',
      'viber'
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
    const formattedImage = this.formatImageUrl(image, currentDomain);
    const formattedUrl = (ogUrl && ogUrl.trim()) ? this.formatUrl(ogUrl.trim(), currentDomain) : url;

    const safeTitle = this.escapeHtml(title || siteName);
    const safeDesc = this.escapeHtml(description || '');
    const safeImage = this.escapeHtml(formattedImage);
    const safeUrl = this.escapeHtml(formattedUrl);
    const safeType = this.escapeHtml((ogType && ogType.trim()) ? ogType.trim() : 'website');
    const safeSite = this.escapeHtml((ogSiteName && ogSiteName.trim()) ? ogSiteName.trim() : siteName);

    const isHttps = safeImage.startsWith('https://');

    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
    <!-- Open Graph / Facebook / Zalo / Telegram / iMessage -->
    <meta property="og:type" content="${safeType}">
    <meta property="og:url" content="${safeUrl}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDesc}">
    <meta property="og:image" content="${safeImage}">
${isHttps ? `    <meta property="og:image:secure_url" content="${safeImage}">` : ''}
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="${safeSite}">

    <!-- Schema.org / Google / Zalo Microdata -->
    <meta itemprop="name" content="${safeTitle}">
    <meta itemprop="description" content="${safeDesc}">
    <meta itemprop="image" content="${safeImage}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${safeUrl}">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDesc}">
    <meta name="twitter:image" content="${safeImage}">
    <meta name="twitter:image:src" content="${safeImage}">
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

    if (!currentDomain || !currentDomain.trim()) return img;
    const cleanDomain = currentDomain.trim().replace(/\/$/, '');

    // Trường hợp 1: Ảnh dạng relative tuyệt đối /uploads/xxx
    if (img.startsWith('/')) {
      return `${cleanDomain}${img}`;
    }

    // Trường hợp 2: Ảnh dạng relative uploads/xxx
    if (img.startsWith('uploads/')) {
      return `${cleanDomain}/${img}`;
    }

    // Trường hợp 3: Ảnh đã là full URL http(s)://...
    if (img.startsWith('http://') || img.startsWith('https://')) {
      // Nếu là ảnh lưu trữ thuộc hệ thống (/uploads/) nhưng mang domain cũ hoặc sai domain
      const uploadsIndex = img.indexOf('/uploads/');
      if (uploadsIndex !== -1) {
        const pathAfterUploads = img.substring(uploadsIndex);
        return `${cleanDomain}${pathAfterUploads}`;
      }
    }

    return img;
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
