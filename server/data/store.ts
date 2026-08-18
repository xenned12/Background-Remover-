/**
 * In-Memory Data Store for Background Remover Pro
 */

import {
  AppPreferences,
  JobRecord,
  SolidPreset,
  GradientPreset,
  BlurFilterPreset,
  AspectRatioPreset,
  ShadowPreset,
  BackdropPresetsResponse,
} from '../types.js';

// Default App Preferences
export const defaultAppPreferences: AppPreferences = {
  accuracy: 'medium',
  backgroundStyle: 'transparent',
  backgroundColor: '#FFFFFF',
  gradientPreset: 'morning_mist',
  exportFormat: 'image/png',
  maxResolution: 2048,
  shadow: 'none',
  edgeSmoothing: true,
  autoDownload: false,
  jpegQuality: 0.92,
};

// Curated Solid Color Studio Presets (Light Theme / Studio Palette)
export const solidStudioPresets: SolidPreset[] = [
  { id: 'clean_white', name: 'Clean White', hex: '#FFFFFF', category: 'neutral' },
  { id: 'soft_pearl', name: 'Soft Pearl', hex: '#F8FAFC', category: 'neutral' },
  { id: 'slate_mist', name: 'Slate Mist', hex: '#E2E8F0', category: 'neutral' },
  { id: 'studio_blue', name: 'Studio Blue', hex: '#E0E7FF', category: 'studio' },
  { id: 'mint_sage', name: 'Mint Sage', hex: '#DCFCE7', category: 'pastel' },
  { id: 'rose_quartz', name: 'Rose Quartz', hex: '#FCE7F3', category: 'pastel' },
  { id: 'warm_sand', name: 'Warm Sand', hex: '#F5EBE0', category: 'pastel' },
  { id: 'dark_charcoal', name: 'Dark Charcoal', hex: '#1E293B', category: 'studio' },
];

// Curated Modern Light Gradients
export const gradientPresets: GradientPreset[] = [
  {
    id: 'morning_mist',
    name: 'Morning Mist',
    css: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
    colors: ['#F8FAFC', '#E2E8F0'],
    angle: 135,
    description: 'Crisp morning mist tones with subtle clean studio contrast.',
  },
  {
    id: 'aurora_blue',
    name: 'Aurora Blue',
    css: 'linear-gradient(135deg, #E0E7FF 0%, #CFFAFE 100%)',
    colors: ['#E0E7FF', '#CFFAFE'],
    angle: 135,
    description: 'Modern soft cyan and indigo light studio wash.',
  },
  {
    id: 'sunset_whisper',
    name: 'Sunset Whisper',
    css: 'linear-gradient(135deg, #FFE4E6 0%, #FEF3C7 100%)',
    colors: ['#FFE4E6', '#FEF3C7'],
    angle: 135,
    description: 'Warm delicate pastel peach and gold illumination.',
  },
  {
    id: 'ocean_flow',
    name: 'Ocean Flow',
    css: 'linear-gradient(135deg, #E0F2FE 0%, #E0E7FF 100%)',
    colors: ['#E0F2FE', '#E0E7FF'],
    angle: 135,
    description: 'Serene light sky blue fading to gentle periwinkle.',
  },
  {
    id: 'clean_indigo',
    name: 'Clean Indigo',
    css: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
    colors: ['#EEF2FF', '#E0E7FF'],
    angle: 135,
    description: 'Professional minimalist cool-toned corporate studio gradient.',
  },
  {
    id: 'soft_lavender',
    name: 'Soft Lavender',
    css: 'linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 100%)',
    colors: ['#F3E8FF', '#FCE7F3'],
    angle: 135,
    description: 'Delicate aesthetic lavender-rose blend for fashion and lifestyle.',
  },
];

// Blur Filter Presets
export const blurFilterPresets: BlurFilterPreset[] = [
  {
    id: 'subtle_blur',
    name: 'Subtle Depth',
    blurRadius: 8,
    overlayOpacity: 0.15,
    description: 'Light lens blur maintaining soft background texture.',
  },
  {
    id: 'studio_portrait_blur',
    name: 'Studio Portrait (f/2.8)',
    blurRadius: 16,
    overlayOpacity: 0.25,
    description: 'Classic portrait lens bokeh effect separating subject cleanly.',
  },
  {
    id: 'dramatic_bokeh',
    name: 'Dramatic Bokeh (f/1.4)',
    blurRadius: 28,
    overlayOpacity: 0.35,
    description: 'Creamy high-aperture blur for professional commercial look.',
  },
  {
    id: 'abstract_dream',
    name: 'Abstract Soft Glow',
    blurRadius: 42,
    overlayOpacity: 0.5,
    description: 'Heavy artistic blur melting background into smooth light fields.',
  },
];

// Aspect Ratio Presets
export const aspectRatioPresets: AspectRatioPreset[] = [
  { id: 'original', name: 'Original Dimensions', ratio: 'auto', width: 0, height: 0, platformHint: 'Preserve source' },
  { id: 'square', name: 'Square 1:1', ratio: '1:1', width: 1080, height: 1080, platformHint: 'Instagram Post, E-Commerce' },
  { id: 'portrait_4_5', name: 'Portrait 4:5', ratio: '4:5', width: 1080, height: 1350, platformHint: 'Instagram Feed' },
  { id: 'story_9_16', name: 'Story 9:16', ratio: '9:16', width: 1080, height: 1920, platformHint: 'TikTok, Reels, Shorts' },
  { id: 'landscape_16_9', name: 'Landscape 16:9', ratio: '16:9', width: 1920, height: 1080, platformHint: 'YouTube, Web Banner' },
  { id: 'ecommerce_3_4', name: 'Catalog 3:4', ratio: '3:4', width: 1200, height: 1600, platformHint: 'Amazon, Shopify, Etsy' },
  { id: 'header_3_1', name: 'Banner 3:1', ratio: '3:1', width: 1500, height: 500, platformHint: 'Twitter/X Header' },
];

