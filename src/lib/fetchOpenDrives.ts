// lib/fetchOpenDrives.ts
import { collection, getDocs, orderBy, query, limit, startAfter , DocumentSnapshot,
  QueryDocumentSnapshot,
  DocumentData,} from "firebase/firestore";
import { db } from "./firebase/firebase";
import { Drive } from "@/types/Drive";

export const fetchOpenDrives = async (
  pageLimit = 6,
  startAfterDoc?: DocumentSnapshot<DocumentData> // Firebase DocumentSnapshot
): Promise<{ drives: Drive[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> => {
  let q = query(
    collection(db, "drives"),
    orderBy("createdAt", "desc"),
    limit(pageLimit)
  );

  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }

  const snapshot = await getDocs(q);
  const drives: Drive[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Drive[];

  const lastVisible = snapshot.docs[snapshot.docs.length - 1];

  return { drives, lastVisible };
};
