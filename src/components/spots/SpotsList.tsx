'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Spot } from '@/types'
import Link from 'next/link'

export default function SpotsList() {
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSpots = async () => {
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .order('name')

      if (error) {
        console.error('Erreur lors de la récupération des spots:', error)
        return
      }

      setSpots(data)
      setLoading(false)
    }

    fetchSpots()

    // S'abonner aux modifications des spots
    const subscription = supabase
      .channel('spots')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spots' }, () => {
        fetchSpots()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleDeleteSpot = async (spotId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce spot ? Cette action est irréversible.')) return

    const { error } = await supabase
      .from('spots')
      .delete()
      .eq('id', spotId)

    if (error) {
      console.error('Erreur lors de la suppression du spot:', error)
      return
    }

    // Rafraîchir la liste des spots
    setSpots(prev => prev.filter(spot => spot.id !== spotId))
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  if (spots.length === 0) {
    return (
      <div className="text-center text-gray-500">
        Aucun spot de surf enregistré
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {spots.map((spot) => (
        <div key={spot.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-900">
                {spot.name}
              </h3>
              <p className="text-sm text-gray-500">
                {spot.location}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              spot.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
              spot.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {spot.difficulty === 'beginner' ? 'Débutant' :
               spot.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <p>{spot.description}</p>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <Link
              href={`/spots/${spot.id}/edit`}
              className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Modifier
            </Link>
            <button
              onClick={() => handleDeleteSpot(spot.id)}
              className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
