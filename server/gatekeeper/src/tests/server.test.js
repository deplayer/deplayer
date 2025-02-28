/**
 * Basic server loading test
 * 
 * This test ensures that all imports are working correctly
 * and the server can initialize without crashing.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import the main application modules to test they load properly
describe('Server initialization', () => {
  it('should import all server modules without errors', async () => {
    try {
      // Dynamically import the modules to test
      const authMiddleware = await import('../middleware/auth.js');
      const authRoutes = await import('../routes/auth.js');
      const syncRoutes = await import('../routes/sync.js');
      
      // Verify that the imported modules have the expected exports
      assert.strictEqual(typeof authMiddleware.auth, 'function', 'auth middleware should be a function');
      assert.strictEqual(typeof authRoutes.authRoutes, 'object', 'authRoutes should be a Hono object');
      assert.strictEqual(typeof syncRoutes.syncRoutes, 'object', 'syncRoutes should be a Hono object');
      
      console.log('✅ All server modules imported successfully');
    } catch (error) {
      console.error('❌ Error importing server modules:', error);
      throw error;
    }
  });
}); 