/**
 * Jobs and Batch API Routes
 * Handles image background removal job lifecycles, progress tracking, and batch history
 */

import { Router, Request, Response } from 'express';
import { store } from '../data/store.js';
import { CreateJobInput, JobRecord, UpdateJobInput } from '../types.js';

export const jobsRouter = Router();

/**
 * GET /api/jobs
 * Returns list of jobs in memory, optionally filtered by status and limited
 */
jobsRouter.get('/', (req: Request, res: Response) => {
  try {
    const { status, limit } = req.query;
    let jobs = store.getAllJobs();

    if (status && typeof status === 'string') {
      jobs = jobs.filter((job) => job.status === status);
    }

    if (limit && typeof limit === 'string') {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        jobs = jobs.slice(0, limitNum);
      }
    }

    res.json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve jobs',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/jobs
 * Create or enqueue a single job or an array of jobs (batch)
 */
jobsRouter.post('/', (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (!body) {
      return res.status(400).json({
        success: false,
        error: 'Missing request body',
      });
    }

    const isBatch = Array.isArray(body);
    const rawItems: CreateJobInput[] = isBatch ? body : [body];

    if (rawItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Job payload cannot be empty',
      });
    }

    const createdJobs: JobRecord[] = [];

    for (const item of rawItems) {
      if (!item.name) {
        return res.status(400).json({
          success: false,
          error: 'Each job must have a "name" property',
        });
      }

      const jobId = item.id || `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newJob: JobRecord = {
        id: jobId,
        name: item.name,
        originalUrl: item.originalUrl || '',
        foregroundUrl: undefined,
        resultUrl: undefined,
        status: 'queued',
        progress: 0,
        createdAt: Date.now(),
        fileSize: item.fileSize,
        fileType: item.fileType,
        settingsSnapshot: item.settingsSnapshot,
        metadata: item.metadata,
      };

      const saved = store.createJob(newJob);
      createdJobs.push(saved);
    }

    return res.status(201).json({
      success: true,
      message: isBatch
        ? `Successfully enqueued ${createdJobs.length} jobs`
        : 'Job created and enqueued successfully',
      data: isBatch ? createdJobs : createdJobs[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to create job(s)',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/jobs/:id
 * Retrieve single job by ID
 */
jobsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const job = store.getJob(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job with id "${id}" not found`,
      });
    }

    return res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve job',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * PATCH /api/jobs/:id
 * Update status, progress, results, or error message of an active job
 */
jobsRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateJobInput;

    const existing = store.getJob(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Job with id "${id}" not found`,
      });
    }

    // If job transitioned to done, record completion time
    if (updates.status === 'done' && !existing.completedAt) {
      updates.completedAt = Date.now();
      if (!updates.processingTimeMs) {
        updates.processingTimeMs = updates.completedAt - existing.createdAt;
      }
      if (updates.progress === undefined) {
        updates.progress = 100;
      }
    }

    const updated = store.updateJob(id, updates);

    return res.json({
      success: true,
      message: `Job ${id} updated successfully`,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update job',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * DELETE /api/jobs/:id
 * Delete a specific job record
 */
jobsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = store.deleteJob(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Job with id "${id}" not found`,
      });
    }

    return res.json({
      success: true,
      message: `Job ${id} deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to delete job',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * DELETE /api/jobs
 * Clear all jobs history
 */
jobsRouter.delete('/', (_req: Request, res: Response) => {
  try {
    const clearedCount = store.clearAllJobs();
    return res.json({
      success: true,
      message: `Cleared all ${clearedCount} jobs from history`,
      count: clearedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to clear jobs',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
