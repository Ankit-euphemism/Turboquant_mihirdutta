import { supabase } from '../lib/supabase';
import type { Event } from '../types';

export const getLocalEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Event[];
};