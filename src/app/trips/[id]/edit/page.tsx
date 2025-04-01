import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import EditTripForm from '@/components/trips/EditTripForm'

interface Props {
  params: {
    id: string
  }
}

export default async function EditTripPage({ params }: Props) {
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Modifier le trajet
        </h1>

        <div className="bg-white shadow rounded-lg p-6">
          <EditTripForm tripId={params.id} />
        </div>
      </div>
    </div>
  )
}
