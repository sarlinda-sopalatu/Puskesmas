import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import {
  ageFromBirthDate,
  dateKey,
  expiryLabel,
  expiryStatus,
  formatDate,
  formatDateTime,
  formatRupiah,
  isValidDate,
  isoDateAfterDays,
} from '@/core/format';
import { hasAccess, type IconName } from '@/core/navigation';
import { colors, radius, type } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { AppPage } from '@/components/layout/app-page';
import { ActionButton } from '@/components/ui/action-button';
import { Avatar } from '@/components/ui/avatar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { EmptyNote } from '@/components/ui/empty-note';
import { SearchField } from '@/components/ui/search-field';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { TextField } from '@/components/ui/text-field';
import { UnderlineTabs } from '@/components/ui/underline-tabs';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import {
  clinicInfo,
  coverageInfo,
  invoiceTotal,
  ticketStatusInfo,
} from '@/features/clinic/selectors';
import type { PrescriptionLine, StockItem, Vitals } from '@/features/clinic/types';

type Step = 'keluhan' | 'vital' | 'diagnosis' | 'resep';

type FormState = {
  complaint: string;
  history: string;
  vitals: Vitals;
  diagnosis: string;
  treatment: string;
  notes: string;
  referral: string;
  followUpDate: string;
  prescription: PrescriptionLine[];
};

const EMPTY_VITALS: Vitals = {
  bloodPressure: '',
  pulse: '',
  temperature: '',
  respiration: '',
  weight: '',
  height: '',
  oxygen: '',
};

const COMPLAINT_HINTS = [
  'Demam sejak 3 hari',
  'Batuk berdahak',
  'Nyeri kepala berulang',
  'Nyeri perut',
  'Kontrol rutin',
];

const DIAGNOSIS_HINTS = [
  'ISPA non-spesifik',
  'Hipertensi primer',
  'Diabetes melitus tipe 2',
  'Gastritis akut',
  'Dermatitis atopik',
];

const FOLLOW_UP_OPTIONS = [
  { label: '3 hari', days: 3 },
  { label: '1 minggu', days: 7 },
  { label: '2 minggu', days: 14 },
  { label: '1 bulan', days: 30 },
];

const STEP_FOR_ERROR: Record<string, Step> = {
  complaint: 'keluhan',
  bloodPressure: 'vital',
  pulse: 'vital',
  temperature: 'vital',
  respiration: 'vital',
  weight: 'vital',
  height: 'vital',
  oxygen: 'vital',
  diagnosis: 'diagnosis',
  followUpDate: 'diagnosis',
  prescription: 'resep',
};

const ERROR_ORDER = [
  'complaint',
  'bloodPressure',
  'pulse',
  'temperature',
  'respiration',
  'weight',
  'height',
  'oxygen',
  'diagnosis',
  'followUpDate',
  'prescription',
];

