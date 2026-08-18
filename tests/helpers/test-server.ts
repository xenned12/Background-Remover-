/**
 * Test Server Helper for Background Remover Pro
 * Starts an isolated Express HTTP server on a dynamic port and provides API request helpers.
 */

import express, { Express } from 'express';
import cors from 'cors';
import { Server } from 'http';
import { preferencesRouter } from '../../server/routes/preferences.js';
import { jobsRouter } from '../../server/routes/jobs.js';
import { toolsRouter, getHealthStatus } from '../../server/routes/tools.js';
import { store } from '../../server/data/store.js';

export interface TestServerInstance {
  app: Express;
  server: Server;
  port: number;
  baseUrl: string;
  close: () => Promise<void>;
  resetStore: () => void;
  request: (
    path: string,
    options?: RequestInit
  ) => Promise<{
    status: number;
    ok: boolean;
    json: () => Promise<any>;
    text: () => Promise<string>;
    headers: Headers;
  }>;
}

export function createTestApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Mount API routes
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: getHealthStatus() });
  });

  app.use('/api/preferences', preferencesRouter);
  app.use('/api/jobs', jobsRouter);
  app.use('/api/tools', toolsRouter);

  // 404 Fallback
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  return app;
}

export async function startTestServer(): Promise<TestServerInstance> {
  const app = createTestApp();

  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 3000;
      const baseUrl = `http://127.0.0.1:${port}/api`;

      const instance: TestServerInstance = {
        app,
        server,
        port,
        baseUrl,
        resetStore: () => {
          store.reset();
        },
        close: () =>
          new Promise<void>((res, rej) => {
            server.close((err) => (err ? rej(err) : res()));
          }),
        request: async (path: string, options?: RequestInit) => {
          const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
          const res = await fetch(url, options);
          return {
            status: res.status,
            ok: res.ok,
            json: () => res.json(),
            text: () => res.text(),
            headers: res.headers,
          };
        },
      };

      resolve(instance);
    });

    server.on('error', reject);
  });
}
