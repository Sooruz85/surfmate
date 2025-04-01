'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Trip } from '@/types'
import Link from 'next/link'

export default function MyTripsList() {
  const [trips, setTrips] = useState<Array<Trip & {
    spots: { name: string }
    profiles: { full_name: string }
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrips = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
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
        .eq('creator_id', user.id)
        .order('departure_time', { ascending: true })

      if (error) {
        console.error('Erreur lors de la récupération des trajets:', error)
        return
      }

      setTrips(data)
      setLoading(false)
    }

    fetchTrips()

    // S'abonner aux modifications des trajets
    const subscription = supabase
      .channel('trips')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, payload => {
        if (payload.new.creator_id === user?.id) {
          fetchTrips()
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleCancelTrip = async (tripId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce trajet ?')) return

    const { error } = await supabase
      .from('trips')
      .update({ status: 'cancelled' })
      .eq('id', tripId)

    if (error) {
      console.error('Erreur lors de l\'annulation du trajet:', error)
      return
    }

    // Rafraîchir la liste des trajets
    setTrips(prev => prev.filter(trip => trip.id !== tripId))
  }

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
        Vous n'avez pas encore créé de trajets
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <div key={trip.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start">
            <div>
              <Link href={`/trips/${trip.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                {trip.spots.name}
              </Link>
              <p className="text-sm text-gray-500">
                {new Date(trip.departure_time).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              trip.status === 'open' ? 'bg-green-100 text-green-800' :
              trip.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {trip.status === 'open' ? 'Ouvert' :
               trip.status === 'cancelled' ? 'Annulé' : 'En cours'}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Places disponibles :</span>
              <p>{trip.available_seats}</p>
            </div>
            <div>
              <span className="font-medium">Niveau :</span>
              <p className="capitalize">{trip.difficulty}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            {trip.status === 'open' && (
              <>
                <Link
                  href={`/trips/${trip.id}/edit`}
                  className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Modifier
                </Link>
                <button
                  onClick={() => handleCancelTrip(trip.id)}
                  className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
