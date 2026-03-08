import express from 'express';
import cors from 'cors';
import { env } from './lib/supabase.js';
import { apiRateLimiter, telemetryRateLimiter } from './middleware/rate-limiter.middleware.js';
import { requestLogger } from './middleware/request-logger.middleware.js';
import { checkJwt, authErrorHandler } from './middleware/auth.middleware.js';
import telemetryRouter from './routes/telemetry.route.js';
import binsRouter from './routes/bins.route.js';
import alertsRouter from './routes/alerts.route.js';
import telemetryHistoryRouter from './routes/telemetry-history.route.js';
import storesRouter from './routes/stores.route.js';
import foodBanksRouter from './routes/food-banks.route.js';
import lifecycleRouter from './routes/lifecycle.route.js';
import organizationsRouter from './routes/organizations.route.js';
import usersRouter from './routes/users.route.js';
import demoRouter from './routes/demo.route.js';

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(apiRateLimiter);

// ---------------------------------------------------------------------------
// Public Routes (no JWT required)
// ---------------------------------------------------------------------------
app.use('/api/v1/telemetry', telemetryRateLimiter, telemetryRouter);
app.use('/api/v1/bins', binsRouter);
app.use('/api/v1/bins', telemetryHistoryRouter);
app.use('/api/v1/alerts', alertsRouter);
app.use('/api/v1/stores', storesRouter);
app.use('/api/v1/food-banks', foodBanksRouter);
app.use('/api/v1/organizations', organizationsRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/demo', demoRouter);

// ---------------------------------------------------------------------------
// Protected Routes (JWT required)
// ---------------------------------------------------------------------------
app.use('/api/v1/alerts', checkJwt, lifecycleRouter);  // approve, confirm-pickup
app.use('/api/v1', checkJwt, lifecycleRouter);          // stores/:id/bins, stores/:id/alerts, food-banks/:id/donations

// Health check — no auth required
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ---------------------------------------------------------------------------
// Auth error handler (returns JSON instead of HTML for 401/403)
// ---------------------------------------------------------------------------
app.use(authErrorHandler);

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ): void => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      ...(env.NODE_ENV === 'development' && { message: err.message }),
    });
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(env.PORT, () => {
  console.log(`🚀 Smart Cycle API running on port ${env.PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Health check: http://localhost:${env.PORT}/health`);
});

export default app;
