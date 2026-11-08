import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { hasAccess, roleMeta } from '@/core/navigation';
import { colors, radius, type } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { AppPage } from '@/components/layout/app-page';
import { SectionHeading } from '@/components/layout/section-heading';
import { ActionButton } from '@/components/ui/action-button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ChoicePills } from '@/components/ui/choice-pills';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import { clinicInfo, clinicOrder } from '@/features/clinic/selectors';
import {
  STAFF_ROLES,
  type ClinicCode,
  type Staff,
  type StaffRole,
} from '@/features/clinic/types';

const roleDescription: Record<StaffRole, string> = {
  administrator: 'Akses penuh ke seluruh modul dan pengaturan',
  registration: 'Pendaftaran pasien, antrean, dan kartu pasien',
  doctor: 'Pemeriksaan, rekam medis, dan resep digital',
  nurse: 'Antrean, verifikasi pasien, dan tanda vital',
  pharmacy: 'Stok obat, resep masuk, dan serah terima',
  cashier: 'Tagihan aktif, pembayaran, dan tanda terima',
};

export default function AddUserScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { actions } = useClinic();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<StaffRole>('registration');
  const [clinic, setClinic] = useState<ClinicCode | undefined>(undefined);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Staff | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!user) return null;
  if (!hasAccess(user.role, '/pengguna/tambah')) {
    return <AccessDenied required="administrator" />;
  }

  const dirty = Boolean(
    name || username || password || confirm || clinic || role !== 'registration',
  );

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const suggestUsername = () => {
    const suggestion = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .slice(0, 20);
    setUsername(suggestion);
    clearError('username');
  };

  const selectRole = (nextRole: StaffRole) => {
    setRole(nextRole);
    if (nextRole === 'doctor') {
      setClinic(clinic ?? 'UM');
    } else {
      setClinic(undefined);
    }
    clearError('role');
  };

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (cleanName.length < 3) {
      nextErrors.name = 'Nama lengkap minimal 3 karakter.';
    }
    if (!/^[a-z0-9._]{4,20}$/.test(cleanUsername)) {
      nextErrors.username =
        'Gunakan 4–20 karakter: huruf kecil, angka, titik, atau garis bawah.';
    } else if (actions.isUsernameTaken(cleanUsername)) {
      nextErrors.username = 'Nama pengguna sudah dipakai akun lain.';
    }
    if (password.length < 6) {
      nextErrors.password = 'Kata sandi minimal 6 karakter.';
    }
    if (confirm !== password) {
      nextErrors.confirm = 'Konfirmasi kata sandi belum sama.';
    }
    if (role === 'doctor' && !clinic) {
      nextErrors.clinic = 'Pilih poli penugasan untuk dokter.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      Alert.alert(
        'Periksa formulir',
        Object.values(nextErrors)[0] ?? 'Lengkapi data akun.',
      );
      return;
    }

    const result = actions.addStaff({
      name: cleanName,
      username: cleanUsername,
      password,
      role,
      clinic: role === 'doctor' ? clinic : undefined,
    });
    if (!result.ok || !result.staff) {
      setErrors({
        username: result.message ?? 'Akun belum dapat dibuat. Coba lagi.',
      });
      Alert.alert(
        'Akun belum dibuat',
        result.message ?? 'Periksa kembali data yang diisi.',
      );
      return;
    }

    setCreated(result.staff);
    setSheetOpen(true);
  };

  const finish = () => {
    setSheetOpen(false);
    router.replace('/pengguna');
  };

  const handleBack = () => {
    if (!dirty) {
      if (router.canGoBack()) router.back();
      else router.replace('/pengguna');
      return;
    }
    Alert.alert(
      'Batalkan pembuatan akun?',
      'Data yang sudah diisi akan hilang.',
      [
        { text: 'Tetap di sini', style: 'cancel' },
        {
          text: 'Batalkan',
          style: 'destructive',
          onPress: () => {
            if (router.canGoBack()) router.back();
            else router.replace('/pengguna');
          },
        },
      ],
    );
  };

  return (
    <>
      <AppPage
        header="back"
        title="Tambah akun"
        eyebrow="Manajemen pengguna"
        onBack={handleBack}
        headerRight={<Tag label="Admin" tone="ink" icon="shield-checkmark" />}
        footer={
          <View style={styles.footerBar}>
            <View style={styles.footerCopy}>
              <Text style={styles.footerLabel}>Akun baru</Text>
              <Text style={styles.footerHint}>
                Aktif langsung setelah disimpan
              </Text>
            </View>
            <ActionButton
              label="Buat akun"
              icon="person-add-outline"
              tone="teal"
              onPress={submit}
            />
          </View>
        }
      >
        <View style={styles.container}>
          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={19}
                color={colors.tealDeep}
              />
            </View>
            <Text style={styles.introText}>
              Peran menentukan modul yang dapat dibuka. Pastikan nama pengguna
              dan kata sandi sementara dibagikan secara aman kepada staf.
            </Text>
          </View>

          <View style={styles.section}>
            <SectionHeading label="Identitas pengguna" />
            <TextField
              label="Nama lengkap"
              required
              value={name}
              onChangeText={(value) => {
                setName(value);
                clearError('name');
              }}
              placeholder="Contoh: dr. Alifa Nuraini"
              autoCapitalize="words"
              error={errors.name}
            />
            <TextField
              label="Nama pengguna"
              required
              value={username}
              onChangeText={(value) => {
                setUsername(value.toLowerCase().replace(/\s/g, ''));
                clearError('username');
              }}
              placeholder="contoh: alifa"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.username}
              hint="4–20 karakter: huruf kecil, angka, titik, atau garis bawah."
              right={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Buat nama pengguna otomatis"
                  hitSlop={6}
                  onPress={suggestUsername}
                  style={({ pressed }) => pressed && { opacity: 0.6 }}
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={17}
                    color={colors.tealDeep}
                  />
                </Pressable>
              }
            />
          </View>

          <View style={styles.section}>
            <SectionHeading
              label="Peran & akses"
              right={
                <Tag
                  label={roleMeta[role].label}
                  tone="neutral"
                  icon={roleMeta[role].icon}
                />
              }
            />
            <View style={styles.roleGrid}>
              {STAFF_ROLES.map((entry) => {
                const meta = roleMeta[entry];
                const selected = role === entry;
                return (
                  <Pressable
                    key={entry}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Pilih peran ${meta.label}`}
                    onPress={() => selectRole(entry)}
                    style={({ pressed }) => [
                      styles.roleCard,
                      selected && styles.roleCardSelected,
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <View style={styles.roleTop}>
                      <View
                        style={[
                          styles.roleIcon,
                          { backgroundColor: meta.tint },
                        ]}
                      >
                        <Ionicons
                          name={meta.icon}
                          size={16}
                          color={meta.color}
                        />
                      </View>
                      <View
                        style={[
                          styles.radio,
                          selected && styles.radioSelected,
                        ]}
                      >
                        {selected ? <View style={styles.radioDot} /> : null}
                      </View>
                    </View>
                    <Text style={styles.roleName}>{meta.label}</Text>
                    <Text style={styles.roleDescription}>
                      {roleDescription[entry]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {role === 'doctor' ? (
              <View style={styles.clinicBlock}>
                <Text style={styles.fieldLabel}>Poli penugasan</Text>
                <ChoicePills
                  options={clinicOrder.map((code) => ({
                    value: code,
                    label: clinicInfo[code].label,
                  }))}
                  value={clinic ?? 'UM'}
                  onChange={(value) => {
                    setClinic(value);
                    clearError('clinic');
                  }}
                  scroll
                />
                {errors.clinic ? (
                  <Text style={styles.errorText}>{errors.clinic}</Text>
                ) : (
                  <Text style={styles.hintText}>
                    Dokter hanya melihat antrean pada poli yang ditugaskan.
                  </Text>
                )}
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <SectionHeading label="Keamanan akun" />
            <TextField
              label="Kata sandi sementara"
              required
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearError('password');
              }}
              placeholder="Minimal 6 karakter"
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.password}
              hint="Staf dapat meminta reset sandi kepada administrator."
              right={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    passwordVisible
                      ? 'Sembunyikan kata sandi'
                      : 'Tampilkan kata sandi'
                  }
                  hitSlop={6}
                  onPress={() => setPasswordVisible((prev) => !prev)}
                  style={({ pressed }) => pressed && { opacity: 0.6 }}
                >
                  <Ionicons
                    name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={17}
                    color={colors.muted}
                  />
                </Pressable>
              }
            />
            <TextField
              label="Ulangi kata sandi"
              required
              value={confirm}
              onChangeText={(value) => {
                setConfirm(value);
                clearError('confirm');
              }}
              placeholder="Ketik ulang kata sandi"
              secureTextEntry={!confirmVisible}
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.confirm}
              right={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    confirmVisible
                      ? 'Sembunyikan ulangi kata sandi'
                      : 'Tampilkan ulangi kata sandi'
                  }
                  hitSlop={6}
                  onPress={() => setConfirmVisible((prev) => !prev)}
                  style={({ pressed }) => pressed && { opacity: 0.6 }}
                >
                  <Ionicons
                    name={confirmVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={17}
                    color={colors.muted}
                  />
                </Pressable>
              }
            />
          </View>

          <View style={styles.policy}>
            <Ionicons
              name="information-circle-outline"
              size={15}
              color={colors.muted}
            />
            <Text style={styles.policyText}>
              Akun langsung aktif dengan kata sandi yang Anda tetapkan. Riwayat
              perubahan akun hanya tersimpan pada sesi demo ini.
            </Text>
          </View>
        </View>
      </AppPage>

      <BottomSheet
        visible={sheetOpen}
        onClose={finish}
        title="Akun berhasil dibuat"
        eyebrow="Manajemen pengguna"
        footer={
          <ActionButton
            label="Kembali ke daftar pengguna"
            icon="arrow-forward"
            tone="teal"
            onPress={finish}
            fullWidth
          />
        }
      >
        {created ? (
          <>
            <View style={styles.successHero}>
              <View style={styles.successIcon}>
                <Ionicons
                  name="person-add-outline"
                  size={25}
                  color={colors.green}
                />
              </View>
              <Text style={styles.successTitle}>{created.name}</Text>
              <Tag
                label={roleMeta[created.role].label}
                tone="teal"
                icon={roleMeta[created.role].icon}
              />
            </View>
            <Surface padding={12} style={styles.successCard}>
              <SuccessRow label="Nama pengguna" value={`@${created.username}`} />
              <SuccessRow label="Kata sandi" value={created.password} />
              <SuccessRow
                label="Peran"
                value={roleMeta[created.role].label}
              />
              <SuccessRow
                label="Poli"
                value={
                  created.clinic
                    ? clinicInfo[created.clinic].label
                    : 'Tidak terikat poli'
                }
              />
              <SuccessRow label="Status" value="Aktif" strong />
            </Surface>
            <Text style={styles.successNote}>
              Bagikan kredensial ini secara aman. Administrator dapat mereset
              kata sandi dari daftar pengguna kapan saja.
            </Text>
          </>
        ) : null}
      </BottomSheet>
    </>
  );
}

function SuccessRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.successRow}>
      <Text style={styles.successLabel}>{label}</Text>
      <Text
        style={[
          styles.successValue,
          strong && { color: colors.tealDeep, fontWeight: '800' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    paddingTop: 2,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: colors.tealTint,
    borderWidth: 1,
    borderColor: colors.tealSoft,
    borderRadius: radius.lg,
    padding: 12,
  },
  introIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  introText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 15,
    color: colors.tealDeep,
    paddingTop: 1,
  },
  section: {
    gap: 10,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 140,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 10,
    gap: 5,
  },
  roleCardSelected: {
    backgroundColor: colors.tealTint,
    borderColor: colors.teal,
  },
  roleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  roleIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  radioSelected: {
    borderColor: colors.teal,
  },
  radioDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.teal,
  },
  roleName: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 1,
  },
  roleDescription: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  clinicBlock: {
    gap: 6,
    paddingTop: 2,
  },
  fieldLabel: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  hintText: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  errorText: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '600',
    color: colors.red,
  },
  policy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingHorizontal: 2,
  },
  policyText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.mutedSoft,
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerCopy: {
    flex: 1,
    gap: 1,
  },
  footerLabel: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  footerHint: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  successHero: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  successIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenSoft,
    marginBottom: 2,
  },
  successTitle: {
    ...type.h3,
    textAlign: 'center',
  },
  successCard: {
    gap: 8,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  successLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.muted,
    minWidth: 86,
  },
  successValue: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'right',
  },
  successNote: {
    fontSize: 9,
    lineHeight: 14,
    color: colors.mutedSoft,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
