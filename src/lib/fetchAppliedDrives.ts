// lib/fetchAppliedDrives.ts
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase/firebase";

export async function fetchAppliedDrives(userId: string): Promise<string[]> {
  const q = query(
    collection(db, "applications"),
    where("studentId", "==", userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data().driveId);
}
