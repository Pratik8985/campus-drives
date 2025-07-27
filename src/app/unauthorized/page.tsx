'use client'

import DashboardLayout from '@/components/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function Unauthorized() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Unauthorized">
        <div className="flex justify-center items-center min-h-[70vh] bg-white">
          <p className="text-red-600 text-lg font-semibold">
            🚫 You do not have access to this page.
          </p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
