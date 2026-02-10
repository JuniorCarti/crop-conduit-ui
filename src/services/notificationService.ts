import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type UserNotificationInput = {
  uid: string;
  orgId?: string;
  type: string;
  title: string;
  message: string;
};

export async function createUserNotification(input: UserNotificationInput): Promise<void> {
  if (!input.uid) return;
  await addDoc(collection(db, "users", input.uid, "notifications"), {
    type: input.type,
    orgId: input.orgId ?? null,
    title: input.title,
    message: input.message,
    createdAt: serverTimestamp(),
    read: false,
  });
}
