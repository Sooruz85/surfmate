import SpotsMap from '@/components/spots/SpotsMap'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Trouvez votre prochaine session de surf
        </h1>
        <p className="text-xl text-gray-600">
          Organisez des covoiturages vers les meilleurs spots de surf
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Spots à proximité
        </h2>
        <div className="h-[600px] rounded-lg overflow-hidden">
          <SpotsMap />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Géolocalisation
          </h3>
          <p className="text-gray-600">
            Trouvez les spots de surf les plus proches de chez vous
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Covoiturage
          </h3>
          <p className="text-gray-600">
            Organisez ou rejoignez des trajets vers vos spots préférés
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Communauté
          </h3>
          <p className="text-gray-600">
            Rencontrez d'autres surfeurs et partagez vos expériences
          </p>
        </div>
      </div>
    </div>
  )
}
