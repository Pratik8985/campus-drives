'use client'
import { ReactNode } from 'react'
import { signOut, getAuth } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase/firebase'

interface DashboardLayoutProps {
  children: ReactNode
  title: string
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen p-6 bg-white text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
      {children}
    </div>
  )
}
