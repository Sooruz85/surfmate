import CreateTripForm from '@/components/trips/CreateTripForm'

export default function CreateTripPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Créer un nouveau trajet
        </h1>

        <div className="bg-white shadow rounded-lg p-6">
          <CreateTripForm />
        </div>
      </div>
    </div>
  )
}
