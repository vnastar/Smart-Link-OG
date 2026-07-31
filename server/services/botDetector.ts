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
  }): string {
    const { title, description, image, url, siteName } = options;

    const safeTitle = this.escapeHtml(title || siteName);
    const safeDesc = this.escapeHtml(description || '');
    const safeImage = this.escapeHtml(image || '');
    const safeUrl = this.escapeHtml(url);
    const safeSite = this.escapeHtml(siteName);

    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
    <!-- Open Graph / Facebook / Zalo / Telegram -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${safeUrl}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDesc}">
    <meta property="og:image" content="${safeImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="${safeSite}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${safeUrl}">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDesc}">
    <meta name="twitter:image" content="${safeImage}">
</head>
<body>
    <!-- Bot view: clean OG metadata -->
</body>
</html>`;
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
