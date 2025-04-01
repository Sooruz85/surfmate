import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TripDetails from '@/components/trips/TripDetails'

interface Props {
  params: {
    id: string
  }
}

export default async function TripPage({ params }: Props) {
  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !trip) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Détails du trajet
        </h1>

        <div className="bg-white shadow rounded-lg p-6">
          <TripDetails tripId={params.id} />
        </div>
      </div>
    </div>
  )
}
