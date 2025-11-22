import React from "react";
import { auth, db } from "@/firebase";
import {
  onAuthStateChanged,
  signOut,
  getIdTokenResult,
  signInWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

type Claims = { role?: "admin" | "resident" };
type Profile = {
  name: string;
  email: string;
  flatNo: string;
  role: "admin" | "resident";
  requiresPasswordChange?: boolean;
  phone?: string;
};

type Ctx = {
  user: any | null;
  claims: Claims | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPwd: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    patch: Partial<Pick<Profile, "name" | "phone">>
  ) => Promise<void>;
};

const AuthCtx = React.createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<any | null>(null);
  const [claims, setClaims] = React.useState<Claims | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadProfile = React.useCallback(async (u: any) => {
    if (!u) {
      setProfile(null);
      setClaims(null);
      return;
    }
    const token = await getIdTokenResult(u, true);
    setClaims(token.claims as any);
    const snap = await getDoc(doc(db, "profiles", u.uid));
    setProfile(snap.exists() ? (snap.data() as any) : null);
  }, []);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await loadProfile(u);
      setLoading(false);
    });
    return () => unsub();
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, password);
    await loadProfile(auth.currentUser);
    setLoading(false);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const changePassword = async (newPwd: string) => {
    if (!auth.currentUser) throw new Error("Not signed in");
    await updatePassword(auth.currentUser, newPwd);
    await setDoc(
      doc(db, "profiles", auth.currentUser.uid),
      { requiresPasswordChange: false },
      { merge: true }
    );
    await loadProfile(auth.currentUser);
  };

  const refreshProfile = async () => {
    await loadProfile(auth.currentUser);
  };

  const updateProfile = async (patch: { name?: string; phone?: string }) => {
    if (!auth.currentUser) throw new Error("Not signed in");
    const allowed: any = {};
    if (typeof patch.name === "string") allowed.name = patch.name;
    if (typeof patch.phone === "string") allowed.phone = patch.phone;
    await updateDoc(doc(db, "profiles", auth.currentUser.uid), allowed);
    await loadProfile(auth.currentUser);
  };

  const value: Ctx = {
    user,
    claims,
    profile,
    loading,
    login,
    logout,
    changePassword,
    refreshProfile,
    updateProfile,
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => {
  const ctx = React.useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
};
