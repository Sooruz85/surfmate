import TripRequestsList from '@/components/trips/TripRequestsList'

export default function TripRequestsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Demandes de trajet
        </h1>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Demandes en attente
          </h2>
          <TripRequestsList />
        </div>
      </div>
    </div>
  )
}
