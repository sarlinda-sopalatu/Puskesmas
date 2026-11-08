import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/core/theme';
import { AuthProvider } from '@/features/auth/auth-provider';
import { ClinicProvider } from '@/features/clinic/clinic-provider';

export default function RootLayout() {
  return (
    <ClinicProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.canvas },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(main)" />
        </Stack>
      </AuthProvider>
    </ClinicProvider>
  );
}
