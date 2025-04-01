'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Bienvenue sur SurfMate
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connectez-vous pour organiser vos sessions de surf
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Adresse email',
                  password_label: 'Mot de passe',
                  email_input_placeholder: 'votre@email.com',
                  password_input_placeholder: 'Votre mot de passe',
                  button_label: 'Se connecter',
                  loading_button_label: 'Connexion en cours...',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
