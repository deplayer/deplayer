import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AppContext, ChangesRequestBody, ChangesResponse } from '../types/index.js';
import { auth } from '../middleware/auth.js';

// Define validation schemas
const changesSchema = z.object({
  table: z.string(),
  changes: z.array(
    z.object({
      id: z.number(),
      rowId: z.string(),
      operation: z.enum(['INSERT', 'UPDATE', 'DELETE']),
      data: z.record(z.unknown())
    })
  )
});

// Create router with AppContext
export const syncRoutes = new Hono<AppContext>();

// Require authentication for all sync routes
syncRoutes.use('*', auth);

/**
 * ElectricSQL shape endpoint for read-path synchronization
 * GET /v1/shape
 */
syncRoutes.get('/shape', async (c) => {
  const { env } = c.get('env');
  const user = c.get('user');
  const table = c.req.query('table');
  
  if (!table) {
    return c.json(
      { success: false, message: 'Table parameter is required' },
      400
    );
  }
  
  try {
    // Forward the request to ElectricSQL
    const response = await fetch(`${env.ELECTRIC_URL}/v1/shape?table=${table}`, {
      method: 'GET',
      headers: {
        'X-User-ID': user.username,
        'Authorization': `Bearer ${env.ELECTRIC_SIGNING_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Electric server responded with ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error fetching shape data:', error);
    return c.json(
      { success: false, message: 'Error fetching shape data from ElectricSQL' },
      500
    );
  }
});

/**
 * Generic proxy for other ElectricSQL endpoints
 * ALL /v1/electric/*
 */
syncRoutes.all('/electric/*', async (c) => {
  const { env } = c.get('env');
  const user = c.get('user');
  
  // Get path after /electric/
  const path = c.req.path.replace('/v1/electric/', '');
  
  try {
    // Get request body if not GET
    let body = undefined;
    if (c.req.method !== 'GET') {
      body = await c.req.json();
    }
    
    // Forward the request to ElectricSQL
    const response = await fetch(`${env.ELECTRIC_URL}/${path}`, {
      method: c.req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': user.username,
        'Authorization': `Bearer ${env.ELECTRIC_SIGNING_KEY}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const data = await response.json();
    // Use the appropriate status code from the response
    const statusCode = response.status as any;
    return c.json(data, statusCode);
  } catch (error) {
    console.error('Error proxying to ElectricSQL:', error);
    return c.json(
      { success: false, message: 'Error communicating with ElectricSQL' },
      500
    );
  }
});

/**
 * Custom endpoint for write-path synchronization
 * POST /v1/changes
 */
syncRoutes.post('/changes', zValidator('json', changesSchema), async (c) => {
  const { table, changes } = await c.req.json<ChangesRequestBody>();
  const user = c.get('user');
  
  try {
    console.log(`Processing ${changes.length} changes for table ${table} from user ${user.username}`);
    
    // Process each change (this is a simplified implementation)
    // In a real implementation, this would interact with a database
    const results: any[] = [];
    const errors: any[] = [];
    
    for (const change of changes) {
      try {
        // In a real implementation, you would:
        // 1. Verify user has access to this data
        // 2. Check for conflicts
        // 3. Apply the change to the database
        
        console.log(`Processing change: ${change.operation} for ${table}/${change.rowId}`);
        
        // Simulate successful processing
        results.push({ id: change.id, success: true });
      } catch (error) {
        console.error(`Error processing change ${change.id}:`, error);
        errors.push({
          id: change.id,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const response: ChangesResponse = {
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined
    };
    
    return c.json(response);
  } catch (error) {
    console.error('Error processing changes:', error);
    return c.json(
      { success: false, message: 'Error processing changes' },
      500
    );
  }
}); 