import { createClient } from '@supabase/supabase-js';
import { Event, Ticket } from '../types';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL as string;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY as string;

// You can pass a generic type to createClient if you generate Supabase types
export const supabase = createClient(supabaseUrl, supabaseAnonKey);