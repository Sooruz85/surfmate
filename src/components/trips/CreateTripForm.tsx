'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Spot } from '@/types'

export default function CreateTripForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [spots, setSpots] = useState<Spot[]>([])
  const [formData, setFormData] = useState({
    spot_id: '',
    departure_time: '',
    available_seats: 1,
    difficulty_level: '',
    departure_point: {
      address: '',
      coordinates: { lat: 0, lng: 0 }
    }
  })

  useEffect(() => {
    const fetchSpots = async () => {
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .order('name')

      if (error) {
        console.error('Erreur lors de la récupération des spots:', error)
        setError('Une erreur est survenue lors de la récupération des spots.')
        return
      }

      setSpots(data || [])
    }

    fetchSpots()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { error: insertError } = await supabase
      .from('trips')
      .insert([
        {
          creator_id: user.id,
          spot_id: formData.spot_id,
          departure_time: formData.departure_time,
          available_seats: formData.available_seats,
          difficulty_level: formData.difficulty_level,
          departure_point: formData.departure_point,
          status: 'open'
        }
      ])

    if (insertError) {
      console.error('Erreur lors de la création du trajet:', insertError)
      setError('Une erreur est survenue lors de la création du trajet.')
      setLoading(false)
      return
    }

    router.push('/trips')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="spot_id" className="block text-sm font-medium text-gray-700">
          Spot
        </label>
        <select
          id="spot_id"
          value={formData.spot_id}
          onChange={(e) => setFormData({ ...formData, spot_id: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Sélectionnez un spot</option>
          {spots.map((spot) => (
            <option key={spot.id} value={spot.id}>
              {spot.name} - {spot.location}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="departure_time" className="block text-sm font-medium text-gray-700">
          Date et heure de départ
        </label>
        <input
          type="datetime-local"
          id="departure_time"
          value={formData.departure_time}
          onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="available_seats" className="block text-sm font-medium text-gray-700">
          Nombre de places disponibles
        </label>
        <input
          type="number"
          id="available_seats"
          min="1"
          value={formData.available_seats}
          onChange={(e) => setFormData({ ...formData, available_seats: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700">
          Niveau de difficulté
        </label>
        <select
          id="difficulty_level"
          value={formData.difficulty_level}
          onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Sélectionnez un niveau</option>
          <option value="beginner">Débutant</option>
          <option value="intermediate">Intermédiaire</option>
          <option value="advanced">Avancé</option>
        </select>
      </div>

      <div>
        <label htmlFor="departure_point" className="block text-sm font-medium text-gray-700">
          Point de départ
        </label>
        <input
          type="text"
          id="departure_point"
          value={formData.departure_point.address}
          onChange={(e) => setFormData({
            ...formData,
            departure_point: {
              ...formData.departure_point,
              address: e.target.value
            }
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Adresse du point de départ"
          required
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.push('/trips')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Création en cours...' : 'Créer le trajet'}
        </button>
      </div>
    </form>
  )
}
