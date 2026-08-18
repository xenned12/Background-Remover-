/**
 * Background Remover Pro - Frontend API Client
 * Type-safe API methods for communicating with Express backend
 */

import type {
  AppPreferences,
  JobRecord,
  CreateJobInput,
  UpdateJobInput,
  BackdropPresetsResponse,
  SystemHealthResponse,
} from '../../server/types.js';

import type {
  GenerateBackgroundRequest,
  BackdropSuggestion,
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = json.error || json.message || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }
  return json.data !== undefined ? json.data : (json as T);
}

// Preferences Endpoints
export async function getPreferences(): Promise<AppPreferences> {
  const res = await fetch(`${API_BASE}/preferences`);
  return handleResponse<AppPreferences>(res);
}

export async function updatePreferences(updates: Partial<AppPreferences>): Promise<AppPreferences> {
  const res = await fetch(`${API_BASE}/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return handleResponse<AppPreferences>(res);
}

// Backward-compatibility aliases
export const getUserPreferences = getPreferences;
export const updateUserPreferences = updatePreferences;

// Jobs Endpoints
export async function getJobs(statusFilter?: string, limit?: number): Promise<JobRecord[]> {
  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  if (limit) params.set('limit', String(limit));

  const url = `${API_BASE}/jobs${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  return handleResponse<JobRecord[]>(res);
}

export async function createJob(job: CreateJobInput): Promise<JobRecord> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  });
  return handleResponse<JobRecord>(res);
}

export async function createBatchJobs(jobs: CreateJobInput[]): Promise<JobRecord[]> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobs),
  });
  return handleResponse<JobRecord[]>(res);
}

export async function getJobById(id: string): Promise<JobRecord> {
  const res = await fetch(`${API_BASE}/jobs/${encodeURIComponent(id)}`);
  return handleResponse<JobRecord>(res);
}

export async function updateJob(id: string, updates: UpdateJobInput): Promise<JobRecord> {
  const res = await fetch(`${API_BASE}/jobs/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return handleResponse<JobRecord>(res);
}

export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  await handleResponse<{ success: boolean }>(res);
}

export async function clearAllJobs(): Promise<{ count: number }> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'DELETE',
  });
  return handleResponse<{ count: number }>(res);
}

// Tools Presets & Health Endpoints
export async function getBackdropPresets(): Promise<BackdropPresetsResponse> {
  const res = await fetch(`${API_BASE}/tools/presets`);
  return handleResponse<BackdropPresetsResponse>(res);
}

export async function getSystemHealth(): Promise<SystemHealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse<SystemHealthResponse>(res);
}

// AI Backdrop Concept Brainstormer / Generator
export async function generateBackdropSuggestion(
  req: GenerateBackgroundRequest
): Promise<{ suggestion: BackdropSuggestion }> {
  try {
    const res = await fetch(`${API_BASE}/tools/generate-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.data?.suggestion) return data.data;
      if (data.suggestion) return data;
    }
  } catch {
    // Graceful offline synthesizer fallback below
  }

  // Intelligent client-side studio concept synthesis
  const mood = req.mood || 'studio';
  const subject = req.subjectType || 'product';

  const suggestionsMap: Record<string, BackdropSuggestion> = {
    studio: {
      id: 'sug_studio',
      title: 'Minimalist Clean Studio',
      description: `Soft dual-tone gradient creating crisp focus on ${subject} edges.`,
      lightingDescription: 'Balanced 5600K key light with subtle rim reflection',
      recommendedGradient: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
      shadowRecommendation: 'studio',
    },
    luxury: {
      id: 'sug_luxury',
      title: 'Editorial Cashmere & Sand',
      description: `Warm, creamy tones elevating ${subject} with premium editorial depth.`,
      lightingDescription: 'Diffused softbox side-fill with subtle ambient bounce',
      recommendedColor: '#F5EBE0',
      shadowRecommendation: 'floating',
    },
    neon: {
      id: 'sug_neon',
      title: 'Cyberpunk Radiant Studio',
      description: `Electrifying neon aura giving ${subject} high-energy punch.`,
      lightingDescription: 'Split cyan and magenta edge rim lighting',
      recommendedGradient: 'linear-gradient(135deg, #E0E7FF 0%, #CFFAFE 100%)',
      shadowRecommendation: 'neon',
    },
    lifestyle: {
      id: 'sug_lifestyle',
      title: 'Golden Hour Warmth',
      description: `Gentle sunset glow bringing natural warmth to ${subject}.`,
      lightingDescription: 'Low-angle warm sunset back-illumination',
      recommendedGradient: 'linear-gradient(135deg, #FFE4E6 0%, #FEF3C7 100%)',
      shadowRecommendation: 'soft',
    },
    nature: {
      id: 'sug_nature',
      title: 'Fresh Organic Mint Sage',
      description: `Clean botanical pastel tone highlighting fresh natural detail.`,
      lightingDescription: 'Overhead natural daylight diffusion',
      recommendedColor: '#DCFCE7',
      shadowRecommendation: 'soft',
    },
    futuristic: {
      id: 'sug_futuristic',
      title: 'Indigo Horizon Matrix',
      description: `Sleek high-tech backdrop built for modern product displays.`,
      lightingDescription: 'Directional blue laser line accents',
      recommendedGradient: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
      shadowRecommendation: 'drop',
    },
  };

  const selected = suggestionsMap[mood] || suggestionsMap.studio;
  return { suggestion: selected };
}
