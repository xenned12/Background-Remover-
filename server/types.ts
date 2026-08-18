/**
 * Server Type Definitions for Background Remover Pro API
 */

export type AIModelAccuracy = 'small' | 'medium';
export type BackgroundStyle = 'transparent' | 'color' | 'gradient' | 'blur' | 'custom_image';
export type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml';
export type ShadowStyle = 'none' | 'soft' | 'drop' | 'floating' | 'studio' | 'neon';

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

export type JobStatus = 'queued' | 'processing' | 'done' | 'error' | 'cancelled';

export interface JobRecord {
  id: string;
  name: string;
  originalUrl?: string;
  foregroundUrl?: string;
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
  settingsSnapshot?: Partial<AppPreferences>;
  metadata?: Record<string, unknown>;
}

export interface CreateJobInput {
  id?: string;
  name: string;
  originalUrl?: string;
  fileSize?: number;
  fileType?: string;
  settingsSnapshot?: Partial<AppPreferences>;
  metadata?: Record<string, unknown>;
}

export interface UpdateJobInput {
  status?: JobStatus;
  progress?: number;
  foregroundUrl?: string;
  resultUrl?: string;
  errorMessage?: string;
  completedAt?: number;
  processingTimeMs?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  metadata?: Record<string, unknown>;
}

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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
