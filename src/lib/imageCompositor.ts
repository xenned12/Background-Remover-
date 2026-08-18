import { AppSettings } from '../types';

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function compositeImage(
  originalUrl: string,
  foregroundUrl: string,
  settings: AppSettings
): Promise<Blob> {
  // If transparent and exporting to PNG/WEBP, we might not need compositing,
  // but we still want to apply resolution constraints.
  
  const originalImg = await loadImg(originalUrl);
  const foregroundImg = await loadImg(foregroundUrl);

  // Calculate resolution
  let width = originalImg.width;
  let height = originalImg.height;

  if (width > settings.maxResolution || height > settings.maxResolution) {
    const ratio = Math.min(settings.maxResolution / width, settings.maxResolution / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error("Failed to get 2d context");

  // Handle Background Styles
  if (settings.backgroundStyle === 'color') {
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  } else if (settings.backgroundStyle === 'blur') {
    ctx.filter = 'blur(16px)';
    ctx.drawImage(originalImg, 0, 0, width, height);
    ctx.filter = 'none'; // reset filter for foreground
    // Optional: Add a subtle overlay to make foreground pop
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, width, height);
  } else if (settings.exportFormat === 'image/jpeg') {
    // JPEG doesn't support transparency, default to white if 'transparent' is picked but exported to JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  } else {
    // transparent and PNG/WEBP - keep transparent (cleared canvas)
    ctx.clearRect(0, 0, width, height);
  }

  // Draw Foreground
  ctx.drawImage(foregroundImg, 0, 0, width, height);

  // Export
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob from canvas"));
    }, settings.exportFormat, 0.9); // 0.9 quality for formats that support it
  });
}
