// This file should be on the server side, not accessible to the client
// It could be implemented in a Next.js API route, Express server, 
// or any other server-side technology your project uses

import { createClient } from '@supabase/supabase-js';

// Access environment variables without the VITE_ prefix
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Initialize Supabase client on the server side
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or key in server environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Example functions to interact with Supabase
// These will be called from your API endpoints

/**
 * Get data from a Supabase table
 */
export async function getData(table: string, query: any = {}) {
  try {
    let queryBuilder = supabase
      .from(table)
      .select('*');
    
    // Apply filters if provided
    if (query.filters) {
      Object.entries(query.filters).forEach(([column, value]) => {
        queryBuilder = queryBuilder.eq(column, value);
      });
    }
    
    // Apply order if provided
    if (query.orderBy) {
      queryBuilder = queryBuilder.order(query.orderBy.column, { 
        ascending: query.orderBy.ascending 
      });
    }
    
    // Apply pagination if provided
    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }
    
    if (query.offset) {
      queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 10) - 1);
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching data from Supabase:', error);
    throw error;
  }
}

/**
 * Insert data into a Supabase table
 */
export async function insertData(table: string, data: any) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
    
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error inserting data into Supabase:', error);
    throw error;
  }
}

/**
 * Update data in a Supabase table
 */
export async function updateData(table: string, id: string, data: any) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error updating data in Supabase:', error);
    throw error;
  }
}

/**
 * Delete data from a Supabase table
 */
export async function deleteData(table: string, id: string) {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting data from Supabase:', error);
    throw error;
  }
}

/**
 * Authenticate a user with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Return only what's needed by the client
    return {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at,
      } : null,
      session: data.session ? {
        accessToken: data.session.access_token,
        expiresAt: data.session.expires_at,
      } : null,
    };
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Return only what's needed by the client
    return {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at,
      } : null,
      session: data.session ? {
        accessToken: data.session.access_token,
        expiresAt: data.session.expires_at,
      } : null,
    };
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
} 