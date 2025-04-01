'use client'

import { useState, useEffect } from 'react'
import { Spot } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CreateTripForm() {
  const router = useRouter()
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    spot_id: '',
    departure_point: {
      latitude: 0,
      longitude: 0,
      address: ''
    },
    departure_time: '',
    available_seats: 1,
    difficulty_level: '',
    status: 'open'
  })

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

      setSpots(data || [])
    }

    fetchSpots()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      const { error } = await supabase
        .from('trips')
        .insert([
          {
            ...formData,
            creator_id: user.id
          }
        ])

      if (error) throw error

      router.push('/trips')
      router.refresh()
    } catch (error) {
      console.error('Erreur lors de la création du trajet:', error)
      alert('Une erreur est survenue lors de la création du trajet')
    } finally {
      setLoading(false)
    }
  }

  const handleSpotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const spotId = e.target.value
    const selectedSpot = spots.find(spot => spot.id === spotId)

    if (selectedSpot) {
      setFormData(prev => ({
        ...prev,
        spot_id: spotId,
        departure_point: {
          latitude: selectedSpot.latitude,
          longitude: selectedSpot.longitude,
          address: selectedSpot.name
        }
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="spot" className="block text-sm font-medium text-gray-700">
          Spot de surf
        </label>
        <select
          id="spot"
          name="spot_id"
          required
          value={formData.spot_id}
          onChange={handleSpotChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          name="departure_time"
          required
          value={formData.departure_time}
          onChange={(e) => setFormData(prev => ({ ...prev, departure_time: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="available_seats" className="block text-sm font-medium text-gray-700">
          Nombre de places disponibles
        </label>
        <input
          type="number"
          id="available_seats"
          name="available_seats"
          min="1"
          max="8"
          required
          value={formData.available_seats}
          onChange={(e) => setFormData(prev => ({ ...prev, available_seats: parseInt(e.target.value) }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700">
          Niveau de difficulté
        </label>
        <select
          id="difficulty_level"
          name="difficulty_level"
          value={formData.difficulty_level}
          onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          onClick={() => router.back()}
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
