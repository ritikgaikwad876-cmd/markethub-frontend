import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMyProfile, loginUser, registerUser } from '../api/userApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 SET SESSION
  const setSession = useCallback((userData) => {
    if (!userData || !userData.token) return;

    localStorage.setItem('markethub_token', userData.token);

    setUser({
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    });
  }, []);

  // 🚪 LOGOUT
  const clearSession = useCallback(() => {
    localStorage.removeItem('markethub_token');
    setUser(null);
  }, []);

  // 🔄 AUTO LOGIN (REFRESH HANDLE)
  const bootstrapAuth = useCallback(async () => {
    const token = localStorage.getItem('markethub_token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchMyProfile();
      setUser(data.user);
    } catch (error) {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  // 🔑 LOGIN FIXED
  const login = useCallback(
    async ({ email, password }) => {
      const res = await loginUser(email.trim().toLowerCase(), password.trim());

      // 🔥 IMPORTANT FIX
      const userData = res.user || res.data?.user;

      if (!userData) {
        throw new Error("Invalid login response");
      }

      setSession(userData);
      return userData;
    },
    [setSession]
  );

  // 📝 REGISTER FIXED
  const register = useCallback(
  async ({ name, email, password }) => {
    try {
      const res = await registerUser({
        name,
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      console.log("REGISTER RESPONSE:", res); // 🔥 DEBUG

      const userData = res.user;

      if (!userData) {
        throw new Error("User not created");
      }

      setSession(userData);
      return userData;

    } catch (error) {
      console.error("REGISTER ERROR:", error.message);
      alert(error.message); // 🔥 IMPORTANT
    }
  },
  [setSession]
);

  // 🚪 LOGOUT CALL
  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};