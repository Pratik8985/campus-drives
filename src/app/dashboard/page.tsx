'use client'

import { getAuth, signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function DashboardPage() {
  const router = useRouter()

const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-6 bg-white text-gray-900">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
        <p className="text-gray-600">You are logged in!</p>
      </div>
    </ProtectedRoute>
  )
}
