import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

export function getSupabaseClient() {
  if (!supabase && supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
  return supabase;
}

// Realtime channels
export const REALTIME_CHANNELS = {
  PARSING_PROGRESS: 'parsing-progress',
  PARSING_ERROR: 'parsing-error',
  PARSING_RETRY: 'parsing-retry'
};

/**
 * Subscribe to parsing progress updates
 */
export function subscribeToParsingProgress(sessionId, callback) {
  const client = getSupabaseClient();
  
  if (!client) {
    console.warn('Supabase client not initialized. Using fallback polling.');
    return () => {};
  }

  const channel = client
    .channel(REALTIME_CHANNELS.PARSING_PROGRESS)
    .on('broadcast', { event: 'progress' }, (payload) => {
      if (!sessionId || payload.payload.sessionId === sessionId) {
        callback({
          type: 'progress',
          ...payload.payload
        });
      }
    })
    .on('broadcast', { event: 'api-detected' }, (payload) => {
      if (!sessionId || payload.payload.sessionId === sessionId) {
        callback({
          type: 'api-detected',
          ...payload.payload
        });
      }
    })
    .on('broadcast', { event: 'error' }, (payload) => {
      if (!sessionId || payload.payload.sessionId === sessionId) {
        callback({
          type: 'error',
          ...payload.payload
        });
      }
    })
    .subscribe();

  // Return unsubscribe function
  return () => {
    client.removeChannel(channel);
  };
}

/**
 * Subscribe to parsing errors
 */
export function subscribeToParsingErrors(sessionId, callback) {
  const client = getSupabaseClient();
  
  if (!client) {
    console.warn('Supabase client not initialized.');
    return () => {};
  }

  const channel = client
    .channel(REALTIME_CHANNELS.PARSING_ERROR)
    .on('broadcast', { event: 'error' }, (payload) => {
      if (!sessionId || payload.payload.sessionId === sessionId) {
        callback(payload.payload);
      }
    })
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

/**
 * Subscribe to retry events
 */
export function subscribeToParsingRetries(sessionId, callback) {
  const client = getSupabaseClient();
  
  if (!client) {
    console.warn('Supabase client not initialized.');
    return () => {};
  }

  const channel = client
    .channel(REALTIME_CHANNELS.PARSING_RETRY)
    .on('broadcast', { event: 'retry' }, (payload) => {
      if (!sessionId || payload.payload.sessionId === sessionId) {
        callback(payload.payload);
      }
    })
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

/**
 * Fallback: Use Socket.IO if available (for backward compatibility)
 */
export function useRealtimeWithFallback(sessionId, onProgress, onError, onRetry) {
  const client = getSupabaseClient();
  
  // Try Supabase Realtime first
  if (client) {
    const unsubscribeProgress = subscribeToParsingProgress(sessionId, (data) => {
      if (data.type === 'progress' || data.type === 'api-detected') {
        onProgress?.(data);
      } else if (data.type === 'error') {
        onError?.(data);
      }
    });
    
    const unsubscribeRetry = subscribeToParsingRetries(sessionId, onRetry);
    
    return () => {
      unsubscribeProgress();
      unsubscribeRetry();
    };
  }
  
  // Fallback to Socket.IO if Supabase not available
  if (typeof io !== 'undefined') {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');
    
    socket.on('parsing-progress', (data) => {
      if (!sessionId || data.sessionId === sessionId) {
        onProgress?.(data);
      }
    });
    
    socket.on('parsing-error', (data) => {
      if (!sessionId || data.sessionId === sessionId) {
        onError?.(data);
      }
    });
    
    socket.on('parsing-retry', (data) => {
      if (!sessionId || data.sessionId === sessionId) {
        onRetry?.(data);
      }
    });
    
    return () => {
      socket.disconnect();
    };
  }
  
  // No realtime available
  console.warn('No realtime connection available');
  return () => {};
}
