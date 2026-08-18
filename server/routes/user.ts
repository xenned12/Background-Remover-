/**
 * Deprecated User API Routes
 * Note: User profiles, tiers, and quotas have been deprecated in favor of open stateless workflow.
 */

import { Router } from 'express';
import { preferencesRouter } from './preferences.js';

export const userRouter = Router();

// Forward preferences requests if any legacy caller uses /api/user/preferences
userRouter.use('/preferences', preferencesRouter);
