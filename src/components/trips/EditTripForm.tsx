'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Trip, Spot } from '@/types'
import { useRouter } from 'next/navigation'

interface EditTripFormProps {
  tripId: string
}

export default function EditTripForm({ tripId }: EditTripFormProps) {
  const router = useRouter()
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    spot_id: '',
    departure_time: '',
    available_seats: '',
    difficulty: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      // Récupérer les spots
      const { data: spotsData, error: spotsError } = await supabase
        .from('spots')
        .select('*')
        .order('name')

      if (spotsError) {
        console.error('Erreur lors de la récupération des spots:', spotsError)
        return
      }

      setSpots(spotsData)

      // Récupérer les détails du trajet
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single()

      if (tripError) {
        console.error('Erreur lors de la récupération du trajet:', tripError)
        return
      }

      setFormData({
        spot_id: tripData.spot_id,
        departure_time: new Date(tripData.departure_time).toISOString().slice(0, 16),
        available_seats: tripData.available_seats.toString(),
        difficulty: tripData.difficulty
      })

      setLoading(false)
    }

    fetchData()
  }, [tripId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('trips')
      .update({
        spot_id: formData.spot_id,
        departure_time: formData.departure_time,
        available_seats: parseInt(formData.available_seats),
        difficulty: formData.difficulty
      })
      .eq('id', tripId)

    if (updateError) {
      console.error('Erreur lors de la mise à jour du trajet:', updateError)
      setError('Une erreur est survenue lors de la mise à jour du trajet.')
      setLoading(false)
      return
    }

    router.push('/trips/my-trips')
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
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
          Spot de surf
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
              {spot.name}
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
          onChange={(e) => setFormData({ ...formData, available_seats: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
          Niveau de difficulté
        </label>
        <select
          id="difficulty"
          value={formData.difficulty}
          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Sélectionnez un niveau</option>
          <option value="beginner">Débutant</option>
          <option value="intermediate">Intermédiaire</option>
          <option value="advanced">Avancé</option>
        </select>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.push('/trips/my-trips')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
