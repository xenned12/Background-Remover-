import { AppSettings, GradientPreset } from '../types';

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image: ${err}`));
    img.src = src;
  });
}

// Built-in gradient map fallback with modern light studio gradients
export const DEFAULT_GRADIENTS: Record<string, { colors: string[]; angle: number }> = {
  morning_mist: { colors: ['#F8FAFC', '#E2E8F0'], angle: 135 },
  aurora_blue: { colors: ['#E0E7FF', '#CFFAFE'], angle: 135 },
  sunset_whisper: { colors: ['#FFE4E6', '#FEF3C7'], angle: 135 },
  ocean_flow: { colors: ['#E0F2FE', '#E0E7FF'], angle: 135 },
  clean_indigo: { colors: ['#EEF2FF', '#E0E7FF'], angle: 135 },
  soft_lavender: { colors: ['#F3E8FF', '#FCE7F3'], angle: 135 },
  // Backward-compatibility aliases
  sunset: { colors: ['#FFE4E6', '#FEF3C7'], angle: 135 },
  cyberpunk: { colors: ['#E0E7FF', '#CFFAFE'], angle: 135 },
  clean_gray: { colors: ['#F8FAFC', '#E2E8F0'], angle: 135 },
};

export async function compositeImage(
  originalUrl: string,
  foregroundUrl: string,
  settings: AppSettings,
  gradientPresetsCatalog?: GradientPreset[]
): Promise<Blob> {
  const originalImg = await loadImg(originalUrl);
  const foregroundImg = await loadImg(foregroundUrl);

  // Compute bounding dimensions based on maxResolution
  let width = originalImg.naturalWidth || originalImg.width || 1920;
  let height = originalImg.naturalHeight || originalImg.height || 1080;

  const targetMax = Math.max(512, Math.min(4096, settings.maxResolution || 2048));
  if (width > targetMax || height > targetMax) {
    const ratio = Math.min(targetMax / width, targetMax / height);
    width = Math.max(1, Math.floor(width * ratio));
    height = Math.max(1, Math.floor(height * ratio));
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) throw new Error('Failed to acquire 2D canvas context');

  // Anti-aliasing & quality
  ctx.imageSmoothingEnabled = settings.edgeSmoothing !== false;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw Background Layer
  if (settings.backgroundStyle === 'color') {
    ctx.fillStyle = settings.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  } else if (settings.backgroundStyle === 'custom_image' && settings.customImageBackground) {
    try {
      const customBgImg = await loadImg(settings.customImageBackground);
      ctx.drawImage(customBgImg, 0, 0, width, height);
    } catch {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
  } else if (settings.backgroundStyle === 'gradient') {
    // Find preset or fallback
    const presetId = settings.gradientPreset || 'morning_mist';
    const foundPreset = gradientPresetsCatalog?.find((g) => g.id === presetId);
    const gradConfig = foundPreset
      ? { colors: foundPreset.colors, angle: foundPreset.angle || 135 }
      : DEFAULT_GRADIENTS[presetId] || DEFAULT_GRADIENTS.morning_mist;

    const angleDeg = gradConfig.angle ?? 135;
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    const x0 = width / 2 - (Math.cos(angleRad) * width) / 2;
    const y0 = height / 2 - (Math.sin(angleRad) * height) / 2;
    const x1 = width / 2 + (Math.cos(angleRad) * width) / 2;
    const y1 = height / 2 + (Math.sin(angleRad) * height) / 2;

    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    const cols = gradConfig.colors;
    cols.forEach((col, i) => {
      const stop = cols.length > 1 ? i / (cols.length - 1) : 0;
      gradient.addColorStop(stop, col);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else if (settings.backgroundStyle === 'blur') {
    // Render blurred original background
    const blurPx = Math.max(2, Math.min(60, settings.blurRadius ?? 16));
    ctx.save();
    ctx.filter = `blur(${blurPx}px)`;
    // Scale slightly to prevent blur edge artifacts at canvas borders
    const overflow = blurPx * 1.5;
    ctx.drawImage(originalImg, -overflow, -overflow, width + overflow * 2, height + overflow * 2);
    ctx.restore();

    // Studio atmosphere overlay tint
    const overlayOpacity = Math.max(0, Math.min(0.9, settings.blurOverlayOpacity ?? 0.15));
    if (overlayOpacity > 0) {
      ctx.fillStyle = `rgba(15, 23, 42, ${overlayOpacity})`;
      ctx.fillRect(0, 0, width, height);
    }
  } else if (settings.exportFormat === 'image/jpeg') {
    // JPEG doesn't support alpha channel, fallback to white or specified background color
    ctx.fillStyle = settings.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  } else {
    // Transparent PNG/WEBP
    ctx.clearRect(0, 0, width, height);
  }

  // 2. Draw Foreground Cutout with optional studio shadow
  ctx.save();

  const shadow = settings.shadow || 'none';
  if (shadow !== 'none') {
    const scaleFactor = Math.min(width, height) / 1000;

    if (shadow === 'soft') {
      ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
      ctx.shadowBlur = Math.max(8, 20 * scaleFactor);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.max(4, 12 * scaleFactor);
    } else if (shadow === 'drop') {
      ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
      ctx.shadowBlur = Math.max(6, 14 * scaleFactor);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.max(8, 16 * scaleFactor);
    } else if (shadow === 'floating') {
      ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
      ctx.shadowBlur = Math.max(16, 36 * scaleFactor);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.max(12, 28 * scaleFactor);
    } else if (shadow === 'studio') {
      ctx.shadowColor = 'rgba(15, 23, 42, 0.20)';
      ctx.shadowBlur = Math.max(12, 24 * scaleFactor);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.max(14, 30 * scaleFactor);
    } else if (shadow === 'neon') {
      ctx.shadowColor = 'rgba(37, 99, 235, 0.40)';
      ctx.shadowBlur = Math.max(12, 30 * scaleFactor);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }

  ctx.drawImage(foregroundImg, 0, 0, width, height);
  ctx.restore();

  // 3. Export to Blob
  const exportFormat = settings.exportFormat || 'image/png';
  const quality = settings.jpegQuality ?? 0.92;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to render canvas to output blob'));
        }
      },
      exportFormat,
      quality
    );
  });
}
