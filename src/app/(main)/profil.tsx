import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  hasAccess,
  moduleCatalog,
  roleGuide,
  roleMeta,
  type ModuleLink,
} from '@/core/navigation';
import { colors, radius, type } from '@/core/theme';
import { AppPage } from '@/components/layout/app-page';
import { SectionHeading } from '@/components/layout/section-heading';
import { Avatar } from '@/components/ui/avatar';
import { BrandMark } from '@/components/ui/brand-mark';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { useAuth } from '@/features/auth/auth-provider';
import { clinicInfo } from '@/features/clinic/selectors';

export default function ProfilScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  if (!user) return null;

  const meta = roleMeta[user.role];
  const modules = moduleCatalog.filter((module) => hasAccess(user.role, module.path));
  const guides = roleGuide[user.role];

  const handleLogout = () => {
    Alert.alert(
      'Keluar dari akun?',
      'Sesi di perangkat ini akan dihapus. Data demo tetap kembali ke kondisi awal saat aplikasi dimuat ulang.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ],
    );
  };

  const showAbout = () => {
    Alert.alert(
      'Tentang aplikasi',
      'Puskesmas Mobile · Versi 1.0.0\nExpo SDK 58 · React Native 0.88 · TypeScript\n\nData bersifat demo lokal. Dibangun dengan alur Scrum dan struktur feature-based.',
      [{ text: 'Tutup' }],
    );
  };

  return (
    <AppPage dock>
      <View style={styles.container}>
        <View>
          <Text style={styles.eyebrow}>Akun saya</Text>
          <Text style={styles.title}>Profil & pengaturan</Text>
        </View>

        <LinearGradient
          colors={[colors.ink, '#143D47', '#0F4D49']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.masthead}
        >
          <View style={styles.mastheadDecorA} />
          <View style={styles.mastheadDecorB} />
          <View style={styles.mastheadTop}>
            <BrandMark size={28} tone="light" />
            <Tag label={user.active ? 'Aktif' : 'Nonaktif'} tone="green" dot />
          </View>
          <View style={styles.profileRow}>
            <Avatar
              name={user.name}
              size={60}
              tint={colors.paper}
              color={colors.tealDeep}
            />
            <View style={styles.profileCopy}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.role}>{meta.label}</Text>
              <Text style={styles.username}>@{user.username}</Text>
            </View>
          </View>
          <View style={styles.mastheadFooter}>
            <View style={styles.mastheadPill}>
              <Ionicons
                name={user.clinic ? 'location-outline' : 'business-outline'}
                size={11}
                color="rgba(255,255,255,0.65)"
              />
              <Text style={styles.mastheadPillText}>
                {user.clinic ? clinicInfo[user.clinic].label : 'Puskesmas terpadu'}
              </Text>
            </View>
            <View style={styles.mastheadPill}>
              <Ionicons name="layers-outline" size={11} color="rgba(255,255,255,0.65)" />
              <Text style={styles.mastheadPillText}>{modules.length} modul terbuka</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <SectionHeading label="Modul Anda" />
          <View style={styles.moduleGrid}>
            {modules
              .filter((module) => module.path !== '/profil')
              .map((module) => (
                <ModuleTile
                  key={module.path}
                  module={module}
                  onPress={() => router.push(module.href)}
                />
              ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading label="Panduan peran" />
          <Surface style={styles.guideCard}>
            <View style={styles.guideTop}>
              <View style={[styles.guideIcon, { backgroundColor: meta.tint }]}>
                <Ionicons name={meta.icon} size={17} color={meta.color} />
              </View>
              <View style={styles.guideCopy}>
                <Text style={styles.guideTitle}>Cara menggunakan akun ini</Text>
                <Text style={styles.guideSubtitle}>
                  Tiga kebiasaan singkat untuk peran {meta.short.toLowerCase()}.
                </Text>
              </View>
            </View>
            <View style={styles.guideList}>
              {guides.map((guide, index) => (
                <View key={guide} style={styles.guideRow}>
                  <View style={styles.guideNumber}>
                    <Text style={styles.guideNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.guideText}>{guide}</Text>
                </View>
              ))}
            </View>
          </Surface>
        </View>

        <View style={styles.section}>
          <SectionHeading label="Pengaturan" />
          <Surface style={styles.settingsCard} padding={0}>
            {user.role === 'administrator' ? (
              <SettingRow
                icon="shield-checkmark-outline"
                tint={colors.canvasDeep}
                color={colors.ink}
                title="Kelola pengguna"
                description="Tambah akun, atur peran, dan reset kata sandi."
                onPress={() => router.push('/pengguna')}
              />
            ) : null}
            <SettingRow
              icon="information-circle-outline"
              tint={colors.tealSoft}
              color={colors.tealDeep}
              title="Tentang aplikasi"
              description="Versi, teknologi, dan catatan data demo."
              onPress={showAbout}
            />
            <SettingRow
              icon="log-out-outline"
              tint={colors.redSoft}
              color={colors.red}
              title="Keluar dari akun"
              description="Hapus sesi aktif dari perangkat ini."
              onPress={handleLogout}
              danger
              last
            />
          </Surface>
        </View>

        <View style={styles.sessionNote}>
          <Ionicons name="lock-closed-outline" size={12} color={colors.mutedSoft} />
          <Text style={styles.sessionText}>
            Sesi disimpan lokal. Kata sandi hanya disimulasikan untuk keperluan demo.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>PUSKESMAS</Text>
          <Text style={styles.footerVersion}>Mobile v1.0.0 · Expo SDK 58</Text>
        </View>
      </View>
    </AppPage>
  );
}

function ModuleTile({
  module,
  onPress,
}: {
  module: ModuleLink;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Buka ${module.label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.moduleTile,
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.moduleIcon, { backgroundColor: module.tint }]}>
        <Ionicons name={module.icon} size={15} color={module.color} />
      </View>
      <Text style={styles.moduleLabel} numberOfLines={1}>
        {module.label}
      </Text>
      <Ionicons name="chevron-forward" size={12} color={colors.mutedSoft} />
    </Pressable>
  );
}

