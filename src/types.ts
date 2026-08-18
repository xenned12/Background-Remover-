export type BackgroundStyle = 'transparent' | 'color' | 'blur';
export type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp';
export type AIModelAccuracy = 'small' | 'medium'; // Maps to imgly's small or medium models

export interface AppSettings {
  accuracy: AIModelAccuracy;
  backgroundStyle: BackgroundStyle;
  backgroundColor: string; // Hex color for 'color' style
  exportFormat: ExportFormat;
  maxResolution: number; // e.g., 2048
}

export type JobStatus = 'queued' | 'processing' | 'done' | 'error';

export interface ImageJob {
  id: string;
  file: File;
  name: string;
  originalUrl: string;
  foregroundBlob?: Blob;
  foregroundUrl?: string; // Transparent cutout
  resultBlob?: Blob;      // Composited final result
  resultUrl?: string;
  status: JobStatus;
  errorMessage?: string;
  progress?: number;
  createdAt: number;
  completedAt?: number;
}
