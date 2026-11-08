import { Redirect, Stack } from 'expo-router';

import { BootScreen } from '@/components/layout/boot-screen';
import { colors } from '@/core/theme';
import { useAuth } from '@/features/auth/auth-provider';

export default function MainLayout() {
  const { ready, user } = useAuth();

  if (!ready) return <BootScreen />;
  if (!user) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    />
  );
}
