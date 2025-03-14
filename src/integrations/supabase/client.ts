// IMPORTANT: This file is maintained for backward compatibility
// It uses our secure client implementation that doesn't expose API keys to the client
import type { Database } from './types';

// Import the secure client
import { supabase as secureClient } from '../../lib/supabase-client';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Cast to keep TypeScript happy with Database typing
export const supabase = secureClient as any;