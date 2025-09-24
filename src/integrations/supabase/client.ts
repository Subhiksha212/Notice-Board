import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ujklzljgjltfbiaiogsl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqa2x6bGpnamx0ZmJpYWlvZ3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczODQ4MTgsImV4cCI6MjA3Mjk2MDgxOH0.pm-gAgctsLsfy_m-ElEJfWn7RBGe0hkcSaymvlKpOsk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});