import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  formatDate,
  isValidDate,
  isValidNik,
} from '@/core/format';
import { hasAccess } from '@/core/navigation';
import { colors, radius, type } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { AppPage } from '@/components/layout/app-page';
import { SectionHeading } from '@/components/layout/section-heading';
import { ActionButton } from '@/components/ui/action-button';
import { Avatar } from '@/components/ui/avatar';
import { EmptyNote } from '@/components/ui/empty-note';
import { ProgressRail } from '@/components/ui/progress-rail';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import { coverageInfo } from '@/features/clinic/selectors';
import type { Coverage, Patient, PatientInput, Sex } from '@/features/clinic/types';

const STEPS = ['Identitas', 'Kontak', 'Konfirmasi'];

const STEP_COPY = [
  {
    title: 'Identitas pasien',
    description: 'Masukkan data sesuai KTP atau dokumen identitas resmi.',
  },
  {
    title: 'Kontak & jaminan',
    description: 'Informasi ini membantu penghubungan dan penagihan layanan.',
  },
  {
    title: 'Konfirmasi data',
    description: 'Periksa kembali sebelum data disimpan ke rekam medis.',
  },
];

type FormState = {
  name: string;
  nik: string;
  birthPlace: string;
  birthDate: string;
  sex: Sex;
  address: string;
  phone: string;
  coverage: Coverage;
  emergencyContact: string;
};

type FormErrors = Record<string, string>;

const DEFAULT_FORM: FormState = {
  name: '',
  nik: '',
  birthPlace: '',
  birthDate: '',
  sex: 'L',
  address: '',
  phone: '',
  coverage: 'BPJS',
  emergencyContact: '',
};

function formFromPatient(patient?: Patient): FormState {
  if (!patient) return { ...DEFAULT_FORM };
  return {
    name: patient.name,
    nik: patient.nik,
    birthPlace: patient.birthPlace,
    birthDate: patient.birthDate,
    sex: patient.sex,
    address: patient.address,
    phone: patient.phone,
    coverage: patient.coverage,
    emergencyContact: patient.emergencyContact,
  };
}

