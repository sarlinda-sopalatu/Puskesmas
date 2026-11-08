import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius } from '@/core/theme';
import { roleMeta } from '@/core/navigation';
import { ActionButton } from '@/components/ui/action-button';
import { BrandMark } from '@/components/ui/brand-mark';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';

const DEMO_USERNAMES = ['admin', 'loket', 'dokter', 'perawat', 'apoteker', 'kasir'];

export default function LoginScreen() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const { staff } = useClinic();
  const [username, setUsername] = useState('loket');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Redirect href="/beranda" />;

  const demoAccounts = DEMO_USERNAMES.map((name) =>
    staff.find((member) => member.username === name && member.active),
  ).filter((member): member is NonNullable<typeof member> => Boolean(member));

  const handleSubmit = async () => {
    if (loading) return;
    setError('');
    if (!username.trim() || !password) {
      setError('Lengkapi nama pengguna dan kata sandi terlebih dahulu.');
      return;
    }
    setLoading(true);
    const result = await signIn(username, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? 'Tidak dapat masuk. Coba lagi.');
      return;
    }
    router.replace('/beranda');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[colors.ink, '#123B47', '#0E4E4A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.decorA} />
            <View style={styles.decorB} />
            <View style={styles.heroInner}>
              <View style={styles.brandRow}>
                <BrandMark size={34} tone="light" />
                <View>
                  <Text style={styles.wordmark}>PUSKESMAS</Text>
                  <Text style={styles.wordmarkSub}>SISTEM LAYANAN TERPADU</Text>
                </View>
              </View>

              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>Selamat datang kembali</Text>
                <Text style={styles.heroTitle}>
                  Sehat dimulai dari layanan yang tepat.
                </Text>
                <Text style={styles.heroBody}>
                  Satu alur untuk pendaftaran, antrean, rekam medis, farmasi, dan
                  pembayaran.
                </Text>
              </View>

              <View style={styles.statsRow}>
                {[
                  { value: '6', label: 'Peran terhubung' },
                  { value: '5', label: 'Poli aktif' },
                  { value: '1', label: 'Alur layanan' },
                ].map((item) => (
                  <View key={item.label} style={styles.stat}>
                    <Text style={styles.statValue}>{item.value}</Text>
                    <Text style={styles.statLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>

          <View style={styles.formWrap}>
            <View style={styles.form}>
              <View style={styles.formHeading}>
                <Text style={styles.eyebrow}>Akses petugas</Text>
                <Text style={styles.title}>Masuk ke akun</Text>
                <Text style={styles.description}>
                  Gunakan akun yang diberikan administrator puskesmas.
                </Text>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.red} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.fields}>
                <TextField
                  label="Nama pengguna"
                  placeholder="contoh: loket"
                  value={username}
                  onChangeText={(value) => {
                    setUsername(value);
                    if (error) setError('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                  returnKeyType="next"
                  right={
                    <Ionicons
                      name="person-outline"
                      size={16}
                      color={colors.mutedSoft}
                    />
                  }
                />
                <TextField
                  label="Kata sandi"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (error) setError('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                  right={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
                      }
                      hitSlop={8}
                      onPress={() => setShowPassword((previous) => !previous)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={17}
                        color={colors.muted}
                      />
                    </Pressable>
                  }
                />
              </View>

              <ActionButton
                label="Masuk ke aplikasi"
                icon="arrow-forward"
                iconPosition="right"
                size="lg"
                fullWidth
                loading={loading}
                onPress={handleSubmit}
              />

              <View style={styles.demoHeader}>
                <Text style={styles.demoTitle}>Akun demo</Text>
                <View style={styles.demoHintRow}>
                  <Ionicons name="flash-outline" size={10} color={colors.coral} />
                  <Text style={styles.demoHint}>ketuk untuk isi otomatis</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.demoRow}
              >
                {demoAccounts.map((member) => {
                  const meta = roleMeta[member.role];
                  const selected = username === member.username;
                  return (
                    <Pressable
                      key={member.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Isi akun ${meta.label}`}
                      onPress={() => {
                        setUsername(member.username);
                        setPassword(member.password);
                        setError('');
                      }}
                      style={({ pressed }) => [
                        styles.demoCard,
                        selected && styles.demoCardSelected,
                        pressed && { opacity: 0.75 },
                      ]}
                    >
                      <View style={styles.demoTop}>
                        <View
                          style={[
                            styles.demoIcon,
                            { backgroundColor: selected ? colors.teal : meta.tint },
                          ]}
                        >
                          <Ionicons
                            name={meta.icon}
                            size={14}
                            color={selected ? colors.white : meta.color}
                          />
                        </View>
                        {selected ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={colors.teal}
                          />
                        ) : null}
                      </View>
                      <Text style={styles.demoRole}>{meta.short}</Text>
                      <Text style={styles.demoName} numberOfLines={1}>
                        {member.name}
                      </Text>
                      <Text style={styles.demoCredential}>
                        {member.username} · {member.password}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.footer}>
                <View style={styles.footerLine} />
                <Text style={styles.footerText}>
                  Data demo kembali ke kondisi awal saat aplikasi dimuat ulang. Sesi
                  petugas tetap tersimpan di perangkat ini.
                </Text>
                <Text style={styles.version}>Puskesmas Mobile · Versi 1.0.0</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator color={colors.teal} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  flex: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: colors.canvas,
  },
  hero: {
    paddingTop: 20,
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroInner: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 22,
    gap: 26,
  },
  decorA: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(15, 118, 110, 0.28)',
    top: -120,
    right: -90,
  },
  decorB: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    bottom: -80,
    left: -50,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    letterSpacing: 2.6,
    color: colors.white,
  },
  wordmarkSub: {
    fontSize: 7.5,
    lineHeight: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.45)',
  },
  heroCopy: {
    gap: 8,
    maxWidth: 520,
  },
  heroEyebrow: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.tealSoft,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '800',
    letterSpacing: -1.1,
    color: colors.white,
    maxWidth: 460,
  },
  heroBody: {
    fontSize: 12,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.62)',
    maxWidth: 430,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 18,
  },
  stat: {
    gap: 1,
    paddingRight: 18,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.12)',
  },
  statValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.white,
  },
  statLabel: {
    fontSize: 8.5,
    lineHeight: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.45)',
  },
  formWrap: {
    flex: 1,
    marginTop: -24,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 26,
    paddingBottom: 28,
    paddingHorizontal: 22,
  },
  form: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: 16,
  },
  formHeading: {
    gap: 3,
  },
  eyebrow: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.tealDeep,
  },
  title: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: colors.ink,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    maxWidth: 380,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.redSoft,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  errorText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.red,
  },
  fields: {
    gap: 13,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  demoHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  demoHint: {
    fontSize: 8.5,
    fontWeight: '600',
    color: colors.muted,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  demoCard: {
    width: 146,
    padding: 11,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 3,
  },
  demoCardSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.tealTint,
  },
  demoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  demoIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoRole: {
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  demoName: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  demoCredential: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  footer: {
    marginTop: 10,
    gap: 9,
  },
  footerLine: {
    height: 1,
    backgroundColor: colors.line,
  },
  footerText: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
  },
  version: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.mutedSoft,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(246, 244, 239, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
