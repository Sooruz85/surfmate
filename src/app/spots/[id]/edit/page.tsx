import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import EditSpotForm from '@/components/spots/EditSpotForm'

interface Props {
  params: {
    id: string
  }
}

export default async function EditSpotPage({ params }: Props) {
  const { data: spot, error } = await supabase
    .from('spots')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !spot) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Modifier le spot
        </h1>

        <div className="bg-white shadow rounded-lg p-6">
          <EditSpotForm spotId={params.id} />
        </div>
      </div>
    </div>
  )
}
