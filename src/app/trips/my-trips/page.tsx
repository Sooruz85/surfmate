import MyTripsList from '@/components/trips/MyTripsList'

export default function MyTripsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mes trajets
        </h1>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Trajets créés
          </h2>
          <MyTripsList />
        </div>
      </div>
    </div>
  )
}
