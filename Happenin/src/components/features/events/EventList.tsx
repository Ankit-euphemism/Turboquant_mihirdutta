import { useEvents } from '../../../hooks/useEvent';
import type { Event } from '../../../types';

const EventList = () => {
  const { events, loading } = useEvents();

  if (loading) {
    return <div className="animate-pulse">Loading the Pulse...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event: Event) => {
        const eventDate = new Date(event.created_at).toLocaleDateString();

        return (
          <div
            key={event.id}
            className="rounded-xl border border-gray-800 bg-gray-900 p-4 transition-all hover:border-blue-500"
          >
            <img
              src={event.image_url}
              alt={event.title}
              className="h-40 w-full rounded-lg object-cover"
            />
            <h3 className="mt-2 text-xl font-bold text-white">{event.title}</h3>
            <p className="text-sm text-gray-400">
              {event.location} • {eventDate}
            </p>
            <button className="mt-4 w-full rounded-lg bg-blue-600 py-2 font-semibold hover:bg-blue-700">
              Get Ticket
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default EventList;
