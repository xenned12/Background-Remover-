/**
 * Tools, Curated Presets, and Health API Routes
 */

import { Router, Request, Response } from 'express';
import { store } from '../data/store.js';
import { BackdropPresetsResponse, SystemHealthResponse } from '../types.js';

export const toolsRouter = Router();

const serverStartTime = Date.now();

/**
 * GET /api/tools/presets
 * Returns curated backdrop presets (Solid Studio colors, Gradients, Blur filters, Aspect Ratios, Shadows)
 */
toolsRouter.get('/presets', (_req: Request, res: Response) => {
  try {
    const presets: BackdropPresetsResponse = store.getBackdropPresets();
    res.json({
      success: true,
      data: presets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load backdrop presets',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Shared Health response calculation
 */
export function getHealthStatus(): SystemHealthResponse {
  const memory = process.memoryUsage();
  const allJobs = store.getAllJobs();
  const activeJobs = allJobs.filter((j) => j.status === 'processing' || j.status === 'queued').length;
  const completedJobs = allJobs.filter((j) => j.status === 'done').length;

  return {
    status: 'ok',
    service: 'background-remover-api',
    version: '2.0.0',
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
    timestamp: new Date().toISOString(),
    memoryUsage: {
      rssMb: Math.round((memory.rss / (1024 * 1024)) * 100) / 100,
      heapTotalMb: Math.round((memory.heapTotal / (1024 * 1024)) * 100) / 100,
      heapUsedMb: Math.round((memory.heapUsed / (1024 * 1024)) * 100) / 100,
      externalMb: Math.round((memory.external / (1024 * 1024)) * 100) / 100,
    },
    nodeVersion: process.version,
    activeJobsCount: activeJobs,
    completedJobsCount: completedJobs,
  };
}

/**
 * GET /api/tools/health (also mounted on /api/health)
 */
toolsRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: getHealthStatus(),
  });
});
