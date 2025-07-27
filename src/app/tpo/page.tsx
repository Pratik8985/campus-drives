"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FiMapPin, FiBriefcase, FiCalendar, FiUsers } from "react-icons/fi";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
// import { storage } from "@/lib/firebase/firebase";

import { db } from "@/lib/firebase/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  limit,
  startAfter,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Toast from "@/components/Toast";
import { Drive } from "@/types/Drive";
import { useAuth } from "@/hooks/useAuth";
import Loader from "@/components/Loader";
import { FaBuilding,FaRupeeSign } from "react-icons/fa";



type DriveWithCount = Drive & {
  applicationCount: number;
};

export default function TpoPage() {
  const [showModal, setShowModal] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eligibility: "",
    companyName: "",
    location: "",
    applicationDeadline: "",
    salaryPackage: "",
    jobType: "",
  });
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type?: "success" | "error";
  } | null>(null);

  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 5;
  const [editingDriveId, setEditingDriveId] = useState<string | null>(null);
  const [allDrives, setAllDrives] = useState<DriveWithCount[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "closed">(
    "all"
  );

  const filteredDrives = allDrives.filter((drive) =>
    filterStatus === "all" ? true : drive.status === filterStatus
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchApplicationCount = async (driveId: string): Promise<number> => {
    const q = query(
      collection(db, "applications"),
      where("driveId", "==", driveId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  };

  const fetchMyDrives = async (uid: string, reset = false) => {
    try {
      setLoading(true);

      let q = query(
        collection(db, "drives"),
        where("postedBy", "==", uid),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      if (!reset && lastVisible) {
        q = query(
          collection(db, "drives"),
          where("postedBy", "==", uid),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);

      const drives = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() as Drive;
          const { id: _ignoredId, ...dataWithoutId } = data;
          const applicationCount = await fetchApplicationCount(docSnap.id);
          return {
            id: docSnap.id,
            ...dataWithoutId,
            applicationCount,
          };
        })
      );

      if (reset) {
        setAllDrives(drives);
      } else {
        const newUniqueDrives = drives.filter(
          (newDrive) =>
            !allDrives.some((existing) => existing.id === newDrive.id)
        );
        setAllDrives((prev) => [...prev, ...newUniqueDrives]);
      }

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastDoc);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Error fetching drives:", err);
    } finally {
      setLoading(false);
    }
  };
  const resetModal = () => {
    setShowModal(false);
    setEditingDriveId(null);
    setFormData({
      title: "",
      description: "",
      eligibility: "",
      location: "",
      companyName: "",
      applicationDeadline: "",
      salaryPackage: "",
      jobType: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
      setLoading(true);
    e.preventDefault();
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid)
      return setToast({
        id: Date.now(),
        message: "User not logged in.",
        type: "error",
      });

    if (
      formData.applicationDeadline &&
      new Date(formData.applicationDeadline) < new Date()
    ) {
     setToast({
        id: Date.now(),
        message: "Application deadline must be a future date.",
        type: "error",
      });
      return;
    }

    try {
      let uploadedUrl = "";
      //   if (pdfFile) {
      //     const storageRef = ref(
      //       storage,
      //       `jobDescriptions/${pdfFile.name}_${Date.now()}`
      //     );
      //     await uploadBytes(storageRef, pdfFile);
      //     uploadedUrl = await getDownloadURL(storageRef);
      //   }

      const deadlineTimestamp = formData.applicationDeadline
        ? Timestamp.fromDate(new Date(formData.applicationDeadline))
        : null;

      const driveData = {
        title: formData.title,
        description: formData.description,
        eligibility: formData.eligibility,
        location: formData.location || "",
        salaryPackage: formData.salaryPackage || "",
        jobType: formData.jobType || "",
        applicationDeadline: deadlineTimestamp,
        updatedAt: serverTimestamp(),
        companyName: formData.companyName || "",
        createdBy: user?.email?.split("@")[0] || "TPO",
        ...(uploadedUrl ? { pdfUrl: uploadedUrl } : {}),
      };

      if (editingDriveId) {
        await updateDoc(doc(db, "drives", editingDriveId), driveData);
        setToast({
          id: Date.now(),
          message: "Drive updated successfully!",
          type: "success",
        });
        setEditingDriveId(null);
        fetchMyDrives(uid, true);
      } else {
        const docRef = await addDoc(collection(db, "drives"), {
          ...driveData,
          createdAt: serverTimestamp(),
          postedBy: uid,
          status: "pending",
        });

        const docSnap = await getDoc(docRef);
        const newDriveData = docSnap.data() as Drive;
        const applicationCount = await fetchApplicationCount(docRef.id);
        const { id: _ignoreId, ...safeDriveData } = newDriveData;

        setAllDrives((prev) => [
          {
            id: docRef.id,
            ...safeDriveData,
            applicationCount,
          },
          ...prev,
        ]);
        setLastVisible(null);
      setLoading(false);
        setToast({
          id: Date.now(),
          message: "Drive posted successfully!",
          type: "success",
        });
      }

      resetModal();
    } catch (error) {
      setLoading(false);

      console.error("Error posting/updating drive:", error);
      setToast({
        id: Date.now(),
        message: "Failed to post/update drive. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
       
    }
  };

  const updateDriveStatus = async (
    driveId: string,
    status: "open" | "closed"
  ) => {
    if (!confirm(`Are you sure you want to ${status} this drive?`)) return;
    try {
      await updateDoc(doc(db, "drives", driveId), {
        status,
        updatedAt: serverTimestamp(),
      });
      const uid = getAuth().currentUser?.uid;
      if (uid) fetchMyDrives(uid, true);
    } catch (err) {
      console.error(`Failed to ${status} drive:`, err);
      setToast({
        id: Date.now(),
        message: "Error updating drive status",
        type: "error",
      });
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setLastVisible(null);
        fetchMyDrives(user.uid, true);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <ProtectedRoute>
      <DashboardLayout title="TPO Dashboard">
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="relative bg-white rounded-xl p-6 w-full max-w-2xl shadow-lg">
              <button
                className="absolute top-2 right-3 text-gray-500 hover:text-gray-700"
                onClick={resetModal}
              >
                ✕
              </button>

              <h2 className="text-xl font-semibold mb-1">
                {editingDriveId ? "Edit Drive" : "Post New Campus Drive"}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Fill in the details for the new placement drive.
              </p>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <input
                  type="text"
                  name="companyName"
                  placeholder="Company Name"
                  className="border rounded px-3 py-2"
                  value={formData.companyName}
                  required
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                />

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Job Role"
                  className="border rounded px-3 py-2"
                  required
                />

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Location"
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  name="salaryPackage"
                  value={formData.salaryPackage}
                  onChange={handleChange}
                  placeholder="CTC Range (e.g., 12–15 LPA)"
                  className="border rounded px-3 py-2"
                />

                <input
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleChange}
                  className="border rounded px-3 py-2"
                  required
                />
                <input
                  type="text"
                  name="eligibility"
                  value={formData.eligibility}
                  onChange={handleChange}
                  placeholder="Eligibility Criteria (e.g., B.Tech CSE/IT, CGPA ≥ 7)"
                  className="border rounded px-3 py-2"
                  required
                />

                <div className="sm:col-span-2">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter detailed job description..."
                    className="w-full border rounded px-3 py-2"
                    rows={4}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description File (PDF)
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    // onChange={(e) => {
                    //   const file = e.target.files?.[0];
                    //   if (file) {
                    //     setPdfFile(file);
                    //   }
                    // }}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a detailed job description (PDF format only)
                  </p>
                </div>

                <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingDriveId ? "Update Drive" : "Post Drive"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast && (
  <Toast
    key={toast.id}
    message={toast.message}
    type={toast.type}
  />
)}

   {loading && <Loader message="Loading..." />}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">Welcome,{user?.email?.split("@")[0] || "TPO"}! 👋</p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => setShowModal(true)}
          >
            + Post New Drive
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Drives" value={allDrives.length} />
          <StatCard
            label="Approved Drives"
            value={allDrives.filter((d) => d.status === "open").length}
            color="green"
          />
          <StatCard
            label="Total Applications"
            value={allDrives.reduce((sum, d) => sum + d.applicationCount, 0)}
          />
        </div>

        <div className="flex space-x-2 bg-gray-100 p-2 rounded-full w-fit mb-6">
          {["all", "open", "closed"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status as any);
                const uid = getAuth().currentUser?.uid;
                if (uid) fetchMyDrives(uid, true);
              }}
              className={`px-4 py-1 text-sm rounded-full ${
                filterStatus === status
                  ? "bg-white shadow font-semibold"
                  : "text-gray-500"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} (
              {
                allDrives.filter((d) =>
                  status === "all" ? true : d.status === status
                ).length
              }
              )
            </button>
          ))}
        </div>

        {filteredDrives.length === 0 ? (
          <p className="text-center text-gray-500 mt-6">No drives found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDrives.map((drive) => {
              const deadlinePassed =
                drive.applicationDeadline?.toDate &&
                drive.applicationDeadline.toDate() < new Date();

              return (
 <div
  key={drive.id}
  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 p-5 flex flex-col justify-between"
>
  {/* Header */}
  <div className="flex justify-between items-start mb-3">
    <div>
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-1">
        <FaBuilding className="inline text-gray-500" /> {drive.companyName}
      </h2>
      <p className="text-sm text-gray-500">{drive.title}</p>
    </div>
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full ${
        drive.status === "open"
          ? "bg-green-100 text-green-700"
          : drive.status === "pending"
          ? "bg-yellow-100 text-yellow-700"
          : drive.status === "closed"
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
    </span>
  </div>

  {/* Description */}
  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
    {drive.description}
  </p>

  {/* Details with Icons */}
  <div className="space-y-2 text-sm text-gray-700">
    <p className="flex items-center gap-2"><FaRupeeSign className="text-gray-500" /> <span className="font-medium">CTC:</span> {drive.salaryPackage || "-"}</p>
    <p className="flex items-center gap-2"><FiMapPin className="text-gray-500" /> <span className="font-medium">Location:</span> {drive.location || "-"}</p>
    <p className="flex items-center gap-2"><FiBriefcase className="text-gray-500" /> <span className="font-medium">Eligibility:</span> {drive.eligibility}</p>
    <p className="flex items-center gap-2"><FiCalendar className="text-gray-500" /> <span className="font-medium">Deadline:</span> {drive.applicationDeadline?.toDate().toLocaleDateString() || "-"}</p>
    <p className="flex items-center gap-2"><FiUsers className="text-gray-500" /> <span className="font-medium">Applications:</span> {drive.applicationCount}</p>
  </div>

  {/* Actions */}
  <div className="flex flex-wrap items-center gap-2 mt-4">
    {drive.status === "open" && !deadlinePassed && (
      <button
        onClick={() => updateDriveStatus(drive.id, "closed")}
        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition"
      >
        Close
      </button>
    )}

    {drive.status === "closed" && !deadlinePassed && (
      <button
        onClick={() => updateDriveStatus(drive.id, "open")}
        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition"
      >
        Reopen
      </button>
    )}

    {!deadlinePassed && (
      <button
        onClick={() => {
          setEditingDriveId(drive.id);
          setFormData({
            title: drive.title,
            companyName: drive.companyName,
            description: drive.description,
            eligibility: drive.eligibility,
            location: drive.location || "",
            salaryPackage: drive.salaryPackage?.toString() || "",
            applicationDeadline:
              drive.applicationDeadline?.toDate().toISOString().split("T")[0] || "",
            jobType: drive.jobType || "",
          });
          setShowModal(true);
        }}
        className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 transition"
      >
        Edit
      </button>
    )}
  </div>

  {/* Messages */}
  {drive.status === "open" && deadlinePassed && (
    <p className="text-xs text-red-500 mt-2">Deadline passed – cannot close</p>
  )}
  {deadlinePassed && (
    <p className="text-xs text-red-500 mt-1">Cannot edit – deadline passed</p>
  )}
</div>



              );
            })}
          </div>
        )}

        {/* Modal code stays unchanged below */}
        {/* ... */}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function StatCard({
  label,
  value,
  color = "gray",
  icon,
}: {
  label: string;
  value: number;
  color?: "gray" | "yellow" | "green" | "red";
  icon?: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    yellow: "bg-yellow-100 text-yellow-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <div className={`p-4 rounded-lg shadow ${colors[color]}`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1 flex items-center gap-2">
        {icon}
        {value}
      </div>
    </div>
  );
}
