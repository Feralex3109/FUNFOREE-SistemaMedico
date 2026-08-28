import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import { getUserData, logoutUser } from "../firebase/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      if (user) {
        setCurrentUser(user);
        const data = await getUserData(user.uid);
        if (isMounted) setUserData(data);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }

      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    await logoutUser(currentUser?.uid);
    setCurrentUser(null);
    setUserData(null);
  };

  const hasRole = (roles) => {
    if (!userData) return false;
    if (typeof roles === "string") return userData.role === roles;
    return roles.includes(userData.role);
  };

  const value = {
    currentUser,
    userData,
    loading,
    logout,
    hasRole,
    isAdmin: userData?.role === "admin",
    isMedico: userData?.role === "medico",
    isAdministrativo: userData?.role === "administrativo",
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
