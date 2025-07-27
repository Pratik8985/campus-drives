'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login')
        return
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const role = userDoc.data()?.role
        const rolePaths: Record<string, string> = {
          admin: '/admin',
          tpo: '/tpo',
          recruiter: '/recruiter',
          student: '/student',
        }

        const isUnauthorized = Object.entries(rolePaths).some(
          ([r, path]) => pathname.startsWith(path) && role !== r
        )

        if (isUnauthorized) {
          router.replace('/unauthorized')
          return
        }

        setChecking(false)
      } catch (error) {
        console.error('Error fetching user role:', error)
        router.replace('/unauthorized')
      }
    })

    return () => unsubscribe()
  }, [router, pathname])

  if (checking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Checking permissions...</p>
      </div>
    )
  }

  return <>{children}</>
}
