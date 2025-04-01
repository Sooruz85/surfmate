import ParticipationsList from '@/components/trips/ParticipationsList'

export default function ParticipationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mes participations
        </h1>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Trajets auxquels je participe
          </h2>
          <ParticipationsList />
        </div>
      </div>
    </div>
  )
}
