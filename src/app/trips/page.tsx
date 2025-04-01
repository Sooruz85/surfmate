'use client'

import { useEffect, useState } from 'react'
import { Trip, Spot, User } from '@/types'
import { supabase } from '@/lib/supabase/client'
import TripCard from '@/components/trips/TripCard'
import Link from 'next/link'
import TripsList from '@/components/trips/TripsList'

export default function TripsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Gestion des trajets
        </h1>

        <div className="bg-white shadow rounded-lg p-6">
          <TripsList />
        </div>
      </div>
    </div>
  )
}
