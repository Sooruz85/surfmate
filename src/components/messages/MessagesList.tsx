'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Message, Trip } from '@/types'
import Link from 'next/link'

export default function MessagesList() {
  const [conversations, setConversations] = useState<Array<{
    trip: Trip
    lastMessage: Message | null
    unreadCount: number
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConversations = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Récupérer les trajets où l'utilisateur est créateur ou participant
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          spots:spot_id (
            name
          )
        `)
        .or(`creator_id.eq.${user.id},id.in.(
          select trip_id from trip_requests where user_id = ${user.id} and status = 'accepted'
        )`)

      if (tripsError) {
        console.error('Erreur lors de la récupération des trajets:', tripsError)
        return
      }

      // Récupérer le dernier message pour chaque trajet
      const conversationsWithMessages = await Promise.all(
        trips.map(async (trip) => {
          const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('trip_id', trip.id)
            .order('created_at', { ascending: false })
            .limit(1)

          if (messagesError) {
            console.error('Erreur lors de la récupération des messages:', messagesError)
            return { trip, lastMessage: null, unreadCount: 0 }
          }

          // Compter les messages non lus
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('trip_id', trip.id)
            .eq('read', false)
            .neq('sender_id', user.id)

          return {
            trip,
            lastMessage: messages[0] || null,
            unreadCount: unreadCount || 0
          }
        })
      )

      setConversations(conversationsWithMessages)
      setLoading(false)
    }

    fetchConversations()

    // S'abonner aux nouveaux messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMessage = payload.new as Message
        setConversations(prev => {
          return prev.map(conv => {
            if (conv.trip.id === newMessage.trip_id) {
              return {
                ...conv,
                lastMessage: newMessage,
                unreadCount: newMessage.sender_id !== user?.id ? conv.unreadCount + 1 : conv.unreadCount
              }
            }
            return conv
          })
        })
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center text-gray-500">
        Vous n'avez pas encore de conversations
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {conversations.map(({ trip, lastMessage, unreadCount }) => (
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
                {new Date(trip.departure_time).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {lastMessage && (
            <p className="mt-2 text-sm text-gray-600 truncate">
              {lastMessage.content}
            </p>
          )}
        </Link>
      ))}
    </div>
  )
}
