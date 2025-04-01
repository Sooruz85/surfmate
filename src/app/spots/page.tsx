import SpotsList from '@/components/spots/SpotsList'
import CreateSpotForm from '@/components/spots/CreateSpotForm'

export default function SpotsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Gestion des spots
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Liste des spots
              </h2>
              <SpotsList />
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Ajouter un spot
              </h2>
              <CreateSpotForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
