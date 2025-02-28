import { MiddlewareHandler } from 'hono';
import jwt from 'jsonwebtoken';
import { AuthUser } from '../types/index.js';

/**
 * Authentication middleware for Hono
 * Verifies the JWT token in the Authorization header
 */
export const auth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      { success: false, message: 'Authentication required' },
      401
    );
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return c.json(
      { success: false, message: 'Authentication required' },
      401
    );
  }
  
  try {
    // Verify token and extract user data
    const { env } = c.get('env');
    const user = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    
    // Set user in context
    c.set('user', user);
    
    await next();
  } catch (error) {
    return c.json(
      { success: false, message: 'Invalid or expired token' },
      401
    );
  }
}; 