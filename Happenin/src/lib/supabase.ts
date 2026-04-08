import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY as string;

// You can pass a generic type to createClient if you generate Supabase types
export const supabase = createClient(supabaseUrl, supabaseAnonKey);