import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import { authRoutes } from './routes/auth.js';
import { syncRoutes } from './routes/sync.js';
import { errorHandler } from './middleware/error-handler.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { AppContext, Env, AppData } from './types/index.js';

// Load environment variables
dotenv.config();

// Initialize environment
const env: Env = {
  PORT: parseInt(process.env.PORT || '8080'),
  RP_ID: process.env.RP_ID || 'localhost',
  ORIGIN: process.env.ORIGIN || `http://localhost:5173`,
  ELECTRIC_URL: process.env.ELECTRIC_URL || 'http://localhost:5133',
  ELECTRIC_SIGNING_KEY: process.env.ELECTRIC_SIGNING_KEY || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || 'deplayer-jwt-secret',
};

// Validate required environment variables
if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_KEY are required');
  process.exit(1);
}

if (!env.ELECTRIC_URL || !env.ELECTRIC_SIGNING_KEY) {
  console.error('ELECTRIC_URL and ELECTRIC_SIGNING_KEY are required');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

// In-memory challenge store (use Redis in production)
const challengeStore = new Map<string, string>();

// Create Hono app with app context
const app = new Hono<AppContext>();

// Set bindings
app.use('*', async (c, next) => {
  c.set('env', {
    env,
    supabase,
    challengeStore
  });
  await next();
});

// Middleware
app.use('*', logger());
app.use('*', cors());
app.use('*', secureHeaders());
app.use('*', prettyJSON());
app.use('*', rateLimiter);
app.use('*', errorHandler);

// Routes
app.route('/', authRoutes);
app.route('/v1', syncRoutes);

// Not found handler
app.notFound((c) => {
  return c.json({ success: false, message: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ 
    success: false, 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  }, 500);
});

// Start server
console.log(`Starting server on port ${env.PORT}...`);
console.log(`RP_ID: ${env.RP_ID}`);
console.log(`ORIGIN: ${env.ORIGIN}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

serve({
  fetch: app.fetch,
  port: env.PORT
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('Shutting down server');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
