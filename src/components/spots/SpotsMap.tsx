'use client'

import { useEffect, useState } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { Spot } from '@/types'
import { supabase } from '@/lib/supabase/client'

const containerStyle = {
  width: '100%',
  height: '600px'
}

const defaultCenter = {
  lat: 43.2965, // Biarritz
  lng: -1.5333
}

export default function SpotsMap() {
  const [spots, setSpots] = useState<Spot[]>([])
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Récupérer la position de l'utilisateur
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error)
        }
      )
    }

    // Récupérer les spots depuis Supabase
    const fetchSpots = async () => {
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .order('name')

      if (error) {
        console.error('Erreur lors de la récupération des spots:', error)
        return
      }

      setSpots(data || [])
    }

    fetchSpots()
  }, [])

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || defaultCenter}
        zoom={10}
      >
        {/* Marqueur de la position de l'utilisateur */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            }}
          />
        )}

        {/* Marqueurs des spots */}
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={{ lat: spot.latitude, lng: spot.longitude }}
            onClick={() => setSelectedSpot(spot)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#10B981',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            }}
          />
        ))}

        {/* Fenêtre d'information du spot sélectionné */}
        {selectedSpot && (
          <InfoWindow
            position={{ lat: selectedSpot.latitude, lng: selectedSpot.longitude }}
            onCloseClick={() => setSelectedSpot(null)}
          >
            <div className="p-2">
              <h3 className="font-semibold text-lg">{selectedSpot.name}</h3>
              {selectedSpot.difficulty_level && (
                <p className="text-sm text-gray-600">
                  Niveau: {selectedSpot.difficulty_level}
                </p>
              )}
              {selectedSpot.description && (
                <p className="text-sm text-gray-600 mt-1">{selectedSpot.description}</p>
              )}
              <a
                href={`/spots/${selectedSpot.id}`}
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 block"
              >
                Voir les trajets →
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  )
}
