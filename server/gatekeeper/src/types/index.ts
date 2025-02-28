import { SupabaseClient } from '@supabase/supabase-js';
import { JwtPayload } from 'jsonwebtoken';

// Environment variables
export interface Env {
  PORT: number;
  RP_ID: string;
  ORIGIN: string;
  ELECTRIC_URL: string;
  ELECTRIC_SIGNING_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  JWT_SECRET: string;
}

// App context data structure
export interface AppData {
  env: Env;
  supabase: SupabaseClient;
  challengeStore: Map<string, string>;
}

// Extend Hono Context with user and env information
declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
    env: AppData;
  }
}

// User after authentication
export interface AuthUser extends JwtPayload {
  username: string;
}

// Registration request body
export interface RegisterRequestBody {
  username: string;
  displayName: string;
}

// Authentication request body
export interface AuthRequestBody {
  username: string;
}

// Credential data stored in Supabase
export interface StoredCredential {
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  created_at?: string;
}

// Changes request body
export interface ChangesRequestBody {
  table: string;
  changes: Array<{
    id: number;
    rowId: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    data: Record<string, any>;
  }>;
}

// Changes response
export interface ChangesResponse {
  success: boolean;
  results?: Array<{
    id: number;
    success: boolean;
  }>;
  errors?: Array<{
    id: number;
    success: boolean;
    message: string;
  }>;
  rollback?: {
    rows: Array<Record<string, any>>;
  };
}

// Define type for Hono app
export type AppContext = {
  Variables: {
    user: AuthUser;
    env: AppData;
  };
}; 