function SettingRow({
  icon,
  tint,
  color,
  title,
  description,
  onPress,
  danger = false,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  color: string;
  title: string;
  description: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        !last && styles.settingBorder,
        pressed && { backgroundColor: colors.canvasDeep },
      ]}
    >
      <View style={[styles.settingIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, danger && { color: colors.red }]}>
          {title}
        </Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={14}
        color={danger ? colors.red : colors.mutedSoft}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingTop: 4,
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
    ...type.h1,
    fontSize: 27,
    lineHeight: 32,
    marginTop: 2,
  },
  masthead: {
    borderRadius: radius.lg + 2,
    padding: 16,
    overflow: 'hidden',
    gap: 12,
  },
  mastheadDecorA: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -60,
    top: -80,
    backgroundColor: 'rgba(15, 118, 110, 0.24)',
  },
  mastheadDecorB: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    right: 40,
    bottom: -60,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  mastheadTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileCopy: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.white,
  },
  role: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.tealSoft,
  },
  username: {
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(255,255,255,0.45)',
  },
  mastheadFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  mastheadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mastheadPillText: {
    fontSize: 8.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
  },
  section: {
    gap: 10,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  moduleTile: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  moduleIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleLabel: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  guideCard: {
    gap: 14,
  },
  guideTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guideIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideCopy: {
    flex: 1,
    gap: 1,
  },
  guideTitle: {
    ...type.bodyStrong,
    fontSize: 13,
  },
  guideSubtitle: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
  },
  guideList: {
    gap: 10,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  guideNumber: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvasDeep,
  },
  guideNumberText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.tealDeep,
  },
  guideText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: colors.inkSoft,
  },
  settingsCard: {
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingCopy: {
    flex: 1,
    gap: 1,
  },
  settingTitle: {
    ...type.bodyStrong,
    fontSize: 12.5,
  },
  settingDescription: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
  },
  sessionNote: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  sessionText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.mutedSoft,
  },
  footer: {
    alignItems: 'center',
    gap: 2,
    paddingTop: 4,
  },
  footerBrand: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.mutedSoft,
  },
  footerVersion: {
    fontSize: 8,
    color: colors.mutedSoft,
  },
});
