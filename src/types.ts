/**
 * Background Remover Pro - Frontend Type Definitions
 */

export type AIModelAccuracy = 'small' | 'medium';
export type BackgroundStyle = 'transparent' | 'color' | 'gradient' | 'blur' | 'custom_image';
export type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp';
export type ShadowStyle = 'none' | 'soft' | 'drop' | 'floating' | 'studio' | 'neon';
export type JobStatus = 'queued' | 'processing' | 'done' | 'error' | 'cancelled';
export type ViewMode = 'split' | 'result' | 'cutout' | 'original';

export interface AppSettings {
  accuracy: AIModelAccuracy;
  backgroundStyle: BackgroundStyle;
  backgroundColor: string; // Hex color for 'color' style
  gradientPreset: string;   // ID of selected gradient
  customGradient?: string;  // Custom CSS gradient
  customImageBackground?: string; // Custom uploaded background image data URL
  blurRadius: number;       // Blur px (e.g. 16)
  blurOverlayOpacity: number; // 0 to 1
  exportFormat: ExportFormat;
  maxResolution: number;    // e.g. 2048
  shadow: ShadowStyle;
  edgeSmoothing: boolean;
  autoDownload: boolean;
  jpegQuality: number;      // 0.1 to 1.0
}

export interface ImageJob {
  id: string;
  file?: File;
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
  processingTimeMs?: number;
  fileSize?: number;
  fileType?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  settingsSnapshot?: Partial<AppSettings>;
}

export interface AppPreferences {
  accuracy: AIModelAccuracy;
  backgroundStyle: BackgroundStyle;
  backgroundColor: string;
  gradientPreset: string;
  exportFormat: ExportFormat;
  maxResolution: number;
  shadow: ShadowStyle;
  edgeSmoothing: boolean;
  autoDownload?: boolean;
  jpegQuality?: number;
}

// Backward-compatibility alias
export type UserPreferences = AppPreferences;

export interface SolidPreset {
  id: string;
  name: string;
  hex: string;
  category: 'neutral' | 'studio' | 'vibrant' | 'pastel';
}

export interface GradientPreset {
  id: string;
  name: string;
  css: string;
  colors: string[];
  angle?: number;
  description: string;
}

export interface BlurFilterPreset {
  id: string;
  name: string;
  blurRadius: number;
  overlayOpacity: number;
  description: string;
}

export interface AspectRatioPreset {
  id: string;
  name: string;
  ratio: string;
  width: number;
  height: number;
  platformHint?: string;
}

export interface ShadowPreset {
  id: string;
  name: string;
  cssFilter: string;
  description: string;
}

export interface BackdropPresetsResponse {
  solidStudio: SolidPreset[];
  gradients: GradientPreset[];
  blurFilters: BlurFilterPreset[];
  aspectRatios: AspectRatioPreset[];
  shadowPresets: ShadowPreset[];
}

export interface SystemHealthResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  memoryUsage: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
    externalMb: number;
  };
  nodeVersion: string;
  activeJobsCount: number;
  completedJobsCount: number;
}

export interface SampleImageOption {
  id: string;
  name: string;
  category: string;
  previewUrl: string;
  description: string;
}

export interface GenerateBackgroundRequest {
  subjectType?: 'product' | 'portrait' | 'pet' | 'vehicle' | 'food' | 'general';
  mood?: 'studio' | 'lifestyle' | 'neon' | 'minimalist' | 'nature' | 'luxury' | 'vintage' | 'futuristic';
  prompt?: string;
}

export interface BackdropSuggestion {
  id: string;
  title: string;
  description: string;
  lightingDescription: string;
  recommendedColor?: string;
  recommendedGradient?: string;
  shadowRecommendation: string;
}
