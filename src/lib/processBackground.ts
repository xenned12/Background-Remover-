import * as imglyPkg from '@imgly/background-removal';

let isModelLoaded = false;

// We can pre-load or configure public paths if needed. 
// Since we are running in browser via Vite, the default config fetches from unpkg CDN.
// This allows offloading the model size, while executing locally.
export async function processBackgroundRemoval(
  file: Blob, 
  accuracy: 'small' | 'medium',
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const modelType = accuracy === 'small' ? 'isnet_quint8' : 'isnet_fp16';
  
  const config: any = {
    model: modelType,
    progress: (key: string, current: number, total: number) => {
      if (onProgress) {
        // imgly provides progress for downloading assets
        const percent = Math.min(100, Math.round((current / total) * 100));
        onProgress(percent);
      }
    }
  };

  try {
    // Handling bundler differences for default exports
    const removeBg = typeof imglyPkg === 'function' ? imglyPkg : (imglyPkg as any).default || (imglyPkg as any).removeBackground;
    const resultBlob = await removeBg(file, config);
    isModelLoaded = true; // Subsequent calls will be faster
    return resultBlob;
  } catch (error) {
    console.error("AI Removal error:", error);
    throw error;
  }
}


