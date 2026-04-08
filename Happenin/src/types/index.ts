export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  max_capacity: number;
  image_url: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  event_id: string;
  user_id: string;
  is_checked_in: boolean;
  updated_at: string;
}