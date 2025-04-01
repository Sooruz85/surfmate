'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@/types'

export default function ProfileForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Partial<User>>({
    full_name: '',
    avatar_url: ''
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Erreur lors de la récupération du profil:', error)
        setError('Une erreur est survenue lors de la récupération du profil.')
        setLoading(false)
        return
      }

      setProfile(data)
      setLoading(false)
    }

    fetchProfile()
  }, [router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      let avatarUrl = profile.avatar_url

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile)

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        avatarUrl = publicUrl
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          avatar_url: avatarUrl
        })
        .eq('id', profile.id)

      if (updateError) {
        throw updateError
      }

      router.refresh()
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      setError('Une erreur est survenue lors de la mise à jour du profil.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Photo de profil
        </label>
        <div className="mt-1 flex items-center">
          <div className="relative">
            <img
              src={profile.avatar_url || '/default-avatar.png'}
              alt="Avatar"
              className="h-20 w-20 rounded-full object-cover"
            />
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
            >
              <span className="text-white text-sm">Changer</span>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          Nom complet
        </label>
        <input
          type="text"
          id="full_name"
          value={profile.full_name}
          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </form>
  )
}
