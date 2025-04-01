'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Spot } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SearchTripsForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    spot_id: searchParams.get('spot_id') || '',
    date: searchParams.get('date') || '',
    difficulty: searchParams.get('difficulty') || ''
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

      setSpots(data)
    }

    fetchSpots()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const params = new URLSearchParams()
    if (formData.spot_id) params.append('spot_id', formData.spot_id)
    if (formData.date) params.append('date', formData.date)
    if (formData.difficulty) params.append('difficulty', formData.difficulty)

    router.push(`/trips/search?${params.toString()}`)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="spot_id" className="block text-sm font-medium text-gray-700">
          Spot de surf
        </label>
        <select
          id="spot_id"
          value={formData.spot_id}
          onChange={(e) => setFormData({ ...formData, spot_id: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Tous les spots</option>
          {spots.map((spot) => (
            <option key={spot.id} value={spot.id}>
              {spot.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          type="date"
          id="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
        >
          <option value="">Tous les niveaux</option>
          <option value="beginner">Débutant</option>
          <option value="intermediate">Intermédiaire</option>
          <option value="advanced">Avancé</option>
        </select>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => {
            setFormData({ spot_id: '', date: '', difficulty: '' })
            router.push('/trips/search')
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Réinitialiser
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Recherche...' : 'Rechercher'}
        </button>
      </div>
    </form>
  )
}
