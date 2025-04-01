export type User = {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
}

export type Spot = {
  id: string
  name: string
  latitude: number
  longitude: number
  description?: string
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  created_at: string
}

export type Trip = {
  id: string
  spot_id: string
  creator_id: string
  departure_point: {
    latitude: number
    longitude: number
    address: string
  }
  departure_time: string
  available_seats: number
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  status: 'open' | 'full' | 'completed' | 'cancelled'
  created_at: string
}

export type TripRequest = {
  id: string
  trip_id: string
  user_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export type Message = {
  id: string
  trip_id: string
  user_id: string
  content: string
  created_at: string
}
