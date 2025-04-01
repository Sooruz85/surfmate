'use client'

import { useState, useEffect } from 'react'
import { Trip, Spot, User, TripRequest, Message } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

type TripDetailsProps = {
  trip: Trip & {
    spot: Spot
    creator: User
  }
}

export default function TripDetails({ trip }: TripDetailsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [tripRequest, setTripRequest] = useState<TripRequest | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setUser(profile)
      }
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('trip_id', trip.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erreur lors de la récupération des messages:', error)
        return
      }

      setMessages(data || [])
    }

    const fetchTripRequest = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('trip_requests')
        .select('*')
        .eq('trip_id', trip.id)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur lors de la récupération de la demande:', error)
        return
      }

      setTripRequest(data)
    }

    fetchUser()
    fetchMessages()
    fetchTripRequest()

    // Abonnement aux nouveaux messages
    const subscription = supabase
      .channel(`messages:${trip.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `trip_id=eq.${trip.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [trip.id, user])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    const { error } = await supabase
      .from('messages')
      .insert([
        {
          trip_id: trip.id,
          user_id: user.id,
          content: newMessage.trim()
        }
      ])

    if (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      return
    }

    setNewMessage('')
  }

  const handleRequestTrip = async () => {
    if (!user) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('trip_requests')
        .insert([
          {
            trip_id: trip.id,
            user_id: user.id,
            status: 'pending'
          }
        ])

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Erreur lors de la demande de trajet:', error)
      alert('Une erreur est survenue lors de la demande de trajet')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800'
      case 'full':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Places disponibles'
      case 'full':
        return 'Complet'
      case 'completed':
        return 'Terminé'
      case 'cancelled':
        return 'Annulé'
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{trip.spot.name}</h2>
            <p className="text-sm text-gray-500">Organisé par {trip.creator.full_name}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(trip.status)}`}>
            {getStatusText(trip.status)}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{trip.departure_point.address}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {format(new Date(trip.departure_time), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
            </span>
          </div>

          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{trip.available_seats} place{trip.available_seats > 1 ? 's' : ''} disponible{trip.available_seats > 1 ? 's' : ''}</span>
          </div>

          {trip.difficulty_level && (
            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Niveau {trip.difficulty_level}</span>
            </div>
          )}
        </div>

        {user && user.id !== trip.creator_id && trip.status === 'open' && !tripRequest && (
          <div className="mt-6">
            <button
              onClick={handleRequestTrip}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Envoi de la demande...' : 'Demander à rejoindre le trajet'}
            </button>
          </div>
        )}

        {tripRequest && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-md">
            <p className="text-yellow-800">
              Votre demande est en attente de confirmation
            </p>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages</h3>

        <div className="space-y-4 mb-6">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {(message as any).user.full_name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

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
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  )
}
