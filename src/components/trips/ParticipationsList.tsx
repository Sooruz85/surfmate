'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Trip, TripRequest } from '@/types'
import Link from 'next/link'

export default function ParticipationsList() {
  const [participations, setParticipations] = useState<Array<{
    trip: Trip & {
      spots: { name: string }
      profiles: { full_name: string }
    }
    request: TripRequest
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchParticipations = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Récupérer les demandes acceptées de l'utilisateur
      const { data, error } = await supabase
        .from('trip_requests')
        .select(`
          *,
          trips:trip_id (
            *,
            spots:spot_id (
              name
            ),
            profiles:creator_id (
              full_name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors de la récupération des participations:', error)
        return
      }

      setParticipations(data.map(item => ({
        trip: item.trips,
        request: item
      })))
      setLoading(false)
    }

    fetchParticipations()

    // S'abonner aux modifications des demandes
    const subscription = supabase
      .channel('trip_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_requests' }, payload => {
        if (payload.new.user_id === user?.id) {
          fetchParticipations()
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleCancelParticipation = async (tripId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre participation ?')) return

    const { error } = await supabase
      .from('trip_requests')
      .update({ status: 'cancelled' })
      .eq('trip_id', tripId)

    if (error) {
      console.error('Erreur lors de l\'annulation de la participation:', error)
      return
    }

    // Rafraîchir la liste des participations
    setParticipations(prev => prev.filter(p => p.trip.id !== tripId))
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  if (participations.length === 0) {
    return (
      <div className="text-center text-gray-500">
        Vous ne participez à aucun trajet pour le moment
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {participations.map(({ trip, request }) => (
        <div key={trip.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start">
            <div>
              <Link href={`/trips/${trip.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                {trip.spots.name}
              </Link>
              <p className="text-sm text-gray-500">
                Organisé par {trip.profiles.full_name}
              </p>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(request.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
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
              <span className="font-medium">Niveau :</span>
              <p className="capitalize">{trip.difficulty}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => handleCancelParticipation(trip.id)}
              className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Annuler la participation
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
