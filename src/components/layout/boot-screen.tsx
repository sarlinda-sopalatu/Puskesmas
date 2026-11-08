import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, type } from '@/core/theme';
import { BrandMark } from '@/components/ui/brand-mark';

export function BootScreen() {
  return (
    <LinearGradient
      colors={[colors.ink, '#123B47', '#0E4B4B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar style="light" />
      <View style={styles.decorA} />
      <View style={styles.decorB} />
      <View style={styles.center}>
        <BrandMark size={70} tone="light" />
        <Text style={styles.wordmark}>PUSKESMAS</Text>
        <Text style={styles.subtitle}>Layanan kesehatan terpadu</Text>
      </View>
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.tealSoft} />
        <Text style={styles.loading}>Menyiapkan sesi…</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorA: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(15, 118, 110, 0.24)',
    top: -110,
    right: -120,
  },
  decorB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(249, 115, 22, 0.09)',
    bottom: -80,
    left: -80,
  },
  center: {
    alignItems: 'center',
    gap: 12,
  },
  wordmark: {
    ...type.display,
    fontSize: 22,
    letterSpacing: 5,
    color: colors.white,
    marginTop: 4,
  },
  subtitle: {
    ...type.small,
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
  },
  footer: {
    position: 'absolute',
    bottom: 54,
    alignItems: 'center',
    gap: 8,
  },
  loading: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.5)',
  },
});
