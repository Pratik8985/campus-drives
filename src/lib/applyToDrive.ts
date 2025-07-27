import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { firebaseApp } from "./firebase/firebase"; // this now works correctly
import { getAuth } from "firebase/auth";

export async function applyToDrive(driveId: string) {
  const db = getFirestore(firebaseApp);
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("User not authenticated");

  const applicationId = `${driveId}_${user.uid}`;
  const applicationRef = doc(db, "applications", applicationId);

  const existing = await getDoc(applicationRef);

  if (existing.exists()) {
    throw new Error("Already applied");
  }

  await setDoc(applicationRef, {
    driveId,
    studentId: user.uid,
    appliedAt: new Date(),
  });
}
