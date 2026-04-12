import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  token: string;
  userId: number;
  username: string;
  fullName_AR: string;
  fullName_EN: string;
  role: string;
  expiresAt: string;
}

interface AuthStore {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isManager: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      isAdmin: () => get().user?.role === 'Admin',
      isManager: () => ['Admin', 'Manager'].includes(get().user?.role ?? ''),
    }),
    { name: 'docarchive-auth' }
  )
);
