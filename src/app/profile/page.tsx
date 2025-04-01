import ProfileForm from '@/components/profile/ProfileForm'

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mon profil
        </h1>

        <div className="bg-white shadow rounded-lg p-6">
          <ProfileForm />
        </div>
      </div>
    </div>
  )
}
