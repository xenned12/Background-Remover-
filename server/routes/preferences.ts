/**
 * Preferences API Routes
 * Handles user workflow settings and defaults
 */

import { Router, Request, Response } from 'express';
import { store } from '../data/store.js';
import { AppPreferences } from '../types.js';

export const preferencesRouter = Router();

/**
 * GET /api/preferences
 * Returns the current workflow settings and defaults
 */
preferencesRouter.get('/', (_req: Request, res: Response) => {
  try {
    const preferences: AppPreferences = store.getPreferences();
    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve preferences',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * PUT /api/preferences
 * Updates default preferences with runtime validation
 */
preferencesRouter.put('/', (req: Request, res: Response) => {
  try {
    const body = req.body as Partial<AppPreferences>;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body: Expected an object of preferences',
      });
    }

    // Validate specific fields if provided
    if (body.accuracy && !['small', 'medium'].includes(body.accuracy)) {
      return res.status(400).json({
        success: false,
        error: `Invalid accuracy: "${body.accuracy}". Allowed: "small", "medium"`,
      });
    }

    if (
      body.backgroundStyle &&
      !['transparent', 'color', 'gradient', 'blur', 'custom_image'].includes(body.backgroundStyle)
    ) {
      return res.status(400).json({
        success: false,
        error: `Invalid backgroundStyle: "${body.backgroundStyle}". Allowed styles: transparent, color, gradient, blur, custom_image`,
      });
    }

    if (
      body.exportFormat &&
      !['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(body.exportFormat)
    ) {
      return res.status(400).json({
        success: false,
        error: `Invalid exportFormat: "${body.exportFormat}". Allowed formats: image/png, image/jpeg, image/webp, image/svg+xml`,
      });
    }

    if (body.maxResolution !== undefined && (typeof body.maxResolution !== 'number' || body.maxResolution <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid maxResolution: Must be a positive number',
      });
    }

    const updated = store.updatePreferences(body);

    return res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
