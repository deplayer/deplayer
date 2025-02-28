import { MiddlewareHandler } from 'hono';

// Simple in-memory rate limiter
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const ipRequests = new Map<string, RateLimitEntry>();
const MAX_REQUESTS = 60; // 60 requests per minute
const WINDOW_MS = 60 * 1000; // 1 minute window

/**
 * Rate limiter middleware for Hono
 * Limits requests by IP address
 */
export const rateLimiter: MiddlewareHandler = async (c, next) => {
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const now = Date.now();
  
  // Initialize or reset expired entries
  if (!ipRequests.has(ip) || (ipRequests.get(ip)?.resetTime || 0) < now) {
    ipRequests.set(ip, {
      count: 0,
      resetTime: now + WINDOW_MS
    });
  }
  
  // Get and increment request count
  const entry = ipRequests.get(ip)!;
  entry.count++;
  
  // Check if limit has been reached
  if (entry.count > MAX_REQUESTS) {
    return c.json(
      { success: false, message: 'Too many requests, please try again later' },
      429
    );
  }
  
  // Clean up old entries periodically (1% chance per request)
  if (Math.random() < 0.01) {
    for (const [key, value] of ipRequests.entries()) {
      if (value.resetTime < now) {
        ipRequests.delete(key);
      }
    }
  }
  
  await next();
}; 