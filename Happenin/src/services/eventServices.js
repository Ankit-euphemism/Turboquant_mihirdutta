import { supabase } from '../lib/supabaseClient';

export const getLocalEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};