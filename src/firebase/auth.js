import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";
import { logAudit } from "./firestore";

const googleProvider = new GoogleAuthProvider();
const STORAGE_KEY_PREFIX = "funforee-user-profile";

const getStoredProfile = (uid) => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}:${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveStoredProfile = (uid, profile) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}:${uid}`, JSON.stringify(profile));
  } catch {
    // Ignore storage errors
  }
};

const buildFallbackProfile = (user, fallbackData = {}) => ({
  uid: user.uid,
  email: user.email || "",
  displayName: user.displayName || fallbackData.displayName || "Usuario",
  role: fallbackData.role || "administrativo",
  phone: user.phoneNumber || fallbackData.phone || "",
  specialty: fallbackData.specialty || "",
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: fallbackData.createdBy || user.uid,
});

const ensureUserProfile = async (user, fallbackData = {}) => {
  const fallbackProfile = buildFallbackProfile(user, fallbackData);
  const storedProfile = getStoredProfile(user.uid);

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const profile = {
        ...userDoc.data(),
        uid: userDoc.id,
        active: userDoc.data().active !== false,
      };
      saveStoredProfile(user.uid, profile);
      return profile;
    }

    await setDoc(userDocRef, {
      ...fallbackProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    saveStoredProfile(user.uid, fallbackProfile);
    return fallbackProfile;
  } catch {
    if (storedProfile) return storedProfile;
    saveStoredProfile(user.uid, fallbackProfile);
    return fallbackProfile;
  }
};

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const userData = await ensureUserProfile(user, {
    displayName: user.displayName || "Usuario de Google",
    role: "administrativo",
  });

  if (userData.active === false) {
    throw new Error("Su cuenta está desactivada. Contacte al administrador.");
  }

  await logAudit({
    userId: user.uid,
    action: "LOGIN",
    module: "auth",
    documentId: user.uid,
    details: `Inicio de sesión con Google: ${user.email}`,
  });

  return { user, userData };
};

export const registerUser = async (email, password, userData) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  await updateProfile(user, { displayName: userData.displayName });
  await ensureUserProfile(user, {
    displayName: userData.displayName,
    role: userData.role || "administrativo",
    phone: userData.phone || "",
    specialty: userData.specialty || "",
    createdBy: userData.createdBy || user.uid,
  });

  return user;
};

export const loginUser = async (email, password) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  const userData = await ensureUserProfile(user, {
    displayName: user.email?.split("@")[0] || "Usuario",
    role: "administrativo",
  });

  if (userData.active === false) {
    throw new Error("Su cuenta está desactivada. Contacte al administrador.");
  }

  await logAudit({
    userId: user.uid,
    action: "LOGIN",
    module: "auth",
    documentId: user.uid,
    details: `Inicio de sesión: ${email}`,
  });

  return { user, userData };
};

export const logoutUser = async (userId) => {
  if (userId) {
    await logAudit({
      userId,
      action: "LOGOUT",
      module: "auth",
      documentId: userId,
      details: "Cierre de sesión",
    });
  }
  return signOut(auth);
};

export const resetPassword = async (email) => {
  return sendPasswordResetEmail(auth, email);
};

export const getUserData = async (uid) => {
  const storedProfile = getStoredProfile(uid);

  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const profile = {
        ...userDoc.data(),
        uid: userDoc.id,
        active: userDoc.data().active !== false,
      };
      saveStoredProfile(uid, profile);
      return profile;
    }
  } catch {
    // fall back to local storage
  }

  return storedProfile || null;
};