export default function MedicalRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const {
    tickets,
    patients,
    records,
    invoices,
    stockItems,
    staff,
    actions,
  } = useClinic();
  const ticketId = Array.isArray(params.id) ? params.id[0] : params.id;
  const ticket = tickets.find((entry) => entry.id === ticketId);
  const patient = ticket
    ? patients.find((entry) => entry.id === ticket.patientId)
    : undefined;
  const existingRecord = ticket
    ? records.find((entry) => entry.ticketId === ticket.id)
    : undefined;
  const linkedInvoice = existingRecord
    ? invoices.find((entry) => entry.recordId === existingRecord.id)
    : undefined;

  const initialForm: FormState = {
    complaint: existingRecord?.complaint ?? '',
    history: existingRecord?.history ?? '',
    vitals: existingRecord?.vitals ?? { ...EMPTY_VITALS },
    diagnosis: existingRecord?.diagnosis ?? '',
    treatment: existingRecord?.treatment ?? '',
    notes: existingRecord?.notes ?? '',
    referral: existingRecord?.referral ?? '',
    followUpDate: existingRecord?.followUpDate ?? '',
    prescription: existingRecord
      ? existingRecord.prescription.map((line) => ({ ...line }))
      : [],
  };

  const [form, setForm] = useState<FormState>(() => initialForm);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initialForm));
  const [step, setStep] = useState<Step>('keluhan');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);

  if (!user) return null;
  if (!hasAccess(user.role, '/periksa')) {
    return <AccessDenied required="dokter, perawat, atau administrator" />;
  }

  if (!ticket || !patient) {
    return (
      <AppPage header="back" title="Rekam medis" eyebrow="Pemeriksaan">
        <EmptyNote
          icon="document-text-outline"
          title="Antrean tidak ditemukan"
          description="Data antrean mungkin sudah berubah atau tautan tidak valid."
          action={
            <ActionButton
              label="Kembali ke daftar periksa"
              tone="outline"
              onPress={() => router.replace('/periksa')}
            />
          }
        />
      </AppPage>
    );
  }

  if (
    user.role === 'doctor' &&
    user.clinic &&
    ticket.clinic !== user.clinic &&
    existingRecord?.doctorId !== user.id
  ) {
    return (
      <AppPage header="back" title="Rekam medis" eyebrow="Pemeriksaan">
        <EmptyNote
          icon="lock-closed-outline"
          title="Antrean berada di poli lain"
          description={`Antrean ${ticket.code} terdaftar di ${clinicInfo[ticket.clinic].label}. Anda hanya dapat membuka pemeriksaan di ${clinicInfo[user.clinic].label}.`}
          action={
            <ActionButton
              label="Lihat worklist saya"
              tone="outline"
              onPress={() => router.replace('/periksa')}
            />
          }
        />
      </AppPage>
    );
  }

  const clinic = clinicInfo[ticket.clinic];
  const locked = linkedInvoice?.status === 'paid';
  const prescriptionLocked = locked || Boolean(existingRecord?.handedOver);
  const waiting = ticket.status === 'waiting';
  const author = existingRecord
    ? staff.find((member) => member.id === existingRecord.doctorId)
    : undefined;
  const savedRecord = savedRecordId
    ? records.find((entry) => entry.id === savedRecordId)
    : undefined;
  const savedInvoice = savedRecord
    ? invoices.find((entry) => entry.recordId === savedRecord.id)
    : undefined;

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setField = <K extends keyof FormState,>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearError(String(key));
  };

  const setVital = (key: keyof Vitals, value: string) => {
    setForm((prev) => ({
      ...prev,
      vitals: { ...prev.vitals, [key]: value },
    }));
    clearError(key);
  };

  const updateLine = (itemId: string, patch: Partial<PrescriptionLine>) => {
    setForm((prev) => ({
      ...prev,
      prescription: prev.prescription.map((line) =>
        line.itemId === itemId ? { ...line, ...patch } : line,
      ),
    }));
    clearError('prescription');
  };

  const changeQuantity = (itemId: string, delta: number) => {
    const item = stockItems.find((entry) => entry.id === itemId);
    const line = form.prescription.find((entry) => entry.itemId === itemId);
    if (!item || !line) return;
    const nextQuantity = line.quantity + delta;
    if (nextQuantity < 1) return;
    if (nextQuantity > item.stock) {
      Alert.alert(
        'Stok tidak cukup',
        `${item.name} hanya tersedia ${item.stock} ${item.unit}.`,
      );
      return;
    }
    updateLine(itemId, { quantity: nextQuantity });
  };

  const removeLine = (itemId: string) => {
    setForm((prev) => ({
      ...prev,
      prescription: prev.prescription.filter((line) => line.itemId !== itemId),
    }));
    clearError('prescription');
  };

  const addMedicine = (item: StockItem) => {
    if (prescriptionLocked) return;
    if (expiryStatus(item.expiry) === 'expired') {
      Alert.alert(
        'Obat kedaluwarsa',
        `${item.name} sudah melewati masa berlaku. Pilih batch lain.`,
      );
      return;
    }
    const current = form.prescription.find((line) => line.itemId === item.id);
    if ((current?.quantity ?? 0) >= item.stock) {
      Alert.alert(
        'Stok tidak cukup',
        `${item.name} hanya tersedia ${item.stock} ${item.unit}.`,
      );
      return;
    }
    setForm((prev) => {
      const existing = prev.prescription.find((line) => line.itemId === item.id);
      if (existing) {
        return {
          ...prev,
          prescription: prev.prescription.map((line) =>
            line.itemId === item.id
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          ),
        };
      }
      return {
        ...prev,
        prescription: [
          ...prev.prescription,
          { itemId: item.id, quantity: 1, instruction: '' },
        ],
      };
    });
    clearError('prescription');
  };

  const validate = () => {
    const next: Record<string, string> = {};

    if (form.complaint.trim().length < 3) {
      next.complaint = 'Tuliskan keluhan utama minimal 3 karakter.';
    }
    if (form.diagnosis.trim().length < 3) {
      next.diagnosis = 'Diagnosis utama wajib diisi.';
    }

    const bloodPressure = form.vitals.bloodPressure.trim();
    if (bloodPressure) {
      const match = /^(\d{2,3})\/(\d{2,3})$/.exec(bloodPressure);
      if (!match) {
        next.bloodPressure = 'Gunakan format 120/80.';
      } else {
        const systolic = Number(match[1]);
        const diastolic = Number(match[2]);
        if (
          systolic < 60 ||
          systolic > 260 ||
          diastolic < 30 ||
          diastolic > 160
        ) {
          next.bloodPressure = 'Nilai tekanan darah di luar rentang wajar.';
        }
      }
    }

    const ranges: [
      keyof Vitals,
      string,
      number,
      number,
      string,
    ][] = [
      ['pulse', 'Nadi', 30, 250, 'bpm'],
      ['temperature', 'Suhu', 30, 45, '°C'],
      ['respiration', 'Pernapasan', 5, 60, 'x/menit'],
      ['weight', 'Berat badan', 1, 300, 'kg'],
      ['height', 'Tinggi badan', 30, 250, 'cm'],
      ['oxygen', 'SpO₂', 50, 100, '%'],
    ];
    for (const [key, label, min, max, unit] of ranges) {
      const raw = form.vitals[key].trim();
      if (!raw) continue;
      const value = Number(raw.replace(',', '.'));
      if (Number.isNaN(value) || value < min || value > max) {
        next[key] = `${label} harus antara ${min}–${max} ${unit}.`;
      }
    }

    const followUp = form.followUpDate.trim();
    if (followUp) {
      if (!isValidDate(followUp)) {
        next.followUpDate = 'Gunakan format tanggal YYYY-MM-DD.';
      } else if (followUp < dateKey()) {
        next.followUpDate = 'Tanggal kontrol tidak boleh di masa lalu.';
      }
    }

    if (form.prescription.length > 0) {
      let prescriptionError = '';
      for (const line of form.prescription) {
        const item = stockItems.find((entry) => entry.id === line.itemId);
        if (!item) {
          prescriptionError = 'Ada obat yang tidak ditemukan di gudang.';
          break;
        }
        if (line.quantity < 1) {
          prescriptionError = `Jumlah ${item.name} minimal 1.`;
          break;
        }
        if (item.stock < line.quantity) {
          prescriptionError = `Stok ${item.name} hanya ${item.stock} ${item.unit}.`;
          break;
        }
        if (expiryStatus(item.expiry) === 'expired') {
          prescriptionError = `${item.name} sudah kedaluwarsa.`;
          break;
        }
        if (!line.instruction.trim()) {
          prescriptionError = `Aturan pakai ${item.name} belum diisi.`;
          break;
        }
      }
      if (prescriptionError) next.prescription = prescriptionError;
    }

    return next;
  };

  const handleSave = () => {
    if (locked) return;
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      const firstKey =
        ERROR_ORDER.find((key) => nextErrors[key]) ?? 'complaint';
      setErrors(nextErrors);
      setStep(STEP_FOR_ERROR[firstKey] ?? 'keluhan');
      Alert.alert(
        'Lengkapi rekam medis',
        nextErrors[firstKey] ?? 'Periksa kembali isian pemeriksaan.',
      );
      return;
    }

    const assignedDoctor =
      existingRecord?.doctorId ??
      staff.find(
        (member) => member.role === 'doctor' && member.clinic === ticket.clinic,
      )?.id ??
      staff.find((member) => member.role === 'doctor')?.id ??
      user.id;

    const saved = actions.saveMedicalRecord({
      ticketId: ticket.id,
      patientId: patient.id,
      doctorId: assignedDoctor,
      complaint: form.complaint.trim(),
      history: form.history.trim(),
      vitals: { ...form.vitals },
      diagnosis: form.diagnosis.trim(),
      treatment: form.treatment.trim(),
      notes: form.notes.trim(),
      referral: form.referral.trim(),
      followUpDate: form.followUpDate.trim(),
      prescription: form.prescription.map((line) => ({
        ...line,
        instruction: line.instruction.trim(),
      })),
    });

    setErrors({});
    setBaseline(JSON.stringify(form));
    setSavedRecordId(saved.id);
    setSheetOpen(true);
  };

  const handleBack = () => {
    const dirty = JSON.stringify(form) !== baseline;
    if (locked || !dirty) {
      if (router.canGoBack()) router.back();
      else router.replace('/periksa');
      return;
    }
    Alert.alert(
      'Tinggalkan pemeriksaan?',
      'Perubahan pada rekam medis ini belum disimpan.',
      [
        { text: 'Tetap di sini', style: 'cancel' },
        {
          text: 'Tinggalkan',
          style: 'destructive',
          onPress: () => {
            if (router.canGoBack()) router.back();
            else router.replace('/periksa');
          },
        },
      ],
    );
  };

  const shareSummary = async () => {
    const record = savedRecordId
      ? records.find((entry) => entry.id === savedRecordId)
      : undefined;
    const invoice = record
      ? invoices.find((entry) => entry.recordId === record.id)
      : undefined;
    const lines = [
      'RINGKASAN PEMERIKSAAN · PUSKESMAS',
      `Pasien: ${patient.name} (${patient.rm})`,
      `Poli: ${clinic.label} · Antrean ${ticket.code}`,
      `Dokter: ${author?.name ?? user.name}`,
      `Diagnosis: ${record?.diagnosis ?? form.diagnosis}`,
      `Tindakan: ${record?.treatment || '—'}`,
      record?.followUpDate
        ? `Kontrol: ${formatDate(record.followUpDate)}`
        : 'Kontrol: tidak dijadwalkan',
      record && record.prescription.length > 0
        ? `Resep: ${record.prescription.length} item obat`
        : 'Resep: tidak ada',
      invoice
        ? `Tagihan: ${invoice.number} · ${formatRupiah(invoiceTotal(invoice))}`
        : '',
      '',
      'Dokumen ringkasan demo, bukan surat resmi.',
    ].filter(Boolean);
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // Dialog berbagi dapat ditutup tanpa aksi lanjutan.
    }
  };

  const tabs: { value: Step; label: string; done: boolean }[] = [
    {
      value: 'keluhan',
      label: 'Keluhan',
      done: form.complaint.trim().length >= 3,
    },
    {
      value: 'vital',
      label: 'Tanda vital',
      done: Boolean(
        form.vitals.bloodPressure &&
          form.vitals.temperature &&
          form.vitals.weight &&
          form.vitals.height,
      ),
    },
    {
      value: 'diagnosis',
      label: 'Diagnosis',
      done: form.diagnosis.trim().length >= 3,
    },
    {
      value: 'resep',
      label: 'Resep',
      done: form.prescription.length > 0,
    },
  ];
  const completedCount = tabs.filter((tab) => tab.done).length;

  const weightValue = Number(form.vitals.weight.replace(',', '.'));
  const heightValue = Number(form.vitals.height.replace(',', '.'));
  const bmi =
    weightValue > 0 && heightValue > 0
      ? weightValue / (heightValue / 100) ** 2
      : null;
  const bmiInfo =
    bmi === null
      ? null
      : bmi < 18.5
        ? {
            label: 'Kurus',
            tone: 'amber' as const,
            note: 'Perlu evaluasi asupan gizi.',
          }
        : bmi < 23
          ? {
              label: 'Normal',
              tone: 'green' as const,
              note: 'Rentang IMT ideal Asia-Pasifik.',
            }
          : bmi < 27.5
            ? {
                label: 'Berisiko',
                tone: 'amber' as const,
                note: 'Edukasi pola makan dan aktivitas.',
              }
            : {
                label: 'Obesitas',
                tone: 'coral' as const,
                note: 'Pertimbangkan skrining metabolik.',
              };

  const prescriptionEstimate = form.prescription.reduce((total, line) => {
    const item = stockItems.find((entry) => entry.id === line.itemId);
    return total + (item?.price ?? 0) * line.quantity;
  }, 0);

  const filteredItems = stockItems
    .filter((item) =>
      `${item.name} ${item.group}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <AppPage
        header="back"
        title="Rekam medis"
        eyebrow="Pemeriksaan pasien"
        onBack={handleBack}
        headerRight={
          locked ? (
            <Tag label="Terkunci" tone="neutral" icon="lock-closed" />
          ) : existingRecord ? (
            <Tag label="Tersimpan" tone="green" dot />
          ) : (
            <Tag label="Baru" tone="amber" dot />
          )
        }
        footer={
          <View style={styles.footerBar}>
            <View style={styles.footerCopy}>
              <Text style={styles.footerLabel}>
                {locked ? 'Rekam medis terkunci' : 'Kelengkapan EMR'}
              </Text>
              <Text style={styles.footerHint} numberOfLines={2}>
                {locked
                  ? `${linkedInvoice?.number ?? 'Tagihan'} sudah lunas`
                  : `${completedCount} dari 4 bagian · keluhan & diagnosis wajib`}
              </Text>
            </View>
            <ActionButton
              label={
                locked
                  ? 'Terkunci'
                  : existingRecord
                    ? 'Perbarui EMR'
                    : 'Simpan EMR'
              }
              icon={locked ? 'lock-closed-outline' : 'save-outline'}
              tone="teal"
              onPress={handleSave}
              disabled={locked}
              style={styles.footerButton}
            />
          </View>
        }
      >
        <View style={styles.container}>
          <View style={styles.chart}>
            <View style={[styles.chartAccent, { backgroundColor: clinic.color }]} />
            <View style={styles.chartTop}>
              <Avatar
                name={patient.name}
                size={46}
                tint={clinic.tint}
                color={clinic.color}
              />
              <View style={styles.chartIdentity}>
                <Text style={styles.chartName} numberOfLines={1}>
                  {patient.name}
                </Text>
                <Text style={styles.chartMeta} numberOfLines={1}>
                  {patient.rm} · {ageFromBirthDate(patient.birthDate)} th ·{' '}
                  {patient.sex === 'L' ? 'Laki-laki' : 'Perempuan'}
                </Text>
              </View>
              <Tag
                label={ticket.code}
                tone={ticket.status === 'done' ? 'green' : 'teal'}
                dot
              />
            </View>
            <View style={styles.chartTags}>
              <Tag
                label={coverageInfo[patient.coverage].label}
                tone={coverageInfo[patient.coverage].tone}
              />
              <Tag
                label={`${clinic.label} · ${clinic.room}`}
                tone="neutral"
                icon={clinic.icon}
              />
              <Tag
                label={ticketStatusInfo[ticket.status].label}
                tone={ticketStatusInfo[ticket.status].tone}
              />
              <Text style={styles.chartTime}>
                {formatDateTime(ticket.createdAt)}
              </Text>
            </View>
            <View style={styles.progress}>
              <View style={styles.progressTop}>
                <Text style={styles.progressLabel}>Kelengkapan data</Text>
                <Text style={styles.progressValue}>
                  {completedCount}/4 bagian
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { flex: Math.max(completedCount, 0.001) },
                  ]}
                />
                <View style={{ flex: Math.max(4 - completedCount, 0.001) }} />
              </View>
            </View>
          </View>

          {waiting ? (
            <View style={styles.callout}>
              <View style={styles.calloutIcon}>
                <Ionicons
                  name="megaphone-outline"
                  size={16}
                  color={colors.amber}
                />
              </View>
              <View style={styles.calloutCopy}>
                <Text style={styles.calloutTitle}>Pasien belum dipanggil</Text>
                <Text style={styles.calloutText}>
                  Panggil agar nomor tampil pada layar ruang.
                </Text>
              </View>
              <ActionButton
                label="Panggil"
                size="sm"
                tone="outline"
                onPress={() => actions.setTicketStatus(ticket.id, 'called')}
              />
            </View>
          ) : null}

          {locked ? (
            <View style={styles.lockBanner}>
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={colors.rose}
              />
              <Text style={styles.lockText}>
                <Text style={styles.lockStrong}>Rekam medis terkunci. </Text>
                {linkedInvoice?.number ?? 'Tagihan'} sudah dibayar. Perubahan
                hanya dapat dilakukan administrator melalui audit.
              </Text>
            </View>
          ) : existingRecord?.handedOver ? (
            <View style={styles.handoverBanner}>
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={colors.tealDeep}
              />
              <Text style={styles.handoverText}>
                Obat sudah diserahkan dan stok telah dipotong. Resep tidak dapat
                diubah, tetapi catatan klinis masih dapat diperbarui.
              </Text>
            </View>
          ) : null}

          <UnderlineTabs tabs={tabs} value={step} onChange={setStep} />

          {step === 'keluhan' ? (
            <Surface padding={14} style={styles.stepCard}>
              <StepIntro
                icon="chatbubble-ellipses-outline"
                title="Keluhan & riwayat"
                hint="Data subjektif pasien saat datang."
              />
              {!locked ? (
                <View style={styles.quickBlock}>
                  <Text style={styles.quickLabel}>Keluhan sering dicatat</Text>
                  <View style={styles.chipRow}>
                    {COMPLAINT_HINTS.map((hint) => (
                      <QuickChip
                        key={hint}
                        label={hint}
                        active={form.complaint === hint}
                        onPress={() => setField('complaint', hint)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
              <TextField
                label="Keluhan utama"
                required
                value={form.complaint}
                onChangeText={(value) => setField('complaint', value)}
                placeholder="Contoh: demam dan batuk sejak tiga hari"
                multiline
                editable={!locked}
                error={errors.complaint}
              />
              <TextField
                label="Riwayat penyakit / alergi"
                value={form.history}
                onChangeText={(value) => setField('history', value)}
                placeholder="Riwayat penyakit, obat, atau alergi yang relevan"
                multiline
                editable={!locked}
                hint="Kosongkan bila tidak ada riwayat berarti."
              />
            </Surface>
          ) : null}

          {step === 'vital' ? (
            <Surface padding={14} style={styles.stepCard}>
              <StepIntro
                icon="pulse-outline"
                title="Tanda vital"
                hint="Isi hasil pengukuran; kosongkan bila tidak diukur."
              />
              <View style={styles.vitalGrid}>
                <TextField
                  containerStyle={styles.vitalCell}
                  label="Tekanan darah"
                  value={form.vitals.bloodPressure}
                  onChangeText={(value) => setVital('bloodPressure', value)}
                  placeholder="120/80"
                  suffix="mmHg"
                  keyboardType="numbers-and-punctuation"
                  editable={!locked}
                  error={errors.bloodPressure}
                />
                <TextField
                  containerStyle={styles.vitalCell}
                  label="Nadi"
                  value={form.vitals.pulse}
                  onChangeText={(value) => setVital('pulse', value)}
                  placeholder="80"
                  suffix="bpm"
                  keyboardType="numeric"
                  editable={!locked}
                  error={errors.pulse}
                />
                <TextField
                  containerStyle={styles.vitalCell}
                  label="Suhu"
                  value={form.vitals.temperature}
                  onChangeText={(value) => setVital('temperature', value)}
                  placeholder="36,8"
                  suffix="°C"
                  keyboardType="decimal-pad"
                  editable={!locked}
                  error={errors.temperature}
                />
                <TextField
                  containerStyle={styles.vitalCell}
                  label="Pernapasan"
                  value={form.vitals.respiration}
                  onChangeText={(value) => setVital('respiration', value)}
                  placeholder="18"
                  suffix="x/mnt"
                  keyboardType="numeric"
                  editable={!locked}
                  error={errors.respiration}
                />
                <TextField
                  containerStyle={styles.vitalCell}
                  label="Berat badan"
                  value={form.vitals.weight}
                  onChangeText={(value) => setVital('weight', value)}
                  placeholder="60"
                  suffix="kg"
                  keyboardType="decimal-pad"
                  editable={!locked}
                  error={errors.weight}
                />
                <TextField
                  containerStyle={styles.vitalCell}
                  label="Tinggi badan"
                  value={form.vitals.height}
                  onChangeText={(value) => setVital('height', value)}
                  placeholder="165"
                  suffix="cm"
                  keyboardType="numeric"
                  editable={!locked}
                  error={errors.height}
                />
                <TextField
                  containerStyle={styles.vitalCell}
                  label="Saturasi oksigen"
                  value={form.vitals.oxygen}
                  onChangeText={(value) => setVital('oxygen', value)}
                  placeholder="98"
                  suffix="%"
                  keyboardType="numeric"
                  editable={!locked}
                  error={errors.oxygen}
                />
              </View>
              {bmiInfo && bmi !== null ? (
                <View style={styles.bmiCard}>
                  <View style={styles.bmiIcon}>
                    <Ionicons
                      name="body-outline"
                      size={18}
                      color={colors.tealDeep}
                    />
                  </View>
                  <View style={styles.bmiCopy}>
                    <Text style={styles.bmiValue}>
                      IMT {bmi.toFixed(1).replace('.', ',')}
                    </Text>
                    <Text style={styles.bmiNote}>{bmiInfo.note}</Text>
                  </View>
                  <Tag label={bmiInfo.label} tone={bmiInfo.tone} />
                </View>
              ) : null}
            </Surface>
          ) : null}

          {step === 'diagnosis' ? (
            <Surface padding={14} style={styles.stepCard}>
              <StepIntro
                icon="medkit-outline"
                title="Diagnosis & rencana"
                hint="Tetapkan diagnosis utama, tindakan, dan jadwal kontrol."
              />
              {!locked ? (
                <View style={styles.quickBlock}>
                  <Text style={styles.quickLabel}>Diagnosis sering dipakai</Text>
                  <View style={styles.chipRow}>
                    {DIAGNOSIS_HINTS.map((hint) => (
                      <QuickChip
                        key={hint}
                        label={hint}
                        active={form.diagnosis === hint}
                        onPress={() => setField('diagnosis', hint)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
              <TextField
                label="Diagnosis utama"
                required
                value={form.diagnosis}
                onChangeText={(value) => setField('diagnosis', value)}
                placeholder="Contoh: ISPA non-spesifik"
                editable={!locked}
                error={errors.diagnosis}
              />
              <TextField
                label="Tindakan / terapi"
                value={form.treatment}
                onChangeText={(value) => setField('treatment', value)}
                placeholder="Tindakan yang diberikan atau rencana terapi"
                multiline
                editable={!locked}
              />
              <TextField
                label="Catatan klinis"
                value={form.notes}
                onChangeText={(value) => setField('notes', value)}
                placeholder="Catatan tambahan untuk tenaga kesehatan"
                multiline
                editable={!locked}
              />
              <TextField
                label="Rujukan"
                value={form.referral}
                onChangeText={(value) => setField('referral', value)}
                placeholder="Contoh: Laboratorium Puskesmas"
                editable={!locked}
              />
              <View style={styles.followUpBlock}>
                <TextField
                  label="Tanggal kontrol"
                  value={form.followUpDate}
                  onChangeText={(value) => setField('followUpDate', value)}
                  placeholder="YYYY-MM-DD"
                  editable={!locked}
                  error={errors.followUpDate}
                  hint={
                    form.followUpDate && isValidDate(form.followUpDate)
                      ? `Kontrol ${formatDate(form.followUpDate)}`
                      : 'Format YYYY-MM-DD; kosongkan bila tidak perlu.'
                  }
                />
                {!locked ? (
                  <View style={styles.chipRow}>
                    {FOLLOW_UP_OPTIONS.map((option) => {
                      const value = isoDateAfterDays(option.days);
                      return (
                        <QuickChip
                          key={option.label}
                          label={option.label}
                          active={form.followUpDate === value}
                          onPress={() => setField('followUpDate', value)}
                        />
                      );
                    })}
                    {form.followUpDate ? (
                      <QuickChip
                        label="Kosongkan"
                        active={false}
                        onPress={() => setField('followUpDate', '')}
                      />
                    ) : null}
                  </View>
                ) : null}
              </View>
            </Surface>
          ) : null}

          {step === 'resep' ? (
            <Surface padding={14} style={styles.stepCard}>
              <View style={styles.rxHeader}>
                <StepIntro
                  icon="flask-outline"
                  title="Resep digital"
                  hint="Stok dicek saat farmasi menyerahkan obat."
                />
                <Tag
                  label={`${form.prescription.length} obat`}
                  tone={form.prescription.length > 0 ? 'teal' : 'neutral'}
                />
              </View>

              {form.prescription.length === 0 ? (
                <EmptyNote
                  icon="medical-outline"
                  title="Belum ada obat diresepkan"
                  description="Tambahkan obat dari formularium bila pasien memerlukan terapi."
                  action={
                    prescriptionLocked ? undefined : (
                      <ActionButton
                        label="Tambah obat"
                        icon="add"
                        tone="teal"
                        onPress={() => setPickerOpen(true)}
                        fullWidth
                      />
                    )
                  }
                />
              ) : (
                <View style={styles.rxList}>
                  {form.prescription.map((line) => {
                    const item = stockItems.find(
                      (entry) => entry.id === line.itemId,
                    );
                    if (!item) return null;
                    const status = expiryStatus(item.expiry);
                    return (
                      <View key={line.itemId} style={styles.rxCard}>
                        <View style={styles.rxTop}>
                          <View style={styles.rxIcon}>
                            <Ionicons
                              name="medical-outline"
                              size={16}
                              color={colors.tealDeep}
                            />
                          </View>
                          <View style={styles.rxCopy}>
                            <Text style={styles.rxName} numberOfLines={2}>
                              {item.name}
                            </Text>
                            <Text style={styles.rxMeta}>
                              {item.group} · stok {item.stock} {item.unit} ·{' '}
                              {formatRupiah(item.price)}/{item.unit}
                            </Text>
                            {status !== 'safe' ? (
                              <Tag
                                label={expiryLabel(item.expiry)}
                                tone={status === 'expired' ? 'red' : 'amber'}
                                style={styles.rxExpiry}
                              />
                            ) : null}
                          </View>
                          {!prescriptionLocked ? (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Hapus ${item.name}`}
                              hitSlop={6}
                              onPress={() => removeLine(item.id)}
                              style={({ pressed }) => [
                                styles.rxRemove,
                                pressed && { opacity: 0.6 },
                              ]}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={15}
                                color={colors.rose}
                              />
                            </Pressable>
                          ) : null}
                        </View>
                        <View style={styles.rxBottom}>
                          <TextField
                            containerStyle={styles.rxInstruction}
                            label="Aturan pakai"
                            required
                            value={line.instruction}
                            onChangeText={(value) =>
                              updateLine(line.itemId, { instruction: value })
                            }
                            placeholder="Contoh: 3x1 sesudah makan"
                            editable={!prescriptionLocked}
                          />
                          {prescriptionLocked ? (
                            <View style={styles.rxLockedQty}>
                              <Text style={styles.rxLockedQtyText}>
                                × {line.quantity}
                              </Text>
                              <Text style={styles.rxLockedQtyUnit}>
                                {item.unit}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.stepper}>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Kurangi jumlah"
                                onPress={() =>
                                  changeQuantity(line.itemId, -1)
                                }
                                style={({ pressed }) => [
                                  styles.stepperButton,
                                  pressed && { backgroundColor: colors.canvasDeep },
                                ]}
                              >
                                <Ionicons
                                  name="remove"
                                  size={14}
                                  color={colors.ink}
                                />
                              </Pressable>
                              <Text style={styles.stepperValue}>
                                {line.quantity}
                              </Text>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Tambah jumlah"
                                onPress={() =>
                                  changeQuantity(line.itemId, 1)
                                }
                                style={({ pressed }) => [
                                  styles.stepperButton,
                                  pressed && { backgroundColor: colors.canvasDeep },
                                ]}
                              >
                                <Ionicons
                                  name="add"
                                  size={14}
                                  color={colors.ink}
                                />
                              </Pressable>
                            </View>
                          )}
                        </View>
                        <View style={styles.rxSubtotalRow}>
                          <Text style={styles.rxSubtotalLabel}>Subtotal</Text>
                          <Text style={styles.rxSubtotal}>
                            {formatRupiah(item.price * line.quantity)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {errors.prescription ? (
                <Text style={styles.rxError}>{errors.prescription}</Text>
              ) : null}

              {form.prescription.length > 0 ? (
                <>
                  <View style={styles.rxTotalCard}>
                    <View>
                      <Text style={styles.rxTotalLabel}>Estimasi obat</Text>
                      <Text style={styles.rxTotalHint}>
                        Masuk ke tagihan pemeriksaan
                      </Text>
                    </View>
                    <Text style={styles.rxTotalValue}>
                      {formatRupiah(prescriptionEstimate)}
                    </Text>
                  </View>
                  {!prescriptionLocked ? (
                    <ActionButton
                      label="Tambah obat lain"
                      icon="add"
                      tone="outline"
                      onPress={() => setPickerOpen(true)}
                      fullWidth
                    />
                  ) : null}
                </>
              ) : null}

              <Text style={styles.rxNote}>
                Harga obat mengikuti tarif demo. Stok baru berkurang setelah
                farmasi menyerahkan resep.
              </Text>
            </Surface>
          ) : null}

          <View style={styles.authorRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={13}
              color={colors.mutedSoft}
            />
            <Text style={styles.authorText}>
              {existingRecord
                ? `Dicatat oleh ${author?.name ?? 'tenaga medis'} · ${formatDateTime(existingRecord.createdAt)}`
                : `Akan dicatat oleh ${user.name}`}
            </Text>
          </View>
        </View>
      </AppPage>

      <BottomSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Tambah obat"
        eyebrow="Formularium puskesmas"
        footer={
          <ActionButton
            label="Selesai memilih"
            tone="ink"
            onPress={() => setPickerOpen(false)}
            fullWidth
          />
        }
      >
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Cari nama obat atau golongan…"
        />
        <View style={styles.sheetList}>
          {filteredItems.length === 0 ? (
            <Text style={styles.sheetEmpty}>
              Tidak ada obat yang cocok dengan pencarian.
            </Text>
          ) : (
            filteredItems.map((item, index) => {
              const status = expiryStatus(item.expiry);
              const current = form.prescription.find(
                (line) => line.itemId === item.id,
              );
              const remaining = Math.max(0, item.stock - (current?.quantity ?? 0));
              const blocked =
                status === 'expired' || remaining <= 0 || prescriptionLocked;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.medRow,
                    index !== filteredItems.length - 1 && styles.medBorder,
                  ]}
                >
                  <View style={styles.medIcon}>
                    <Ionicons
                      name="medical-outline"
                      size={16}
                      color={colors.tealDeep}
                    />
                  </View>
                  <View style={styles.medCopy}>
                    <Text style={styles.medName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.medMeta} numberOfLines={1}>
                      {item.group} · sisa {remaining} {item.unit} ·{' '}
                      {formatRupiah(item.price)}
                    </Text>
                    <View style={styles.medTags}>
                      <Tag
                        label={expiryLabel(item.expiry)}
                        tone={
                          status === 'expired'
                            ? 'red'
                            : status === 'soon'
                              ? 'amber'
                              : 'green'
                        }
                      />
                      {current ? (
                        <Tag
                          label={`${current.quantity} dipilih`}
                          tone="teal"
                          dot
                        />
                      ) : null}
                    </View>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Tambahkan ${item.name}`}
                    disabled={blocked}
                    onPress={() => addMedicine(item)}
                    style={({ pressed }) => [
                      styles.medAdd,
                      blocked && styles.medAddBlocked,
                      pressed && !blocked && { opacity: 0.65 },
                    ]}
                  >
                    <Ionicons
                      name={blocked ? 'close' : 'add'}
                      size={17}
                      color={blocked ? colors.mutedSoft : colors.tealDeep}
                    />
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="EMR berhasil disimpan"
        eyebrow="Ringkasan pemeriksaan"
        footer={
          <View style={styles.sheetFooter}>
            <ActionButton
              label="Bagikan"
              icon="share-social-outline"
              tone="quiet"
              onPress={shareSummary}
              style={styles.sheetFooterButton}
            />
            <ActionButton
              label="Kembali ke worklist"
              icon="arrow-forward"
              tone="teal"
              onPress={() => {
                setSheetOpen(false);
                router.replace('/periksa');
              }}
              style={styles.sheetFooterPrimary}
            />
          </View>
        }
      >
        <View style={styles.successHero}>
          <View style={styles.successIcon}>
            <Ionicons
              name="checkmark"
              size={26}
              color={colors.green}
            />
          </View>
          <Text style={styles.successTitle}>
            Pemeriksaan {patient.name} tersimpan
          </Text>
          <Text style={styles.successText}>
            Antrean ditutup dan tagihan diteruskan ke kasir.
          </Text>
        </View>
        <Surface padding={13} style={styles.summaryCard}>
          <SummaryRow label="Antrean" value={ticket.code} />
          <SummaryRow label="Poli" value={clinic.label} />
          <SummaryRow
            label="Diagnosis"
            value={savedRecord?.diagnosis ?? form.diagnosis}
          />
          <SummaryRow
            label="Resep"
            value={
              form.prescription.length > 0
                ? `${form.prescription.length} item obat`
                : 'Tanpa resep'
            }
          />
          <SummaryRow
            label="Tagihan"
            value={savedInvoice?.number ?? 'Diproses kasir'}
          />
          <SummaryRow
            label="Total"
            value={
              savedInvoice
                ? formatRupiah(invoiceTotal(savedInvoice))
                : 'Menunggu tagihan'
            }
            strong
          />
        </Surface>
        <Text style={styles.summaryNote}>
          Pembayaran dan penyerahan obat diproses oleh petugas kasir dan farmasi.
        </Text>
      </BottomSheet>
    </>
  );
}

function StepIntro({
  icon,
  title,
  hint,
}: {
  icon: IconName;
  title: string;
  hint: string;
}) {
  return (
    <View style={styles.stepIntro}>
      <View style={styles.stepIcon}>
        <Ionicons name={icon} size={18} color={colors.tealDeep} />
      </View>
      <View style={styles.stepCopy}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepHint}>{hint}</Text>
      </View>
    </View>
  );
}

function QuickChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[styles.summaryValue, strong && styles.summaryValueStrong]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 15,
    paddingTop: 2,
  },
  chart: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
    overflow: 'hidden',
  },
  chartAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  chartTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chartIdentity: {
    flex: 1,
    gap: 1,
  },
  chartName: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: -0.35,
    color: colors.ink,
  },
  chartMeta: {
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  chartTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  chartTime: {
    fontSize: 8.5,
    lineHeight: 12,
    fontWeight: '600',
    color: colors.mutedSoft,
  },
  progress: {
    gap: 4,
    marginTop: 1,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  progressLabel: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  progressValue: {
    fontSize: 8.5,
    fontWeight: '700',
    color: colors.tealDeep,
  },
  progressTrack: {
    flexDirection: 'row',
    height: 5,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.canvasDeep,
  },
  progressFill: {
    backgroundColor: colors.teal,
    borderRadius: radius.pill,
  },
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(180, 83, 9, 0.14)',
    padding: 10,
  },
  calloutIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  calloutCopy: {
    flex: 1,
    gap: 1,
  },
  calloutTitle: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '800',
    color: colors.amber,
  },
  calloutText: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.amber,
  },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.roseSoft,
    borderRadius: radius.md,
    padding: 11,
  },
  lockText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.rose,
  },
  lockStrong: {
    fontWeight: '800',
  },
  handoverBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.tealTint,
    borderWidth: 1,
    borderColor: colors.tealSoft,
    borderRadius: radius.md,
    padding: 11,
  },
  handoverText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.tealDeep,
  },
  stepCard: {
    gap: 12,
  },
  stepIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  stepCopy: {
    flex: 1,
    gap: 1,
  },
  stepTitle: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: colors.ink,
  },
  stepHint: {
    fontSize: 9,
    lineHeight: 13,
    color: colors.muted,
  },
  quickBlock: {
    gap: 5,
  },
  quickLabel: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.mutedSoft,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperWarm,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: {
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  vitalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vitalCell: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 130,
  },
  bmiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.tealTint,
    borderWidth: 1,
    borderColor: colors.tealSoft,
    borderRadius: radius.md,
    padding: 10,
  },
  bmiIcon: {
    width: 33,
    height: 33,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  bmiCopy: {
    flex: 1,
    gap: 1,
  },
  bmiValue: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  bmiNote: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  followUpBlock: {
    gap: 7,
  },
  rxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rxList: {
    gap: 8,
  },
  rxCard: {
    backgroundColor: colors.paperWarm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 11,
    gap: 8,
  },
  rxTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  rxIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  rxCopy: {
    flex: 1,
    gap: 1,
  },
  rxName: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  rxMeta: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  rxExpiry: {
    marginTop: 3,
  },
  rxRemove: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.roseSoft,
  },
  rxBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  rxInstruction: {
    flex: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    overflow: 'hidden',
  },
  stepperButton: {
    width: 29,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  rxLockedQty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvasDeep,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rxLockedQtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  rxLockedQtyUnit: {
    fontSize: 8,
    color: colors.muted,
  },
  rxSubtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 6,
  },
  rxSubtotalLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: colors.muted,
  },
  rxSubtotal: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  rxError: {
    ...type.small,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.red,
  },
  rxTotalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    padding: 12,
  },
  rxTotalLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
  },
  rxTotalHint: {
    fontSize: 8.5,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 1,
  },
  rxTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  rxNote: {
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.mutedSoft,
    fontStyle: 'italic',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 1,
  },
  authorText: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.mutedSoft,
    textAlign: 'center',
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
  footerButton: {
    minWidth: 124,
  },
  sheetList: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  sheetEmpty: {
    ...type.small,
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  medBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  medIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  medCopy: {
    flex: 1,
    gap: 1,
  },
  medName: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  medMeta: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  medTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  medAdd: {
    width: 33,
    height: 33,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  medAddBlocked: {
    backgroundColor: colors.canvasDeep,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  sheetFooterButton: {
    flex: 1,
  },
  sheetFooterPrimary: {
    flex: 1.6,
  },
  successHero: {
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
  },
  successIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenSoft,
    marginBottom: 3,
  },
  successTitle: {
    ...type.h3,
    textAlign: 'center',
  },
  successText: {
    ...type.small,
    textAlign: 'center',
    maxWidth: 300,
  },
  summaryCard: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  summaryLabel: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '700',
    color: colors.muted,
    minWidth: 64,
  },
  summaryValue: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'right',
  },
  summaryValueStrong: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.tealDeep,
  },
  summaryNote: {
    ...type.small,
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
    color: colors.mutedSoft,
  },
});
