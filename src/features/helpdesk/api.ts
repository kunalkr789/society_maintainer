import * as React from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/firebase";
import { toDate } from "@/utils/format";

/**
 * Helpdesk requests live in the `complaints` collection:
 *   { uid, flatNo, title, description, category, status, adminNote?, createdAt, updatedAt, resolvedAt? }
 * Residents read/create their own; admins read all and update status/note.
 * See docs/firestore-rules.md for the matching security rules.
 */
export const CATEGORIES = ["Plumbing", "Electrical", "Lift", "Cleaning", "Security", "Parking", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ["open", "in_progress", "resolved"] as const;
export type Status = (typeof STATUSES)[number];
export const statusLabel: Record<Status, string> = { open: "Open", in_progress: "In progress", resolved: "Resolved" };
export const statusColor: Record<Status, "warning" | "info" | "success"> = { open: "warning", in_progress: "info", resolved: "success" };

export type Request = {
  id: string;
  uid: string;
  flatNo: string;
  title: string;
  description: string;
  category: Category;
  status: Status;
  adminNote?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  resolvedAt?: unknown;
};

const newestFirst = (a: Request, b: Request) => (toDate(b.createdAt)?.getTime() ?? Date.now()) - (toDate(a.createdAt)?.getTime() ?? Date.now());

/** Live list: the signed-in resident's own requests, or every request for admins. */
export function useRequests(scope: { uid: string } | "all" | null) {
  const [items, setItems] = React.useState<Request[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const key = scope === "all" ? "all" : scope?.uid ?? "";

  React.useEffect(() => {
    if (!key) return;
    // residents: equality filter only (sorted client-side) so no composite index is needed
    const q = key === "all" ? query(collection(db, "complaints"), orderBy("createdAt", "desc")) : query(collection(db, "complaints"), where("uid", "==", key));
    return onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Request, "id">) })).sort(newestFirst));
        setError(null);
      },
      (e) => setError(e.code === "permission-denied" ? "You don’t have access to helpdesk requests yet. Ask the admin to enable them." : "Couldn’t load requests. Check your connection."),
    );
  }, [key]);

  return { items, error, loading: !!key && items === null && !error };
}

export function createRequest(r: Pick<Request, "uid" | "flatNo" | "title" | "description" | "category">) {
  return addDoc(collection(db, "complaints"), { ...r, title: r.title.trim(), description: r.description.trim(), status: "open" satisfies Status, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export function updateRequest(id: string, patch: { status?: Status; adminNote?: string }) {
  return updateDoc(doc(db, "complaints", id), {
    ...patch,
    updatedAt: serverTimestamp(),
    ...(patch.status === "resolved" ? { resolvedAt: serverTimestamp() } : {}),
  });
}
