import React from "react";
import { db } from "@/firebase";
import { useAuth } from "@/auth/AuthProvider";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

/* ========= Types ========= */
type DuesMonth = { id: string; amount: number; dueDate: string; createdAt?: any };
type Notice = {
  id: string;
  title: string;
  body: string;
  validTill?: string;
  pinned?: boolean;
  createdAt?: any;
};
type Payment = {
  flatNo: string;
  paid: boolean;
  verified?: boolean;
  refNo?: string;
  updatedAt?: any;
  uid?: string;
  amount?: number;
  mode?: string;
};
type Expense = {
  id: string;
  date: string;
  title: string;
  category?: string;
  amount: number;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
};
type Profile = {
  uid?: string;
  name?: string;
  phone?: string;
  flatNo?: string;
  role?: "admin" | "resident";
  requiresPasswordChange?: boolean;
};

type DB = {
  dues: DuesMonth[];
  notices: Notice[];
  expenses: Expense[];
  payments: Record<string, Payment[]>; // monthId -> payments[]
  profiles: Profile[];
};

type Me = { uid: string; flatNo: string; role: "admin" | "resident" } | null;

type Ctx = {
  db: DB;
  me: Me;

  // explicit loaders
  loadDues: () => Promise<void>;
  loadExpenses: () => Promise<void>;
  loadNotices: () => Promise<void>;
  loadProfiles: () => Promise<void>;
  loadPayments: (monthId: string) => Promise<void>;

  // actions
  createMonth: (m: {
    id: string;           // "YYYY-MM"
    amount: number;
    dueDate: string;      // "YYYY-MM-DD"
    options?: {
      broadcastNotice?: boolean;
      noticeTitle?: string;
      noticeBody?: string;
    };
  }) => Promise<void>;

  markPaid: (
    monthId: string,
    flatNo: string,
    refNo?: string,
    amount?: number,
    mode?: string
  ) => Promise<void>;

  /** Flip verified flag */
  toggleVerify: (monthId: string, flatNo: string, v: boolean) => Promise<void>;

  /** Admin can record + verify payment even if resident never marked paid */
  adminVerifyPayment: (
    monthId: string,
    flatNo: string,
    data?: { amount?: number; refNo?: string; mode?: string }
  ) => Promise<void>;

  addNotice: (n: Omit<Notice, "id">) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;

  addExpense: (e: Omit<Expense, "id">) => Promise<void>;
  updateExpense: (id: string, patch: Partial<Expense>) => Promise<void>;
};

