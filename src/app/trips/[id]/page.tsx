import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TripDetails from '@/components/trips/TripDetails'

type Props = {
  params: {
    id: string
  }
}

export default async function TripPage({ params }: Props) {
  const { data: trip, error } = await supabase
    .from('trips')
    .select(`
      *,
      spot:spots(*),
      creator:profiles(*)
    `)
    .eq('id', params.id)
    .single()

  if (error || !trip) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <TripDetails trip={trip} />
      </div>
    </div>
  )
}
