import { Redirect } from 'expo-router';

import { BootScreen } from '@/components/layout/boot-screen';
import { useAuth } from '@/features/auth/auth-provider';

export default function EntryScreen() {
  const { ready, user } = useAuth();

  if (!ready) return <BootScreen />;
  return <Redirect href={user ? '/beranda' : '/login'} />;
}
