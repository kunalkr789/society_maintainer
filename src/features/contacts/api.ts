import * as React from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";

/** Society directory in the `contacts` collection: anyone signed in reads, admins write. */
export const GROUPS = ["Emergency", "Society staff", "Maintenance", "Services", "Committee"] as const;
export type Group = (typeof GROUPS)[number];

export type Contact = { id: string; name: string; role: string; phone: string; group: Group; note?: string };

/** Shown until an admin adds the first contact, so residents keep the security number during rollout. */
export const FALLBACK: Contact[] = [{ id: "fallback-security", name: "Security", role: "Security guard", phone: "+919852818677", group: "Society staff" }];

const groupOrder = (g: Group) => GROUPS.indexOf(g);

export function useContacts() {
  const [items, setItems] = React.useState<Contact[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(
    () =>
      onSnapshot(
        collection(db, "contacts"),
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Contact, "id">) }));
          setItems(list.sort((a, b) => groupOrder(a.group) - groupOrder(b.group) || a.name.localeCompare(b.name)));
          setError(null);
        },
        (e) => setError(e.code === "permission-denied" ? "The contacts directory isn’t enabled yet." : "Couldn’t load contacts. Check your connection."),
      ),
    [],
  );

  return { items, error };
}

/** Digits only with country code, for tel: and wa.me links. Assumes India when no code is given. */
export function normalisePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  const d = digits.replace(/^0+/, "");
  return d.length === 10 ? `+91${d}` : `+${d}`;
}

export const isValidPhone = (raw: string) => /^\+\d{10,15}$/.test(normalisePhone(raw));

export function saveContact(c: Omit<Contact, "id">, id?: string) {
  const data = { ...c, name: c.name.trim(), role: c.role.trim(), note: c.note?.trim() ?? "", phone: normalisePhone(c.phone), updatedAt: serverTimestamp() };
  return id ? updateDoc(doc(db, "contacts", id), data) : addDoc(collection(db, "contacts"), { ...data, createdAt: serverTimestamp() });
}

export const removeContact = (id: string) => deleteDoc(doc(db, "contacts", id));
