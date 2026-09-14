'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, UserRole } from '@/types';
import { INITIAL_USERS } from '@/lib/demoData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isTresorier: boolean;
  isMembreBureau: boolean;
  canEditMembers: boolean;
  canCollectPayments: boolean;
  canManageUsers: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  addUser: (user: Omit<UserProfile, 'id' | 'date_creation'> & { mot_de_passe?: string }) => Promise<boolean>;
  updateUserRole: (id: string, role: UserRole) => Promise<boolean>;
  toggleUserStatus: (id: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'ajahb_session';

// Mots de passe par défaut pour le mode démo/fallback local
const DEMO_PASSWORDS: Record<string, string> = {
  'admin@ajahb.org': 'admin123',
  'tresorier@ajahb.org': 'tresor123',
  'bureau1@ajahb.org': 'bureau123',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurer la session au chargement
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          // Vérifier que l'utilisateur existe
          if (isSupabaseConfigured() && supabase) {
            const { data } = await supabase
              .from('utilisateurs')
              .select('*')
              .eq('email', parsed.email)
              .eq('actif', true)
              .single();
            if (data) {
              setCurrentUser(data as UserProfile);
            } else {
              localStorage.removeItem(SESSION_KEY);
            }
          } else {
            // Mode démo / local
            const found = INITIAL_USERS.find(
              (u) => u.email === parsed.email && u.actif
            );
            if (found) {
              setCurrentUser(found);
            } else {
              localStorage.removeItem(SESSION_KEY);
            }
          }
        }

        // Charger la liste des utilisateurs
        if (isSupabaseConfigured() && supabase) {
          const { data } = await supabase.from('utilisateurs').select('*');
          if (data && data.length > 0) {
            setUsers(data as UserProfile[]);
          } else {
            setUsers(INITIAL_USERS);
          }
        } else {
          setUsers(INITIAL_USERS);
        }
      } catch (err) {
        console.error('Erreur restauration session:', err);
        setUsers(INITIAL_USERS);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const loginWithEmail = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      if (isSupabaseConfigured() && supabase) {
        // Recherche dans Supabase
        const { data, error } = await supabase
          .from('utilisateurs')
          .select('*')
          .eq('email', cleanEmail)
          .eq('actif', true)
          .single();

        if (error || !data) {
          // Si l'utilisateur n'existe pas encore dans Supabase mais est un user démo, essayer avec la logique démo
          const demoUser = INITIAL_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
          const expectedPass = DEMO_PASSWORDS[cleanEmail];
          if (demoUser && expectedPass && password === expectedPass) {
            // Insérer automatiquement cet utilisateur dans Supabase !
            const { data: inserted } = await supabase
              .from('utilisateurs')
              .insert([{
                email: demoUser.email,
                nom: demoUser.nom,
                role: demoUser.role,
                mot_de_passe: password,
                actif: true
              }])
              .select()
              .single();

            const userToSet = (inserted || demoUser) as UserProfile;
            setCurrentUser(userToSet);
            localStorage.setItem(SESSION_KEY, JSON.stringify({ email: userToSet.email }));
            return { success: true };
          }
          return { success: false, error: 'Email ou mot de passe incorrect.' };
        }

        // Vérifier mot de passe Supabase
        if (data.mot_de_passe && data.mot_de_passe !== password) {
          return { success: false, error: 'Email ou mot de passe incorrect.' };
        }

        const user = data as UserProfile;
        setCurrentUser(user);
        localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email }));
        return { success: true };
      } else {
        // Mode démo local
        const found = INITIAL_USERS.find(
          (u) => u.email.toLowerCase() === cleanEmail
        );
        if (!found) {
          return { success: false, error: 'Email ou mot de passe incorrect.' };
        }
        if (!found.actif) {
          return { success: false, error: 'Ce compte a été désactivé.' };
        }
        const expectedPassword = DEMO_PASSWORDS[found.email] || '123456';
        if (password !== expectedPassword) {
          return { success: false, error: 'Email ou mot de passe incorrect.' };
        }
        setCurrentUser(found);
        localStorage.setItem(SESSION_KEY, JSON.stringify({ email: found.email }));
        return { success: true };
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      return { success: false, error: 'Erreur de connexion. Réessayez.' };
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const addUser = useCallback(async (
    newUser: Omit<UserProfile, 'id' | 'date_creation'> & { mot_de_passe?: string }
  ): Promise<boolean> => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
          .from('utilisateurs')
          .insert([{
            email: newUser.email,
            nom: newUser.nom,
            role: newUser.role,
            mot_de_passe: newUser.mot_de_passe || 'ajahb2026',
            actif: newUser.actif ?? true,
          }])
          .select()
          .single();
        if (error) return false;
        setUsers((prev) => [...prev, data as UserProfile]);
        return true;
      } else {
        const userWithId: UserProfile = {
          ...newUser,
          id: `usr-${Date.now()}`,
          date_creation: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, userWithId]);
        return true;
      }
    } catch {
      return false;
    }
  }, []);

  const updateUserRole = useCallback(async (id: string, newRole: UserRole): Promise<boolean> => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase
          .from('utilisateurs')
          .update({ role: newRole })
          .eq('id', id);
        if (error) return false;
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
      if (currentUser?.id === id) {
        setCurrentUser((prev) => prev ? { ...prev, role: newRole } : null);
      }
      return true;
    } catch {
      return false;
    }
  }, [currentUser]);

  const toggleUserStatus = useCallback(async (id: string): Promise<boolean> => {
    try {
      const user = users.find((u) => u.id === id);
      if (!user) return false;
      
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase
          .from('utilisateurs')
          .update({ actif: !user.actif })
          .eq('id', id);
        if (error) return false;
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, actif: !u.actif } : u)));
      return true;
    } catch {
      return false;
    }
  }, [users]);

  const isAuthenticated = currentUser !== null;
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
        isAuthenticated,
        isLoading,
        isAdmin,
        isTresorier,
        isMembreBureau,
        canEditMembers,
        canCollectPayments,
        canManageUsers,
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
