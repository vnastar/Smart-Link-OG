import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const persistentUploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'data', 'uploads');
const cacheDir = path.join(persistentUploadsDir, 'cache');

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

export interface OptimizedImageResult {
  buffer: Buffer;
  ext: string;
  contentType: string;
  width: number;
  height: number;
}

export type ImageMode = 'fast' | 'hq';

export class ImageOptimizer {
  /**
   * Resizes and processes an uploaded image buffer to OpenGraph standard size (1200x630).
   * - mode 'fast': Optimized for Bot latency (JPEG quality 80, lightweight ~150-300KB)
   * - mode 'hq': High Quality (JPEG quality 95+, sharp details & true colors)
   * Both modes crop to 1200x630 ratio.
   */
  static async optimizeBuffer(buffer: Buffer, originalExt?: string, mode: ImageMode = 'fast'): Promise<OptimizedImageResult> {
    try {
      // Don't process SVG or ICO
      const cleanExt = (originalExt || '').toLowerCase().replace('.', '');
      if (cleanExt === 'svg' || cleanExt === 'ico') {
        return {
          buffer,
          ext: cleanExt,
          contentType: cleanExt === 'svg' ? 'image/svg+xml' : 'image/x-icon',
          width: 1200,
          height: 630
        };
      }

      const image = sharp(buffer);
      const metadata = await image.metadata();

      const hasAlpha = Boolean(metadata.hasAlpha);
      const isAnimated = (metadata.pages || 0) > 1;

      // Keep animated GIFs unchanged
      if (metadata.format === 'gif' && isAnimated) {
        return {
          buffer,
          ext: 'gif',
          contentType: 'image/gif',
          width: metadata.width || 1200,
          height: metadata.height || 630
        };
      }

      // Target dimension: OpenGraph standard 1200 x 630 (1.91:1 ratio)
      // Smart crop with cover or inside fit
      const transformer = image.resize({
        width: 1200,
        height: 630,
        fit: 'cover',
        position: 'center',
        withoutEnlargement: false
      });

      const isHq = mode === 'hq';

      if (hasAlpha) {
        // Output clean PNG with mode quality
        const outputBuffer = await transformer.png({
          quality: isHq ? 95 : 80,
          compressionLevel: isHq ? 5 : 9
        }).toBuffer();

        const outMeta = await sharp(outputBuffer).metadata();
        return {
          buffer: outputBuffer,
          ext: 'png',
          contentType: 'image/png',
          width: outMeta.width || 1200,
          height: outMeta.height || 630
        };
      } else {
        // Output JPEG
        const outputBuffer = await transformer.jpeg({
          quality: isHq ? 95 : 80,
          progressive: true,
          mozjpeg: true
        }).toBuffer();

        const outMeta = await sharp(outputBuffer).metadata();
        return {
          buffer: outputBuffer,
          ext: 'jpg',
          contentType: 'image/jpeg',
          width: outMeta.width || 1200,
          height: outMeta.height || 630
        };
      }
    } catch (err) {
      console.error('ImageOptimizer.optimizeBuffer error:', err);
      // Fallback: return raw buffer
      return {
        buffer,
        ext: originalExt || 'jpg',
        contentType: 'image/jpeg',
        width: 1200,
        height: 630
      };
    }
  }

  /**
   * Fetches an external image URL, optimizes & resizes it, caches it locally in /data/uploads/cache/,
   * and returns the cached file details.
   */
  static async processExternalImage(imageUrl: string): Promise<{ filePath: string; fileName: string; contentType: string } | null> {
    try {
      if (!imageUrl || !imageUrl.startsWith('http')) return null;

      // Hash URL for cache key
      const hash = crypto.createHash('md5').update(imageUrl).digest('hex');
      const cacheFileName = `og_cache_${hash}.jpg`;
      const cachedPath = path.join(cacheDir, cacheFileName);

      // Return cached file if exists and is valid (> 0 bytes)
      if (fs.existsSync(cachedPath)) {
        const stats = fs.statSync(cachedPath);
        if (stats.size > 0) {
          return {
            filePath: cachedPath,
            fileName: cacheFileName,
            contentType: 'image/jpeg'
          };
        }
      }

      // Fetch remote image with browser User-Agent
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`Failed to fetch external image ${imageUrl}: ${response.status} ${response.statusText}`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      if (inputBuffer.length === 0) return null;

      // Optimize image buffer
      const optimized = await this.optimizeBuffer(inputBuffer);

      // Save to cache dir
      fs.writeFileSync(cachedPath, optimized.buffer);

      return {
        filePath: cachedPath,
        fileName: cacheFileName,
        contentType: optimized.contentType
      };
    } catch (err) {
      console.error(`Error processing external image ${imageUrl}:`, err);
      return null;
    }
  }
}
