import type { Event } from '../types';
import { supabase } from '../lib/supabase';

export const getLocalEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Event[];
};
