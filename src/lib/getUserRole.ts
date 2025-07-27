import { db } from "./firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function getUserRole(uid: string) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    return userData.role; // admin, tpo, or student
  } else {
    return null;
  }
}
