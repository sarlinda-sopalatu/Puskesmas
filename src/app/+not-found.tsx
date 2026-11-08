import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, type } from '@/core/theme';
import { AppPage } from '@/components/layout/app-page';
import { ActionButton } from '@/components/ui/action-button';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <AppPage header="plain" title="Halaman tidak ditemukan" eyebrow="404">
      <View style={styles.container}>
        <View style={styles.icon}>
          <Ionicons name="compass-outline" size={30} color={colors.tealDeep} />
        </View>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Tautan ini tidak tersedia</Text>
        <Text style={styles.description}>
          Halaman yang Anda cari mungkin sudah dipindahkan atau alamatnya tidak
          lengkap. Kembali ke beranda untuk melanjutkan layanan.
        </Text>
        <ActionButton
          label="Kembali ke beranda"
          icon="arrow-back"
          tone="teal"
          onPress={() => router.replace('/')}
          style={styles.button}
        />
      </View>
    </AppPage>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 48,
    paddingHorizontal: 12,
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
  code: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '900',
    letterSpacing: -1.6,
    color: colors.lineStrong,
  },
  title: {
    ...type.h2,
    textAlign: 'center',
  },
  description: {
    ...type.body,
    textAlign: 'center',
    maxWidth: 330,
    color: colors.muted,
  },
  button: {
    marginTop: 12,
    alignSelf: 'stretch',
    maxWidth: 280,
  },
});
