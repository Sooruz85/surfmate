'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { TripRequest, Trip } from '@/types'
import Link from 'next/link'

export default function TripRequestsList() {
  const [requests, setRequests] = useState<Array<{
    request: TripRequest
    trip: Trip & {
      spots: { name: string }
      profiles: { full_name: string }
    }
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRequests = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Récupérer les demandes pour les trajets dont l'utilisateur est créateur
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
        .eq('trips.creator_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors de la récupération des demandes:', error)
        return
      }

      setRequests(data.map(item => ({
        request: item,
        trip: item.trips
      })))
      setLoading(false)
    }

    fetchRequests()

    // S'abonner aux nouvelles demandes
    const subscription = supabase
      .channel('trip_requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trip_requests' }, payload => {
        const newRequest = payload.new as TripRequest
        if (newRequest.status === 'pending') {
          fetchRequests()
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('trip_requests')
      .update({ status })
      .eq('id', requestId)

    if (error) {
      console.error('Erreur lors de la mise à jour de la demande:', error)
      return
    }

    // Mettre à jour le nombre de places disponibles si la demande est acceptée
    if (status === 'accepted') {
      const request = requests.find(r => r.request.id === requestId)
      if (request) {
        const { error: tripError } = await supabase
          .from('trips')
          .update({
            available_seats: request.trip.available_seats - 1
          })
          .eq('id', request.trip.id)

        if (tripError) {
          console.error('Erreur lors de la mise à jour du trajet:', tripError)
          return
        }
      }
    }

    // Rafraîchir la liste des demandes
    setRequests(prev => prev.filter(r => r.request.id !== requestId))
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center text-gray-500">
        Aucune demande en attente
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map(({ request, trip }) => (
        <div key={request.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start">
            <div>
              <Link href={`/trips/${trip.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                {trip.spots.name}
              </Link>
              <p className="text-sm text-gray-500">
                Demande de {trip.profiles.full_name}
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
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => handleRequest(request.id, 'rejected')}
              className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Refuser
            </button>
            <button
              onClick={() => handleRequest(request.id, 'accepted')}
              className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Accepter
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
