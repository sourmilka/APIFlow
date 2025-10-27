import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;
let supabaseAdmin = null;

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not set');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });

  return supabaseClient;
}

export function getSupabaseAdmin() {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase admin environment variables are not set');
  }

  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseAdmin;
}

// Realtime channels for progress updates
export const REALTIME_CHANNELS = {
  PARSING_PROGRESS: 'parsing-progress',
  PARSING_ERROR: 'parsing-error',
  PARSING_RETRY: 'parsing-retry',
};

// Send realtime update
export async function sendRealtimeUpdate(channel, event, payload) {
  try {
    const supabase = getSupabaseClient();
    
    // Use Supabase Realtime to broadcast events
    const channelInstance = supabase.channel(channel);
    await channelInstance.send({
      type: 'broadcast',
      event,
      payload,
    });
    
    return true;
  } catch (error) {
    console.error('Error sending realtime update:', error);
    return false;
  }
}