const AppCtx = React.createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();

  const [dues, setDues] = React.useState<DuesMonth[]>([]);
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [payments, setPayments] = React.useState<Record<string, Payment[]>>({});
  const [profiles, setProfiles] = React.useState<Profile[]>([]);

  /* ======= Live listeners (dues/notices/expenses/profiles) ======= */
  React.useEffect(() => {
    const qy = query(collection(db, "dues"), orderBy("dueDate", "desc"));
    return onSnapshot(qy, (snap) =>
      setDues(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
  }, []);

  React.useEffect(() => {
    const qy = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    return onSnapshot(qy, (snap) =>
      setNotices(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
  }, []);

  React.useEffect(() => {
    const qy = query(collection(db, "expenses"), orderBy("date", "desc"));
    return onSnapshot(qy, (snap) =>
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
  }, []);

  React.useEffect(() => {
    const qy = query(collection(db, "profiles"), orderBy("flatNo", "asc"));
    return onSnapshot(qy, (snap) =>
      setProfiles(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) })))
    );
  }, []);

  /* ======= Explicit loaders (Bootstrap can call) ======= */
  const loadDues = React.useCallback(async () => {
    const qy = query(collection(db, "dues"), orderBy("dueDate", "desc"));
    const r = await getDocs(qy);
    setDues(r.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  }, []);

  const loadExpenses = React.useCallback(async () => {
    const qy = query(collection(db, "expenses"), orderBy("date", "desc"));
    const r = await getDocs(qy);
    setExpenses(r.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  }, []);

  const loadNotices = React.useCallback(async () => {
    const qy = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const r = await getDocs(qy);
    setNotices(r.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  }, []);

  const loadProfiles = React.useCallback(async () => {
    const qy = query(collection(db, "profiles"), orderBy("flatNo", "asc"));
    const r = await getDocs(qy);
    setProfiles(r.docs.map((d) => ({ uid: d.id, ...(d.data() as any) })));
  }, []);

  const loadPayments = React.useCallback(async (monthId: string) => {
    const qy = collection(db, "payments", monthId, "flats");
    const r = await getDocs(qy);
    const list = r.docs.map((d) => d.data() as any);
    setPayments((prev) => ({ ...prev, [monthId]: list }));
  }, []);

  React.useEffect(() => {
    if (dues[0]?.id) loadPayments(dues[0].id);
  }, [dues, loadPayments]);

  /* ======= me ======= */
  const me: Me =
    user && profile
      ? { uid: user.uid, flatNo: profile.flatNo, role: profile.role as any }
      : null;

  /* ======= Actions ======= */

  // Create month with duplicate guard + always broadcast notice (as per your current code)
  const createMonth: Ctx["createMonth"] = async (m) => {
    const id = (m.id || "").trim(); // "YYYY-MM"
    if (!/^\d{4}-\d{2}$/.test(id)) {
      throw new Error("Month must be in YYYY-MM format (e.g., 2025-10)");
    }
    if (dues.some((d) => d.id === id)) {
      throw new Error("This month already exists");
    }
    const ref = doc(db, "dues", id);
    const snap = await getDoc(ref);
    if (snap.exists()) throw new Error("This month already exists in database");

    await setDoc(ref, {
      amount: Number(m.amount || 0),
      dueDate: m.dueDate,
      createdAt: serverTimestamp(),
    });

    const title = `Maintenance for ${id}`;
    const body = `Maintenance for ${id} is created.\nAmount: ₹${Number(
      m.amount || 0
    )}\nDue date: ${m.dueDate}\nPlease pay on time.`;

    await addDoc(collection(db, "notices"), {
      title,
      body,
      audience: "all",
      type: "dues",
      monthId: id,
      amount: Number(m.amount || 0),
      dueDate: m.dueDate,
      createdAt: serverTimestamp(),
    });
  };

  const markPaid: Ctx["markPaid"] = async (monthId, flatNo, refNo, amount, mode) => {
    if (!me) throw new Error("Not signed in");
    await setDoc(
      doc(db, "payments", monthId, "flats", flatNo),
      {
        uid: me.uid,
        flatNo,
        paid: true,
        verified: false,
        refNo: refNo ?? null,
        amount: amount ?? null,
        mode: mode ?? "Online",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    await loadPayments(monthId);
  };

  const toggleVerify: Ctx["toggleVerify"] = async (monthId, flatNo, v) => {
    await updateDoc(doc(db, "payments", monthId, "flats", flatNo), {
      verified: v,
      updatedAt: serverTimestamp(),
    });
    await loadPayments(monthId);
  };

  /** Admin can record & verify even if no payment exists yet */
  const adminVerifyPayment: Ctx["adminVerifyPayment"] = async (
    monthId,
    flatNo,
    data
  ) => {
    const m = dues.find((d) => d.id === monthId);
    const fallbackAmount = Number(m?.amount ?? 0);

    const ref = doc(db, "payments", monthId, "flats", flatNo);
    const snap = await getDoc(ref);

    const payload: Partial<Payment> & {
      updatedAt: any;
      createdAt?: any;
      paid: boolean;
      verified: boolean;
      flatNo: string;
      amount?: number | null;
      refNo?: string | null;
      mode?: string | null;
    } = {
      flatNo,
      paid: true,
      verified: true,
      amount: data?.amount ?? fallbackAmount,
      refNo: data?.refNo ?? "null",
      mode: data?.mode ?? "Cash",
      updatedAt: serverTimestamp(),
    };
    if (!snap.exists()) payload.createdAt = serverTimestamp();

    await setDoc(ref, payload as any, { merge: true });
    await loadPayments(monthId);
  };

  const addNotice: Ctx["addNotice"] = async (n) => {
    const id = crypto.randomUUID();
    await setDoc(doc(db, "notices", id), {
      ...n,
      createdAt: serverTimestamp(),
    });
  };

  const deleteNotice: Ctx["deleteNotice"] = async (id) => {
    // optimistic local removal
    setNotices((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteDoc(doc(db, "notices", id));
    } catch (e) {
      // reload to rollback if needed
      await loadNotices();
      throw e;
    }
  };

  const addExpense: Ctx["addExpense"] = async (e) => {
    const id = crypto.randomUUID();
    await setDoc(doc(db, "expenses", id), {
      ...e,
      amount: Number(e.amount || 0),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);
  };

  const updateExpense: Ctx["updateExpense"] = async (id, patch) => {
    await updateDoc(doc(db, "expenses", id), {
      ...patch,
      updatedAt: serverTimestamp(),
    } as any);
  };

  const value: Ctx = {
    db: { dues, notices, expenses, payments, profiles },
    me,
    // loaders
    loadDues,
    loadExpenses,
    loadNotices,
    loadProfiles,
    loadPayments,
    // actions
    createMonth,
    markPaid,
    toggleVerify,
    adminVerifyPayment,
    addNotice,
    deleteNotice,
    addExpense,
    updateExpense,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => {
  const ctx = React.useContext(AppCtx);
  if (!ctx) throw new Error("useApp outside provider");
  return ctx;
};