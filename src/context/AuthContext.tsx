'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '@/types';
import { INITIAL_USERS } from '@/lib/demoData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  role: UserRole;
  isDemoMode: boolean;
  isAdmin: boolean;
  isTresorier: boolean;
  isMembreBureau: boolean;
  canEditMembers: boolean;
  canCollectPayments: boolean;
  canManageUsers: boolean;
  loginAs: (user: UserProfile) => void;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  addUser: (user: Omit<UserProfile, 'id' | 'date_creation'>) => Promise<boolean>;
  updateUserRole: (id: string, role: UserRole) => Promise<boolean>;
  toggleUserStatus: (id: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USERS_KEY = 'cotisations_village_users';
const LOCAL_STORAGE_CURRENT_USER_KEY = 'cotisations_village_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseConfigured());

  // Initialisation du stockage local ou Supabase
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isSupabaseConfigured()) {
      setIsDemoMode(true);
      const savedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (savedUsers) {
        try {
          setUsers(JSON.parse(savedUsers));
        } catch {
          setUsers(INITIAL_USERS);
        }
      } else {
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(INITIAL_USERS));
      }

      const savedCurrentUser = localStorage.getItem(LOCAL_STORAGE_CURRENT_USER_KEY);
      if (savedCurrentUser) {
        try {
          setCurrentUser(JSON.parse(savedCurrentUser));
        } catch {
          setCurrentUser(INITIAL_USERS[0]);
        }
      } else {
        // Connecté par défaut comme Trésorier ou Admin pour tester facilement
        setCurrentUser(INITIAL_USERS[1]); // Trésorier par défaut
      }
    } else {
      // Supabase est configuré
      setIsDemoMode(false);
      // Récupération des utilisateurs depuis Supabase
      const fetchSupabaseUsers = async () => {
        if (!supabase) return;
        const { data, error } = await supabase.from('utilisateurs').select('*');
        if (data && !error) {
          setUsers(data as UserProfile[]);
        }
      };
      fetchSupabaseUsers();
    }
  }, []);

  const loginAs = (user: UserProfile) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    }
  };

  const loginWithEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (isDemoMode) {
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        if (!found.actif) {
          return { success: false, error: 'Ce compte a été désactivé par l\'administrateur.' };
        }
        loginAs(found);
        return { success: true };
      }
      return { success: false, error: 'Identifiant ou mot de passe incorrect.' };
    }
    // Avec Supabase
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_CURRENT_USER_KEY);
    }
  };

  const addUser = async (newUser: Omit<UserProfile, 'id' | 'date_creation'>): Promise<boolean> => {
    const userWithId: UserProfile = {
      ...newUser,
      id: `usr-${Date.now()}`,
      date_creation: new Date().toISOString(),
    };

    const updated = [...users, userWithId];
    setUsers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updated));
    }
    return true;
  };

  const updateUserRole = async (id: string, newRole: UserRole): Promise<boolean> => {
    const updated = users.map((u) => (u.id === id ? { ...u, role: newRole } : u));
    setUsers(updated);
    if (currentUser?.id === id) {
      setCurrentUser({ ...currentUser, role: newRole });
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updated));
    }
    return true;
  };

  const toggleUserStatus = async (id: string): Promise<boolean> => {
    const updated = users.map((u) => (u.id === id ? { ...u, actif: !u.actif } : u));
    setUsers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updated));
    }
    return true;
  };

  const role: UserRole = currentUser?.role || 'membre_bureau';
  const isAdmin = role === 'admin';
  const isTresorier = role === 'tresorier';
  const isMembreBureau = role === 'membre_bureau';

  const canEditMembers = isAdmin || isTresorier;
  const canCollectPayments = isAdmin || isTresorier;
  const canManageUsers = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        role,
        isDemoMode,
        isAdmin,
        isTresorier,
        isMembreBureau,
        canEditMembers,
        canCollectPayments,
        canManageUsers,
        loginAs,
        loginWithEmail,
        logout,
        addUser,
        updateUserRole,
        toggleUserStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
