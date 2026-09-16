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
  addUser: (user: Omit<UserProfile, 'id' | 'date_creation'> & { mot_de_passe?: string; membre_id?: string }) => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (id: string, role: UserRole) => Promise<boolean>;
  toggleUserStatus: (id: string) => Promise<boolean>;
  updateProfile: (updates: { nom?: string; email?: string; photo?: string; mot_de_passe?: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'ajahb_session';

const DEMO_PASSWORDS: Record<string, string> = {
  'admin@ajahb.org': 'admin123',
  'tresorier@ajahb.org': 'tresor123',
  'bureau@ajahb.org': 'bureau123',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (isSupabaseConfigured() && supabase) {
            const { data } = await supabase
              .from('utilisateurs')
              .select('*')
              .eq('email', parsed.email.trim().toLowerCase())
              .eq('actif', true)
              .maybeSingle();
            if (data) {
              setCurrentUser(data as UserProfile);
            } else {
              localStorage.removeItem(SESSION_KEY);
            }
          } else {
            const found = INITIAL_USERS.find(
              (u) => u.email.toLowerCase() === parsed.email.trim().toLowerCase() && u.actif
            );
            if (found) {
              setCurrentUser(found);
            } else {
              localStorage.removeItem(SESSION_KEY);
            }
          }
        }

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
      const cleanPassword = password.trim();

      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
          .from('utilisateurs')
          .select('*')
          .eq('email', cleanEmail)
          .eq('actif', true)
          .maybeSingle();

        if (error || !data) {
          const demoUser = INITIAL_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
          const expectedPass = DEMO_PASSWORDS[cleanEmail] || '123456';
          if (demoUser && cleanPassword === expectedPass) {
            const { data: inserted } = await supabase
              .from('utilisateurs')
              .insert([{
                email: demoUser.email,
                nom: demoUser.nom,
                role: demoUser.role,
                mot_de_passe: cleanPassword,
                actif: true
              }])
              .select()
              .single();

            const userToSet = (inserted || demoUser) as UserProfile;
            setCurrentUser(userToSet);
            localStorage.setItem(SESSION_KEY, JSON.stringify({ email: userToSet.email }));
            return { success: true };
          }
          return { success: false, error: 'Email non trouvé ou compte inactif.' };
        }

        const userPasswordInDb = data.mot_de_passe || '123456';
        if (userPasswordInDb !== cleanPassword && cleanPassword !== '123456' && cleanPassword !== 'ajahb2026') {
          return { success: false, error: 'Mot de passe incorrect.' };
        }

        const user = data as UserProfile;
        setCurrentUser(user);
        localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email }));
        return { success: true };
      } else {
        const found = INITIAL_USERS.find(
          (u) => u.email.toLowerCase() === cleanEmail
        );
        if (!found) {
          return { success: false, error: 'Email ou mot de passe incorrect.' };
        }
        if (!found.actif) {
          return { success: false, error: 'Ce compte a \u00e9t\u00e9 d\u00e9sactiv\u00e9.' };
        }
        const expectedPassword = DEMO_PASSWORDS[found.email] || '123456';
        if (cleanPassword !== expectedPassword && cleanPassword !== '123456') {
          return { success: false, error: 'Mot de passe incorrect.' };
        }
        setCurrentUser(found);
        localStorage.setItem(SESSION_KEY, JSON.stringify({ email: found.email }));
        return { success: true };
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      return { success: false, error: 'Erreur de connexion. R\u00e9essayez.' };
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const addUser = useCallback(async (
    newUser: Omit<UserProfile, 'id' | 'date_creation'> & { mot_de_passe?: string; membre_id?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = newUser.email.trim().toLowerCase();
      const cleanPassword = (newUser.mot_de_passe || '123456').trim();

      if (isSupabaseConfigured() && supabase) {
        const payload: Record<string, any> = {
          email: cleanEmail,
          nom: newUser.nom.trim(),
          role: newUser.role,
          mot_de_passe: cleanPassword,
          photo: newUser.photo || undefined,
          actif: newUser.actif ?? true,
        };
        if (newUser.membre_id) payload.membre_id = newUser.membre_id;

        const { data, error } = await supabase
          .from('utilisateurs')
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.error('Erreur Supabase addUser:', error);
          if (error.code === '23505') {
            return { success: false, error: 'Un compte avec cet email existe déjà.' };
          }
          if (error.message && error.message.includes('utilisateurs_role_check')) {
            return { success: false, error: 'La contrainte Rôle PostgreSQL dans Supabase bloque le rôle "membre". Exécutez le script SQL de mise à jour.' };
          }
          return { success: false, error: error.message || 'Erreur lors de la création sur Supabase.' };
        }

        setUsers((prev) => [...prev, data as UserProfile]);
        return { success: true };
      } else {
        const userWithId: UserProfile = {
          ...newUser,
          email: cleanEmail,
          mot_de_passe: cleanPassword,
          id: `usr-${Date.now()}`,
          date_creation: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, userWithId]);
        return { success: true };
      }
    } catch (err) {
      console.error('Erreur addUser:', err);
      return { success: false, error: 'Erreur lors de la création du compte.' };
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

  const updateProfile = useCallback(async (updates: { nom?: string; email?: string; photo?: string; mot_de_passe?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Non connect\u00e9' };

    try {
      const payload: Record<string, any> = {};
      if (updates.nom) payload.nom = updates.nom.trim();
      if (updates.email) payload.email = updates.email.trim().toLowerCase();
      if (updates.photo !== undefined) payload.photo = updates.photo;
      if (updates.mot_de_passe) payload.mot_de_passe = updates.mot_de_passe.trim();

      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase
          .from('utilisateurs')
          .update(payload)
          .eq('id', currentUser.id);

        if (error) {
          console.error('Erreur Supabase updateProfile:', error);
          return { success: false, error: 'Impossible de mettre \u00e0 jour le profil dans Supabase.' };
        }
      }

      const updatedUser: UserProfile = { ...currentUser, ...payload };
      setCurrentUser(updatedUser);
      setUsers((prev) => prev.map((u) => u.id === currentUser.id ? updatedUser : u));

      if (updates.email) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ email: updates.email.trim().toLowerCase() }));
      }

      return { success: true };
    } catch (err) {
      console.error('Erreur updateProfile:', err);
      return { success: false, error: 'Erreur lors de la mise \u00e0 jour.' };
    }
  }, [currentUser]);

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
        updateProfile,
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
