import { MiddlewareHandler } from 'hono';

/**
 * Error handler middleware for Hono
 * Catches and formats errors that occur during request processing
 */
export const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Unhandled error:', error);
    
    // Get error message
    const message = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    // Determine if we should include details (only in development)
    const isDev = process.env.NODE_ENV === 'development';
    
    return c.json({
      success: false,
      message: 'Internal Server Error',
      error: isDev ? message : undefined
    }, 500);
  }
}; 