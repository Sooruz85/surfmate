'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Trip } from '@/types'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function SearchResults() {
  const searchParams = useSearchParams()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrips = async () => {
      let query = supabase
        .from('trips')
        .select(`
          *,
          spots:spot_id (
            name
          ),
          profiles:creator_id (
            full_name
          )
        `)
        .eq('status', 'open')

      // Appliquer les filtres
      const spot_id = searchParams.get('spot_id')
      if (spot_id) {
        query = query.eq('spot_id', spot_id)
      }

      const date = searchParams.get('date')
      if (date) {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)
        query = query
          .gte('departure_time', startOfDay.toISOString())
          .lte('departure_time', endOfDay.toISOString())
      }

      const difficulty = searchParams.get('difficulty')
      if (difficulty) {
        query = query.eq('difficulty', difficulty)
      }

      const { data, error } = await query.order('departure_time', { ascending: true })

      if (error) {
        console.error('Erreur lors de la récupération des trajets:', error)
        return
      }

      setTrips(data)
      setLoading(false)
    }

    fetchTrips()
  }, [searchParams])

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  if (trips.length === 0) {
    return (
      <div className="text-center text-gray-500">
        Aucun trajet trouvé pour ces critères
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <Link
          key={trip.id}
          href={`/trips/${trip.id}`}
          className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-900">
                {trip.spots.name}
              </h3>
              <p className="text-sm text-gray-500">
                Organisé par {trip.profiles.full_name}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              trip.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
              trip.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {trip.difficulty === 'beginner' ? 'Débutant' :
               trip.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Départ :</span>
              <p>{new Date(trip.departure_time).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            <div>
              <span className="font-medium">Places disponibles :</span>
              <p>{trip.available_seats}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
