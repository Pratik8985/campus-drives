"use client";

import { useEffect, useState } from "react";
import { fetchOpenDrives } from "@/lib/fetchOpenDrives";
import { Drive } from "@/types/Drive";
import { applyToDrive } from "@/lib/applyToDrive";
import DashboardLayout from "@/components/DashboardLayout";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { fetchAppliedDrives } from "@/lib/fetchAppliedDrives";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaUsers,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import Toast from "@/components/Toast";
import Loader from "@/components/Loader";

export default function StudentPage() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const uniqueLocations = [...new Set(drives.map((d) => d.location || "N/A"))];
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
const [prevDocs, setPrevDocs] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();
  const PAGE_SIZE = 6;
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type?: "success" | "error";
  } | null>(null);
useEffect(() => {
  const loadInitialData = async () => {
    try {
      if (!user) return; // wait until user is ready

      setLoading(true);
      setError(null);

      const appliedDriveIds = await fetchAppliedDrives(user.uid); // ✅ pass UID
      const appliedMap: Record<string, boolean> = {};
      appliedDriveIds.forEach((id) => {
        appliedMap[id] = true;
      });
      setApplied(appliedMap);

      await loadDrives();
    } catch (err) {
      console.error("Failed to load initial data", err);
      setError("Something went wrong while loading drives.");
    } finally {
      setLoading(false);
    }
  };

  loadInitialData();
}, [user]); // ✅ watch `user` so it re-runs when available


  const loadDrives = async (direction: "next" | "prev" = "next") => {
    try {
      setLoading(true);
      setError(null);

      if (direction === "prev") {
        const prev = [...prevDocs];
          setPrevDocs(prev);
        const { drives, lastVisible } = await fetchOpenDrives(
          PAGE_SIZE,
          prev[prev.length - 1]
        );
        setDrives(drives);
        setLastDoc(lastVisible);
        setHasMore(true);
        return;
      }

      const { drives, lastVisible } = await fetchOpenDrives(PAGE_SIZE, lastDoc?? undefined);
      if (lastDoc) setPrevDocs((prev) => [...prev, lastDoc]);
      setDrives(drives);
      setLastDoc(lastVisible);
      setHasMore(drives.length === PAGE_SIZE);
    } catch (err) {
      setError("Failed to load drives. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (driveId: string) => {
  try {
    setIsApplying(true);
    await applyToDrive(driveId);
    setApplied((prev) => ({ ...prev, [driveId]: true }));
    setToast({
      id: Date.now(),
      message: "Application submitted successfully!",
      type: "success",
    });
  } catch (error) {
  if (error instanceof Error) {
    setToast({
      id: Date.now(),
      message: error.message,
      type: "error",
    });
  } else {
    setToast({
      id: Date.now(),
      message: "Something went wrong while applying.",
      type: "error",
    });
  }
}
 finally {
    setIsApplying(false);
  }
};


  return (
    <ProtectedRoute>
      <DashboardLayout title="Available Drives">
             {toast && (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
          />
        )}
        {isApplying && <Loader message="Submitting your application..." />}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-md mb-6">
          <h2 className="text-2xl font-bold">
            Welcome back, {user?.email?.split("@")[0] || "Student"}! 👋
          </h2>

          <p className="text-sm mt-1">
            Computer Science • Sample University • Batch 2025
          </p>
          <div className="flex flex-wrap gap-6 mt-6 text-center">
            <div>
              <div className="text-2xl font-bold">{drives.length}</div>
              <div className="text-sm">Available Drives</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Object.keys(applied).length}
              </div>
              <div className="text-sm">Applications</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {
                  drives.filter(
                    (d) =>
                      d.applicationDeadline?.toDate() &&
                      d.applicationDeadline?.toDate() > new Date()
                  ).length
                }
              </div>
              <div className="text-sm">Active Drives</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search companies or roles..."
            className="border rounded px-3 py-2 w-full md:w-1/3"
          />

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-1/4"
          >
            <option value="">All Locations</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div className="min-h-screen p-4 sm:p-6">
          <h1 className="text-2xl font-bold mb-4">Available Drives</h1>

          {loading ? (
            <Loader message="Loading..." />
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : drives.length === 0 ? (
            <p>No active drives available right now.</p>
          ) : (
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {drives
                .filter(
                  (drive) =>
                    drive.companyName
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    drive.title
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase())
                )
                .filter((drive) =>
                  locationFilter ? drive.location === locationFilter : true
                )
                .map((drive) => {
                  const isExpired = drive.applicationDeadline
                    ? drive.applicationDeadline.toDate() < new Date()
                    : false;

                  return (
                    <div
                      key={drive.id}
                      className="bg-white p-4 sm:p-5 rounded-xl shadow border flex flex-col justify-between w-full"
                    >
                      <div className="flex gap-3 items-start">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold">
                          {drive.companyName?.charAt(0) || "C"}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {drive.companyName || "Unknown Company"}
                          </h3>
                          <p className="text-gray-500 text-sm">
                            {drive.title || "Job Role"}
                          </p>
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <FaUsers /> {drive.applicantsCount || 0}
                        </div>
                      </div>

                      <div className="mt-4 text-sm text-gray-600 space-y-2">
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt />
                          <span>{drive.location || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaMoneyBillWave />
                          <span>
                            {drive.salaryPackage
                              ? `${drive.salaryPackage} LPA`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt />
                          <span>
                            Deadline:{" "}
                            {drive.applicationDeadline
                              ? drive.applicationDeadline
                                  .toDate()
                                  .toLocaleDateString()
                              : "N/A"}
                          </span>
                          {isExpired && (
                            <span className="text-red-600 font-semibold ml-2">
                              Expired
                            </span>
                          )}
                        </div>
                        <div>
                          <strong>Eligibility:</strong>
                          <p>{drive.eligibility}</p>
                        </div>
                        <div>
                          <strong>Description:</strong>
                          <p>
                            {drive.description || "No description provided."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        {applied[drive.id] ? (
                          <span className="inline-block bg-green-100 text-green-800 px-4 py-1 rounded text-sm font-medium">
                            ✅ Applied
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApply(drive.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          <div className="flex justify-center mt-8 gap-6">
            <button
              onClick={() => loadDrives("prev")}
              disabled={prevDocs.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${
                prevDocs.length === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FaArrowLeft />
              Previous
            </button>

            <button
              onClick={() => loadDrives("next")}
              disabled={!hasMore}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${
                !hasMore
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Next
              <FaArrowRight />
            </button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
