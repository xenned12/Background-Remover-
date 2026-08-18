/**
 * Main Express Backend Server for Background Remover Pro
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { jobsRouter } from './routes/jobs.js';
import { toolsRouter, getHealthStatus } from './routes/tools.js';
import { preferencesRouter } from './routes/preferences.js';

// Load environment variables (.env / .env.local)
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3005;

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or localhost/any dev host
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.includes('webcontainer') || origin.includes('googleusercontent')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body Parsers with 50MB limits for high-resolution base64/image payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const logColor = statusCode >= 400 ? '\x1b[31m' : statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';
    console.log(
      `[${new Date().toISOString()}] ${method} ${originalUrl} ${logColor}${statusCode}${resetColor} - ${duration}ms`
    );
  });

  next();
});

// Top-level Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: getHealthStatus(),
  });
});

// Mount modular sub-routers
app.use('/api/preferences', preferencesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/tools', toolsRouter);

// 404 Route handler for unmapped API endpoints
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handling Middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
});

// Start listening if not in test environment
let server: ReturnType<typeof app.listen> | null = null;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`🚀 Background Remover Pro Backend Server`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`⚡ API Base: http://localhost:${PORT}/api`);
    console.log(`⏱  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=========================================`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\x1b[31m[Port Conflict] Port ${PORT} is already in use by another process.\x1b[0m`);
      console.error(`Please set a different port via PORT=<number> (e.g. PORT=3002 npm run server) or terminate the conflicting process.`);
    } else {
      console.error('[Server Error]', err);
    }
  });

  // Graceful Shutdown
  const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down backend server gracefully...`);
    server?.close(() => {
      console.log('Backend HTTP server closed. Process exiting.');
      process.exit(0);
    });

    // Force close after 5 seconds timeout
    setTimeout(() => {
      console.error('Forced shutdown timeout reached. Exiting immediately.');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export { app, server };
export default app;
