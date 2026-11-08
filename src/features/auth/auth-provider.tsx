import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type { Staff } from '@/features/clinic/types';
import { useClinic } from '@/features/clinic/clinic-provider';

const SESSION_KEY = 'puskesmas.session.staff';

type SignInResult = {
  ok: boolean;
  message?: string;
};

type AuthContextValue = {
  ready: boolean;
  user: Staff | null;
  signIn: (username: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { staff } = useClinic();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(SESSION_KEY)
      .then((storedId) => {
        if (!mounted) return;
        if (
          storedId &&
          staff.some((member) => member.id === storedId && member.active)
        ) {
          setUserId(storedId);
        } else if (storedId) {
          void AsyncStorage.removeItem(SESSION_KEY);
        }
      })
      .catch(() => {
        // Sesi demo tetap bisa berjalan walau penyimpanan lokal bermasalah.
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [staff]);

  const user = staff.find((member) => member.id === userId && member.active) ?? null;

  const signIn = async (username: string, password: string): Promise<SignInResult> => {
    const normalized = username.trim().toLowerCase();
    const match = staff.find(
      (member) => member.username.toLowerCase() === normalized,
    );
    if (!match) {
      return { ok: false, message: 'Nama pengguna tidak ditemukan.' };
    }
    if (!match.active) {
      return { ok: false, message: 'Akun ini sedang tidak aktif. Hubungi administrator.' };
    }
    if (match.password !== password) {
      return { ok: false, message: 'Kata sandi belum tepat.' };
    }
    setUserId(match.id);
    setReady(true);
    await AsyncStorage.setItem(SESSION_KEY, match.id);
    return { ok: true };
  };

  const signOut = async () => {
    setUserId(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ ready, user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider.');
  }
  return context;
}