// Shadow Presets
export const shadowPresets: ShadowPreset[] = [
  { id: 'none', name: 'None', cssFilter: 'none', description: 'Clean cutout without extra shadow' },
  { id: 'soft', name: 'Soft Ambient', cssFilter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.12))', description: 'Natural ambient room shadow' },
  { id: 'drop', name: 'Hard Drop Shadow', cssFilter: 'drop-shadow(0 15px 12px rgba(0, 0, 0, 0.28))', description: 'Crisp elevated shadow' },
  { id: 'floating', name: 'Floating 3D Lift', cssFilter: 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.2)) drop-shadow(0 5px 10px rgba(0, 0, 0, 0.08))', description: 'Dramatic elevated float' },
  { id: 'studio', name: 'Studio Floor Cast', cssFilter: 'drop-shadow(0 30px 20px rgba(0, 0, 0, 0.18))', description: 'Professional product tabletop shadow' },
  { id: 'neon', name: 'Soft Luminous Glow', cssFilter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.35)) drop-shadow(0 0 40px rgba(168, 85, 247, 0.2))', description: 'Soft luminous aesthetic glow' },
];

/**
 * State container managing runtime store
 */
class InMemoryStore {
  private preferences: AppPreferences = { ...defaultAppPreferences };
  private jobs: Map<string, JobRecord> = new Map();

  constructor() {
    this.seedInitialJobs();
  }

  private seedInitialJobs() {
    const mockJobs: JobRecord[] = [
      {
        id: 'job_sample_1',
        name: 'luxury-leather-bag.jpg',
        originalUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
        foregroundUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
        resultUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
        status: 'done',
        progress: 100,
        createdAt: Date.now() - 3600000 * 2,
        completedAt: Date.now() - 3600000 * 2 + 1320,
        processingTimeMs: 1320,
        fileSize: 2451000,
        fileType: 'image/jpeg',
        dimensions: { width: 1920, height: 1440 },
        settingsSnapshot: {
          accuracy: 'medium',
          backgroundStyle: 'gradient',
          gradientPreset: 'morning_mist',
          shadow: 'studio',
        },
      },
      {
        id: 'job_sample_2',
        name: 'executive-portrait.png',
        originalUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        foregroundUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        resultUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        status: 'done',
        progress: 100,
        createdAt: Date.now() - 3600000 * 5,
        completedAt: Date.now() - 3600000 * 5 + 1680,
        processingTimeMs: 1680,
        fileSize: 3820000,
        fileType: 'image/png',
        dimensions: { width: 2048, height: 2048 },
        settingsSnapshot: {
          accuracy: 'medium',
          backgroundStyle: 'transparent',
          shadow: 'soft',
        },
      },
      {
        id: 'job_sample_3',
        name: 'wireless-headphones.webp',
        originalUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        foregroundUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        resultUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        status: 'done',
        progress: 100,
        createdAt: Date.now() - 3600000 * 12,
        completedAt: Date.now() - 3600000 * 12 + 1150,
        processingTimeMs: 1150,
        fileSize: 1890000,
        fileType: 'image/webp',
        dimensions: { width: 1600, height: 1200 },
        settingsSnapshot: {
          accuracy: 'medium',
          backgroundStyle: 'color',
          backgroundColor: '#1E293B',
          shadow: 'floating',
        },
      },
    ];

    mockJobs.forEach((job) => this.jobs.set(job.id, job));
  }

  // Preferences methods
  public getPreferences(): AppPreferences {
    return { ...this.preferences };
  }

  public updatePreferences(updates: Partial<AppPreferences>): AppPreferences {
    this.preferences = {
      ...this.preferences,
      ...updates,
    };
    return this.getPreferences();
  }

  // Jobs methods
  public getAllJobs(): JobRecord[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public getJob(id: string): JobRecord | undefined {
    return this.jobs.get(id);
  }

  public createJob(job: JobRecord): JobRecord {
    this.jobs.set(job.id, job);
    return job;
  }

  public updateJob(id: string, updates: Partial<JobRecord>): JobRecord | undefined {
    const existing = this.jobs.get(id);
    if (!existing) return undefined;

    const updated: JobRecord = {
      ...existing,
      ...updates,
      metadata: updates.metadata ? { ...existing.metadata, ...updates.metadata } : existing.metadata,
      dimensions: updates.dimensions ? { ...existing.dimensions, ...updates.dimensions } : existing.dimensions,
    };
    this.jobs.set(id, updated);
    return updated;
  }

  public deleteJob(id: string): boolean {
    return this.jobs.delete(id);
  }

  public clearAllJobs(): number {
    const count = this.jobs.size;
    this.jobs.clear();
    return count;
  }

  // Presets
  public getBackdropPresets(): BackdropPresetsResponse {
    return {
      solidStudio: solidStudioPresets,
      gradients: gradientPresets,
      blurFilters: blurFilterPresets,
      aspectRatios: aspectRatioPresets,
      shadowPresets: shadowPresets,
    };
  }

  // Reset store state for testing isolation
  public reset(): void {
    this.preferences = JSON.parse(JSON.stringify(defaultAppPreferences));
    this.jobs.clear();
    this.seedInitialJobs();
  }
}

export const store = new InMemoryStore();
