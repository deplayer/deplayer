import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { AppContext, AuthRequestBody, RegisterRequestBody, StoredCredential } from '../types/index.js';

// Define validation schemas
const registerSchema = z.object({
  username: z.string().min(3),
  displayName: z.string().min(1)
});

const authSchema = z.object({
  username: z.string().min(3)
});

// Create router
export const authRoutes = new Hono<AppContext>();

/**
 * Start WebAuthn registration
 * POST /register
 */
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const { username, displayName } = await c.req.json<RegisterRequestBody>();
  const { env, challengeStore } = c.get('env');
  
  try {
    const options = await generateRegistrationOptions({
      rpName: 'Deplayer',
      rpID: env.RP_ID,
      userID: username,
      userName: username,
      userDisplayName: displayName,
      attestationType: 'none',
    });
    
    // Store challenge for verification
    challengeStore.set(username, options.challenge);
    
    return c.json(options);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json(
      { success: false, message: 'Failed to generate registration options' },
      500
    );
  }
});

/**
 * Complete WebAuthn registration
 * POST /register/verify
 */
authRoutes.post('/register/verify', async (c) => {
  const { username, credential } = await c.req.json();
  const { env, supabase, challengeStore } = c.get('env');
  const challenge = challengeStore.get(username);
  
  if (!challenge) {
    return c.json(
      { success: false, message: 'Challenge not found' },
      400
    );
  }
  
  try {
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: env.ORIGIN,
      expectedRPID: env.RP_ID,
    });
    
    if (verification.verified && verification.registrationInfo) {
      // Store the credential in Supabase
      const { error } = await supabase.from('credentials').insert({
        user_id: username,
        credential_id: Buffer.from(verification.registrationInfo.credentialID).toString('base64'),
        public_key: Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64'),
        counter: verification.registrationInfo.counter,
      });
      
      if (error) throw error;
      
      // Generate JWT token
      const token = jwt.sign({ username }, env.JWT_SECRET);
      return c.json({ success: true, token });
    } else {
      return c.json(
        { success: false, message: 'Verification failed' },
        400
      );
    }
  } catch (error) {
    console.error('Verification error:', error);
    return c.json(
      { success: false, message: 'Verification failed' },
      500
    );
  } finally {
    challengeStore.delete(username);
  }
});

/**
 * Start WebAuthn authentication
 * POST /auth
 */
authRoutes.post('/auth', zValidator('json', authSchema), async (c) => {
  const { username } = await c.req.json<AuthRequestBody>();
  const { env, supabase, challengeStore } = c.get('env');
  
  try {
    // Get user credentials from Supabase
    const { data, error } = await supabase
      .from('credentials')
      .select()
      .eq('user_id', username)
      .single<StoredCredential>();
    
    if (error || !data) {
      return c.json(
        { success: false, message: 'User not found' },
        404
      );
    }
    
    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: env.RP_ID,
      allowCredentials: [
        {
          id: Buffer.from(data.credential_id, 'base64'),
          type: 'public-key',
        },
      ],
    });
    
    // Store challenge for verification
    challengeStore.set(username, options.challenge);
    
    return c.json(options);
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json(
      { success: false, message: 'Failed to generate authentication options' },
      500
    );
  }
});

/**
 * Complete WebAuthn authentication
 * POST /auth/verify
 */
authRoutes.post('/auth/verify', async (c) => {
  const { username, credential } = await c.req.json();
  const { env, supabase, challengeStore } = c.get('env');
  const challenge = challengeStore.get(username);
  
  if (!challenge) {
    return c.json(
      { success: false, message: 'Challenge not found' },
      400
    );
  }
  
  try {
    // Get user credentials from Supabase
    const { data, error } = await supabase
      .from('credentials')
      .select()
      .eq('user_id', username)
      .single<StoredCredential>();
    
    if (error || !data) {
      return c.json(
        { success: false, message: 'User not found' },
        404
      );
    }
    
    // Verify authentication response
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: env.ORIGIN,
      expectedRPID: env.RP_ID,
      authenticator: {
        credentialPublicKey: Buffer.from(data.public_key, 'base64'),
        credentialID: Buffer.from(data.credential_id, 'base64'),
        counter: data.counter,
      },
    });
    
    if (verification.verified) {
      // Update counter in Supabase
      await supabase
        .from('credentials')
        .update({ counter: verification.authenticationInfo.newCounter })
        .eq('user_id', username);
      
      // Generate JWT token
      const token = jwt.sign({ username }, env.JWT_SECRET);
      return c.json({ success: true, token });
    } else {
      return c.json(
        { success: false, message: 'Verification failed' },
        400
      );
    }
  } catch (error) {
    console.error('Verification error:', error);
    return c.json(
      { success: false, message: 'Verification failed' },
      500
    );
  } finally {
    challengeStore.delete(username);
  }
}); 