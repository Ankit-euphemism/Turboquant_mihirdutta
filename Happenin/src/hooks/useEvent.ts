import { useEffect, useState } from 'react';
import { getLocalEvents } from '../services/eventServices';
import type { Event } from '../types';

type UseEventsResult = {
  events: Event[];
  loading: boolean;
};

export const useEvents = (): UseEventsResult => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getLocalEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  return { events, loading };
};