export default function DaftarPasienScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { patients, actions } = useClinic();
  const editId = Array.isArray(params.id) ? params.id[0] : params.id;
  const editing = patients.find((patient) => patient.id === editId);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => formFromPatient(editing));
  const [errors, setErrors] = useState<FormErrors>({});

  if (!user) return null;
  if (!hasAccess(user.role, '/pasien/daftar')) {
    return <AccessDenied required="petugas pendaftaran atau administrator" />;
  }

  if (editId && !editing) {
    return (
      <AppPage header="back" title="Ubah pasien" eyebrow="Data pasien">
        <EmptyNote
          icon="person-outline"
          title="Pasien tidak ditemukan"
          description="Data pasien mungkin sudah berubah. Kembali ke direktori untuk memilih pasien."
          action={
            <ActionButton
              label="Kembali ke direktori"
              tone="outline"
              onPress={() => router.replace('/pasien')}
            />
          }
        />
      </AppPage>
    );
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  const collectErrors = (targetStep: number): FormErrors => {
    const next: FormErrors = {};
    if (targetStep === 0) {
      if (!form.name.trim()) next.name = 'Nama lengkap wajib diisi.';
      if (!form.nik.trim()) {
        next.nik = 'NIK wajib diisi.';
      } else if (!isValidNik(form.nik)) {
        next.nik = 'NIK harus tepat 16 digit angka.';
      } else {
        const duplicate = patients.find(
          (patient) => patient.nik === form.nik && patient.id !== editId,
        );
        if (duplicate) {
          next.nik = `NIK sudah terdaftar sebagai ${duplicate.name} (${duplicate.rm}).`;
        }
      }
      if (!form.birthPlace.trim()) next.birthPlace = 'Tempat lahir wajib diisi.';
      if (!isValidDate(form.birthDate)) {
        next.birthDate = 'Gunakan format YYYY-MM-DD, contoh 1994-07-12.';
      }
      if (form.sex !== 'L' && form.sex !== 'P') {
        next.sex = 'Pilih jenis kelamin.';
      }
    }
    if (targetStep === 1) {
      if (form.phone.replace(/\D/g, '').length < 8) {
        next.phone = 'Nomor telepon minimal 8 digit.';
      }
      if (!form.address.trim()) next.address = 'Alamat wajib diisi.';
      if (form.coverage !== 'BPJS' && form.coverage !== 'Umum') {
        next.coverage = 'Pilih jenis jaminan.';
      }
    }
    return next;
  };

  const handleNext = () => {
    const stepErrors = collectErrors(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (step < 2) {
      setStep((previous) => previous + 1);
      return;
    }
    handleSubmit();
  };

  const handleSubmit = () => {
    const identityErrors = collectErrors(0);
    const contactErrors = collectErrors(1);
    const allErrors = { ...identityErrors, ...contactErrors };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      if (Object.keys(identityErrors).length > 0) {
        setStep(0);
      } else {
        setStep(1);
      }
      return;
    }

    const payload: PatientInput = {
      name: form.name.trim(),
      nik: form.nik.trim(),
      birthPlace: form.birthPlace.trim(),
      birthDate: form.birthDate,
      sex: form.sex,
      address: form.address.trim(),
      phone: form.phone.trim(),
      coverage: form.coverage,
      emergencyContact: form.emergencyContact.trim(),
    };

    if (editing) {
      const saved = actions.updatePatient(editing.id, payload);
      if (saved) {
        router.replace(`/pasien/${saved.id}` as Href);
      }
      return;
    }

    const saved = actions.registerPatient(payload);
    router.replace(`/pasien/${saved.id}` as Href);
  };

  const copy = STEP_COPY[step];
  const isEditing = Boolean(editing);

  const footer = (
    <View style={styles.footerRow}>
      {step > 0 ? (
        <ActionButton
          label="Kembali"
          tone="outline"
          icon="arrow-back"
          onPress={() => setStep((previous) => previous - 1)}
          style={styles.footerBack}
        />
      ) : null}
      <ActionButton
        label={
          step === 2
            ? isEditing
              ? 'Simpan perubahan'
              : 'Simpan pasien'
            : 'Lanjut'
        }
        tone="teal"
        icon={step === 2 ? 'checkmark' : 'arrow-forward'}
        iconPosition="right"
        onPress={handleNext}
        style={styles.footerNext}
      />
    </View>
  );

  return (
    <AppPage
      key={step}
      header="back"
      title={isEditing ? 'Ubah pasien' : 'Pasien baru'}
      eyebrow="Data induk"
      footer={footer}
    >
      <View style={styles.container}>
        <ProgressRail steps={STEPS} current={step} />

        <View>
          <Text style={styles.eyebrow}>
            Langkah {step + 1} dari 3 · {isEditing ? 'Mode ubah' : 'Pendaftaran baru'}
          </Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.description}>{copy.description}</Text>
        </View>

        {step === 0 ? (
          <View style={styles.form}>
            <TextField
              label="Nomor Induk Kependudukan"
              required
              value={form.nik}
              onChangeText={(value) =>
                updateField('nik', value.replace(/\D/g, '').slice(0, 16))
              }
              placeholder="16 digit sesuai KTP"
              keyboardType="number-pad"
              maxLength={16}
              error={errors.nik}
              hint="NIK hanya berisi angka dan tidak dapat digunakan ganda."
              suffix={`${form.nik.length}/16`}
            />
            <TextField
              label="Nama lengkap"
              required
              value={form.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder="Nama sesuai identitas"
              autoCapitalize="words"
              error={errors.name}
            />
            <View style={styles.fieldRow}>
              <TextField
                label="Tempat lahir"
                required
                value={form.birthPlace}
                onChangeText={(value) => updateField('birthPlace', value)}
                placeholder="Kota"
                autoCapitalize="words"
                error={errors.birthPlace}
                containerStyle={styles.fieldHalf}
              />
              <TextField
                label="Tanggal lahir"
                required
                value={form.birthDate}
                onChangeText={(value) => updateField('birthDate', value)}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.birthDate}
                containerStyle={styles.fieldHalf}
              />
            </View>
            <View>
              <Text style={styles.fieldLabel}>Jenis kelamin *</Text>
              <View style={styles.sexRow}>
                {(
                  [
                    { value: 'L' as const, label: 'Laki-laki', icon: 'male-outline' as const },
                    { value: 'P' as const, label: 'Perempuan', icon: 'female-outline' as const },
                  ] as const
                ).map((option) => {
                  const selected = form.sex === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => updateField('sex', option.value)}
                      style={({ pressed }) => [
                        styles.sexCard,
                        selected && styles.sexCardSelected,
                        pressed && { opacity: 0.75 },
                      ]}
                    >
                      <View
                        style={[
                          styles.sexIcon,
                          {
                            backgroundColor: selected
                              ? colors.teal
                              : colors.canvasDeep,
                          },
                        ]}
                      >
                        <Ionicons
                          name={option.icon}
                          size={16}
                          color={selected ? colors.white : colors.muted}
                        />
                      </View>
                      <Text
                        style={[
                          styles.sexLabel,
                          selected && styles.sexLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected ? (
                          <Ionicons
                            name="checkmark"
                            size={11}
                            color={colors.white}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              {errors.sex ? <Text style={styles.inlineError}>{errors.sex}</Text> : null}
            </View>
            <View style={styles.infoNote}>
              <Ionicons name="information-circle-outline" size={13} color={colors.muted} />
              <Text style={styles.infoText}>
                Nomor rekam medis dibuat otomatis setelah data disimpan. Pastikan NIK
                diperiksa kembali untuk mencegah duplikasi.
              </Text>
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.form}>
            <TextField
              label="Nomor telepon"
              required
              value={form.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="08xxxxxxxxxx"
              keyboardType="phone-pad"
              maxLength={18}
              error={errors.phone}
              hint="Gunakan nomor yang aktif untuk dihubungi."
            />
            <TextField
              label="Alamat tinggal"
              required
              value={form.address}
              onChangeText={(value) => updateField('address', value)}
              placeholder="Jalan, nomor, kelurahan, kota"
              multiline
              numberOfLines={3}
              error={errors.address}
            />
            <View>
              <Text style={styles.fieldLabel}>Jenis jaminan *</Text>
              <View style={styles.coverageRow}>
                {(['BPJS', 'Umum'] as Coverage[]).map((option) => {
                  const meta = coverageInfo[option];
                  const selected = form.coverage === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => updateField('coverage', option)}
                      style={({ pressed }) => [
                        styles.coverageCard,
                        selected && styles.coverageCardSelected,
                        pressed && { opacity: 0.75 },
                      ]}
                    >
                      <View style={styles.coverageTop}>
                        <View
                          style={[
                            styles.coverageIcon,
                            {
                              backgroundColor: selected
                                ? colors.teal
                                : colors.canvasDeep,
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              option === 'BPJS'
                                ? 'shield-checkmark-outline'
                                : 'card-outline'
                            }
                            size={16}
                            color={selected ? colors.white : colors.muted}
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
                      <Text style={styles.coverageLabel}>{meta.label}</Text>
                      <Text style={styles.coverageDescription}>
                        {meta.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.coverage ? (
                <Text style={styles.inlineError}>{errors.coverage}</Text>
              ) : null}
            </View>
            <TextField
              label="Kontak darurat"
              value={form.emergencyContact}
              onChangeText={(value) => updateField('emergencyContact', value)}
              placeholder="Nama · nomor telepon"
              hint="Opsional. Membantu petugas menghubungi keluarga bila diperlukan."
            />
          </View>
        ) : null}

        {step === 2 ? (
          <>
            <Surface variant="teal" style={styles.reviewHeader}>
              <Avatar name={form.name || 'Pasien'} size={44} />
              <View style={styles.reviewCopy}>
                <Text style={styles.reviewName}>{form.name || 'Nama pasien'}</Text>
                <Text style={styles.reviewMeta}>
                  {editing?.rm ?? 'No. RM dibuat otomatis'} · {form.nik || 'NIK belum diisi'}
                </Text>
              </View>
              <Tag
                label={coverageInfo[form.coverage].label}
                tone={coverageInfo[form.coverage].tone}
              />
            </Surface>

            <SectionHeading label="Identitas" />
            <Surface style={styles.summaryCard}>
              <SummaryRow label="Nama lengkap" value={form.name || '—'} />
              <SummaryRow label="NIK" value={form.nik || '—'} />
              <SummaryRow
                label="Tempat & tanggal lahir"
                value={`${form.birthPlace || '—'}, ${formatDate(form.birthDate)}`}
              />
              <SummaryRow
                label="Jenis kelamin"
                value={form.sex === 'L' ? 'Laki-laki' : 'Perempuan'}
              />
              <SummaryRow
                label="Nomor rekam medis"
                value={editing?.rm ?? 'Dibuat otomatis'}
                last
              />
            </Surface>

            <SectionHeading label="Kontak & jaminan" />
            <Surface style={styles.summaryCard}>
              <SummaryRow label="Telepon" value={form.phone || '—'} />
              <SummaryRow label="Alamat" value={form.address || '—'} />
              <SummaryRow
                label="Jaminan"
                value={coverageInfo[form.coverage].label}
              />
              <SummaryRow
                label="Kontak darurat"
                value={form.emergencyContact || 'Belum diisi'}
                last
              />
            </Surface>

            <View style={styles.confirmNote}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.tealDeep} />
              <Text style={styles.confirmText}>
                Dengan menyimpan, data pasien tersedia untuk pendaftaran antrean,
                pemeriksaan, dan penagihan pada sesi demo ini.
              </Text>
            </View>
          </>
        ) : null}
      </View>
    </AppPage>
  );
}

function SummaryRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, !last && styles.summaryBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 17,
    paddingTop: 4,
  },
  eyebrow: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.tealDeep,
  },
  title: {
    ...type.h1,
    fontSize: 24,
    lineHeight: 29,
    marginTop: 1,
  },
  description: {
    ...type.small,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 1,
  },
  form: {
    gap: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.inkMuted,
    marginBottom: 6,
  },
  sexRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sexCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sexCardSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.tealTint,
  },
  sexIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sexLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
  },
  sexLabelSelected: {
    color: colors.ink,
    fontWeight: '700',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  inlineError: {
    marginTop: 5,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.red,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    color: colors.muted,
  },
  coverageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  coverageCard: {
    flex: 1,
    padding: 11,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 2,
  },
  coverageCardSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.tealTint,
  },
  coverageTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  coverageIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverageLabel: {
    ...type.bodyStrong,
    fontSize: 12,
  },
  coverageDescription: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
    minHeight: 24,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewCopy: {
    flex: 1,
    gap: 1,
  },
  reviewName: {
    ...type.bodyStrong,
    fontSize: 14,
  },
  reviewMeta: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
  },
  summaryCard: {
    gap: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 9,
  },
  summaryBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.muted,
    width: 120,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  confirmNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
  },
  confirmText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    color: colors.muted,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  footerBack: {
    flex: 0.7,
  },
  footerNext: {
    flex: 1.4,
  },
});
