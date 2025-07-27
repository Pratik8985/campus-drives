'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import DashboardLayout from '@/components/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { FaMapMarkerAlt, FaMoneyBillAlt, FaUsers } from 'react-icons/fa'
import { MdCalendarToday } from 'react-icons/md'
import { AiOutlineCheck, AiOutlineClose } from 'react-icons/ai'
import Toast from '@/components/Toast'
import { Drive } from '@/types/Drive'
import Loader from '@/components/Loader'



const statusTabs = ['all', 'pending', 'open', 'rejected'] as const

export default function AdminPage() {
      const [toast, setToast] = useState<{
    id: number;
    message: string;
    type?: "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false) 
  const [drives, setDrives] = useState<Drive[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'open' | 'rejected'>('all')

  const fetchDrives = async () => {
     setLoading(true)
   try {
      const snapshot = await getDocs(collection(db, 'drives'))
      const fetchedDrives = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Drive[]
      setDrives(fetchedDrives)
    } catch (error) {
      console.error("Error fetching drives:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrives()
  }, [])

  const handleApprove = async (id: string) => {
     setLoading(true)
    const driveRef = doc(db, 'drives', id)
    await updateDoc(driveRef, {
      status: 'open',
      updatedAt: new Date(),
    })
    fetchDrives()
     setLoading(false)
      setToast({
        id: Date.now(),
        message: "Approved successfully",
        type: "success",
      });

  }

  const handleReject = async (id: string) => {
     setLoading(true)
    const driveRef = doc(db, 'drives', id)
    await updateDoc(driveRef, {
      status: 'rejected',
      updatedAt: new Date(),
    })
    fetchDrives()
     setLoading(false)
    setToast({
        id: Date.now(),
        message: "Rejected successfully",
        type: "success",
      });
  }

  const filteredDrives = drives.filter(d =>
    activeTab === 'all' ? true : d.status === activeTab
  )

  const counts = {
    total: drives.length,
    pending: drives.filter(d => d.status === 'pending').length,
    open: drives.filter(d => d.status === 'open').length,
    rejected: drives.filter(d => d.status === 'rejected').length,
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Admin Dashboard">
              {toast && (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
          />
        )}
        {loading && <Loader message="Loading..." />}
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Drives" value={counts.total} />
          <StatCard label="Pending Approval" value={counts.pending} color="yellow" />
          <StatCard label="Approved Drives" value={counts.open} color="green" />
          <StatCard label="Rejected Drives" value={counts.rejected} color="red" />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 bg-gray-100 p-2 rounded-full mb-6 w-full">
          {statusTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1 text-sm rounded-full transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white shadow font-semibold text-gray-900'
                  : 'text-gray-500'
              }`}
            >
              {tab === 'all' && `All Drives (${counts.total})`}
              {tab === 'pending' && `Pending (${counts.pending})`}
              {tab === 'open' && `Approved (${counts.open})`}
              {tab === 'rejected' && `Rejected (${counts.rejected})`}
            </button>
          ))}
        </div>

        {/* Pending warning */}
        {counts.pending > 0 && activeTab === 'pending' && (
          <div className="p-3 text-yellow-800 bg-yellow-100 rounded mb-4 text-sm">
            {counts.pending} drive(s) require your approval before they can be visible to students.
          </div>
        )}

        {/* Drive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrives.map(drive => (
            <div
              key={drive.id}
              className="bg-white rounded-2xl shadow-md p-4 sm:p-5 transition hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base sm:text-lg font-semibold">{drive.companyName}</h2>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    drive.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : drive.status === 'open'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                </span>
              </div>

              <p className="text-gray-700 text-sm mb-1 font-medium">{drive.title}</p>

              <p className="text-gray-500 text-sm mb-2">{drive.description}</p>

              <div className="grid text-sm text-gray-600 mb-2 gap-1">
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-sm" />
                  <span>{drive.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaMoneyBillAlt className="text-sm" />
                  <span>{drive.salaryPackage} LPA</span>
                </div>
                <div className="flex items-center gap-2">
                  <MdCalendarToday className="text-sm" />
                  <span>
                    Deadline:{' '}
                    {drive.applicationDeadline?.seconds
                      ? new Date(drive.applicationDeadline.seconds * 1000).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaUsers className="text-sm" />
                  <span>{drive.applicantsCount ?? 0} applicants</span>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-2">
                <strong>Eligibility:</strong> {drive.eligibility}
              </p>
              <p className="text-xs text-gray-400">
                Posted by: {drive?.createdBy} •{' '}
                {new Date(drive.createdAt?.seconds * 1000).toLocaleDateString()}
              </p>

              {/* Action Buttons */}
              {drive.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <button
                    onClick={() => handleReject(drive.id)}
                    className="flex items-center justify-center gap-1 bg-red-500 text-white px-4 py-1.5 rounded-md text-sm font-medium transition hover:opacity-90"
                  >
                    <AiOutlineClose className="text-lg" /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(drive.id)}
                    className="flex items-center justify-center gap-1 bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition hover:opacity-90"
                  >
                    <AiOutlineCheck className="text-lg" /> Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

// StatCard Component
function StatCard({
  label,
  value,
  color = 'gray',
  icon,
}: {
  label: string
  value: number
  color?: 'gray' | 'yellow' | 'green' | 'red'
  icon?: React.ReactNode
}) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  }

  return (
    <div className={`p-4 rounded-lg shadow ${colors[color]}`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1 flex items-center gap-2">
        {icon}
        {value}
      </div>
    </div>
  )
}
