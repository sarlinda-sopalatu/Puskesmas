import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, type } from '@/core/theme';
import { ActionButton } from '@/components/ui/action-button';
import { AppPage } from './app-page';

type AccessDeniedProps = {
  required: string;
};

export function AccessDenied({ required }: AccessDeniedProps) {
  const router = useRouter();

  return (
    <AppPage header="back" title="Akses terbatas" eyebrow="Keamanan modul">
      <View style={styles.container}>
        <View style={styles.icon}>
          <Ionicons name="lock-closed-outline" size={28} color={colors.tealDeep} />
        </View>
        <Text style={styles.title}>Halaman ini belum terbuka untuk peran Anda.</Text>
        <Text style={styles.description}>
          Modul ini hanya dapat diakses oleh {required}. Hubungi administrator bila
          Anda memerlukan tambahan akses.
        </Text>
        <ActionButton
          label="Kembali ke beranda"
          icon="arrow-back"
          tone="ink"
          onPress={() => router.replace('/beranda')}
          style={styles.button}
        />
      </View>
    </AppPage>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 8,
    gap: 10,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
    marginBottom: 4,
  },
  title: {
    ...type.h2,
    textAlign: 'center',
    maxWidth: 360,
  },
  description: {
    ...type.body,
    textAlign: 'center',
    maxWidth: 340,
    color: colors.muted,
  },
  button: {
    marginTop: 10,
    alignSelf: 'stretch',
    maxWidth: 280,
  },
});
