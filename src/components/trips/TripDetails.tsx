'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trip, TripRequest, Message } from '@/types'

interface TripDetailsProps {
  tripId: string
}

export default function TripDetails({ tripId }: TripDetailsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [requests, setRequests] = useState<TripRequest[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user?.id || null)
    }
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const fetchTrip = async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          spots (
            name,
            location,
            description
          ),
          profiles:creator_id (
            full_name
          )
        `)
        .eq('id', tripId)
        .single()

      if (error) {
        console.error('Erreur lors de la récupération du trajet:', error)
        setError('Une erreur est survenue lors de la récupération du trajet.')
        setLoading(false)
        return
      }

      setTrip(data)
      setLoading(false)
    }

    fetchTrip()

    const subscription = supabase
      .channel('trip_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` }, () => {
        fetchTrip()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [tripId])

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('trip_requests')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors de la récupération des demandes:', error)
        return
      }

      setRequests(data || [])
    }

    fetchRequests()

    const subscription = supabase
      .channel('trip_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_requests', filter: `trip_id=eq.${tripId}` }, () => {
        fetchRequests()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [tripId])

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erreur lors de la récupération des messages:', error)
        return
      }

      setMessages(data || [])
    }

    fetchMessages()

    const subscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `trip_id=eq.${tripId}` }, () => {
        fetchMessages()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [tripId])

  const handleRequestJoin = async () => {
    if (!currentUser) {
      router.push('/login')
      return
    }

    const { error: requestError } = await supabase
      .from('trip_requests')
      .insert([
        {
          trip_id: tripId,
          user_id: currentUser,
          status: 'pending'
        }
      ])

    if (requestError) {
      console.error('Erreur lors de la création de la demande:', requestError)
      setError('Une erreur est survenue lors de la création de la demande.')
    }
  }

  const handleRequestResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
    const { error: updateError } = await supabase
      .from('trip_requests')
      .update({ status })
      .eq('id', requestId)

    if (updateError) {
      console.error('Erreur lors de la mise à jour de la demande:', updateError)
      setError('Une erreur est survenue lors de la mise à jour de la demande.')
      return
    }

    if (status === 'accepted') {
      const { error: tripError } = await supabase
        .from('trips')
        .update({ available_seats: (trip?.available_seats || 0) - 1 })
        .eq('id', tripId)

      if (tripError) {
        console.error('Erreur lors de la mise à jour du trajet:', tripError)
        setError('Une erreur est survenue lors de la mise à jour du trajet.')
      }
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !newMessage.trim()) return

    const { error: messageError } = await supabase
      .from('messages')
      .insert([
        {
          trip_id: tripId,
          user_id: currentUser,
          content: newMessage.trim()
        }
      ])

    if (messageError) {
      console.error('Erreur lors de l\'envoi du message:', messageError)
      setError('Une erreur est survenue lors de l\'envoi du message.')
      return
    }

    setNewMessage('')
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    )
  }

  if (!trip) {
    return null
  }

  const isCreator = currentUser === trip.creator_id
  const hasPendingRequest = requests.some(
    request => request.user_id === currentUser && request.status === 'pending'
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{trip.spots?.name}</h2>
          <p className="mt-1 text-sm text-gray-500">{trip.spots?.location}</p>
        </div>
        <div className="flex space-x-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            trip.status === 'open' ? 'bg-green-100 text-green-800' :
            trip.status === 'closed' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {trip.status === 'open' ? 'Ouvert' :
             trip.status === 'closed' ? 'Fermé' :
             'En cours'}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {trip.available_seats} places
          </span>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Informations du trajet
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Organisateur</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {trip.profiles?.full_name}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Date et heure</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(trip.departure_time).toLocaleString('fr-FR')}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description du spot</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {trip.spots?.description}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {!isCreator && trip.status === 'open' && !hasPendingRequest && (
        <div className="flex justify-center">
          <button
            onClick={handleRequestJoin}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Demander à rejoindre
          </button>
        </div>
      )}

      {isCreator && requests.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Demandes de participation
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {requests.map((request) => (
                <li key={request.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {request.profiles?.full_name}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    {request.status === 'pending' && (
                      <div className="ml-4 flex-shrink-0 flex space-x-4">
                        <button
                          onClick={() => handleRequestResponse(request.id, 'accepted')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleRequestResponse(request.id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Messages
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-4 sm:px-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {message.profiles?.full_name}
                      </p>
                      <p className="ml-2 text-sm text-gray-500">
                        {new Date(message.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Envoyer
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => router.push('/trips')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Retour à la liste
        </button>
      </div>
    </div>
  )
}
