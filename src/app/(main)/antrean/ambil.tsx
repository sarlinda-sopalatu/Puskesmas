import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import {
  ageFromBirthDate,
  formatRupiah,
  isToday,
  maskedNik,
  waitLabel,
} from '@/core/format';
import { hasAccess } from '@/core/navigation';
import { colors, radius, type } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { AppPage } from '@/components/layout/app-page';
import { SectionHeading } from '@/components/layout/section-heading';
import { ActionButton } from '@/components/ui/action-button';
import { Avatar } from '@/components/ui/avatar';
import { ChoicePills } from '@/components/ui/choice-pills';
import { EmptyNote } from '@/components/ui/empty-note';
import { ProgressRail } from '@/components/ui/progress-rail';
import { SearchField } from '@/components/ui/search-field';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { TicketCard } from '@/components/ui/ticket-card';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import { clinicInfo, clinicOrder, coverageInfo } from '@/features/clinic/selectors';
import type { ClinicCode } from '@/features/clinic/types';

const PRIORITY_REASONS = ['Lansia', 'Ibu hamil', 'Anak', 'Disabilitas', 'Darurat'];

const STEP_LABELS = ['Pasien', 'Poli', 'Konfirmasi'];

const STEP_COPY = [
  {
    title: 'Pilih pasien',
    description: 'Cari berdasarkan nama, NIK, atau nomor rekam medis.',
  },
  {
    title: 'Tentukan poli',
    description: 'Pilih tujuan layanan dan tandai bila pasien perlu didahulukan.',
  },
  {
    title: 'Periksa kembali',
    description: 'Pastikan data pasien dan poli sudah tepat sebelum tiket dibuat.',
  },
];

export default function AmbilAntreanScreen() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const { user } = useAuth();
  const { patients, tickets, actions } = useClinic();

  const initialPatientId = Array.isArray(patientId) ? patientId[0] : patientId;
  const [step, setStep] = useState(initialPatientId ? 1 : 0);
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(
    initialPatientId,
  );
  const [selectedClinic, setSelectedClinic] = useState<ClinicCode>('UM');
  const [priority, setPriority] = useState(false);
  const [priorityNote, setPriorityNote] = useState('Lansia');
  const [query, setQuery] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;
  if (!hasAccess(user.role, '/antrean/ambil')) {
    return <AccessDenied required="petugas pendaftaran atau administrator" />;
  }

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredPatients = patients.filter((patient) => {
    if (!normalizedQuery) return true;
    return (
      patient.name.toLowerCase().includes(normalizedQuery) ||
      patient.nik.includes(normalizedQuery) ||
      patient.rm.toLowerCase().includes(normalizedQuery)
    );
  });

  const clinicTickets = tickets.filter((ticket) => ticket.clinic === selectedClinic);
  const waitingNow = clinicTickets.filter((ticket) => ticket.status === 'waiting').length;
  const nextNumber =
    clinicTickets.reduce((max, ticket) => Math.max(max, ticket.number), 0) + 1;
  const nextCode = `${selectedClinic}-${String(nextNumber).padStart(3, '0')}`;
  const estimate = priority ? 5 : 10 + waitingNow * 5;

  const activeTicket = selectedPatient
    ? tickets.find(
        (ticket) =>
          ticket.patientId === selectedPatient.id &&
          isToday(ticket.createdAt) &&
          (ticket.status === 'waiting' || ticket.status === 'called'),
      )
    : undefined;

  const handleNext = () => {
    if (step === 0) {
      if (!selectedPatientId) {
        setAttempted(true);
        return;
      }
      setAttempted(false);
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    if (!selectedPatient || submitting) {
      setStep(0);
      setAttempted(true);
      return;
    }
    setSubmitting(true);
    const ticket = actions.createTicket({
      patientId: selectedPatient.id,
      clinic: selectedClinic,
      priority,
      priorityNote: priority ? priorityNote : undefined,
    });
    router.replace(`/antrean/${ticket.id}` as Href);
  };

  const copy = STEP_COPY[step];

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
          step === 0
            ? 'Lanjut pilih poli'
            : step === 1
              ? 'Lanjut ke konfirmasi'
              : 'Konfirmasi tiket'
        }
        tone="teal"
        icon={step === 2 ? 'checkmark' : 'arrow-forward'}
        iconPosition="right"
        loading={submitting}
        onPress={handleNext}
        style={styles.footerNext}
      />
    </View>
  );

  return (
    <AppPage
      key={step}
      header="back"
      title="Antrean baru"
      eyebrow="Pendaftaran layanan"
      footer={footer}
    >
      <View style={styles.container}>
        <ProgressRail steps={STEP_LABELS} current={step} />

        <View>
          <Text style={styles.eyebrow}>Langkah {step + 1} dari 3</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.description}>{copy.description}</Text>
        </View>

        {step === 0 ? (
          <>
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder="Cari nama, NIK, atau No. RM…"
            />

            {attempted && !selectedPatientId ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={15} color={colors.red} />
                <Text style={styles.errorText}>
                  Pilih satu pasien terlebih dahulu untuk melanjutkan.
                </Text>
              </View>
            ) : null}

            {selectedPatient ? (
              <Surface variant="teal" style={styles.selectedCard}>
                <Avatar name={selectedPatient.name} size={40} />
                <View style={styles.selectedCopy}>
                  <Text style={styles.selectedName}>{selectedPatient.name}</Text>
                  <Text style={styles.selectedMeta}>
                    {selectedPatient.rm} · {ageFromBirthDate(selectedPatient.birthDate)} tahun
                  </Text>
                </View>
                <Tag label="Dipilih" tone="teal" dot />
              </Surface>
            ) : null}

            <View style={styles.listSection}>
              <SectionHeading
                label="Daftar pasien"
                right={<Text style={styles.count}>{filteredPatients.length} orang</Text>}
              />
              {filteredPatients.length === 0 ? (
                <EmptyNote
                  icon="person-outline"
                  title="Pasien belum ditemukan"
                  description="Coba kata kunci lain, atau daftarkan pasien baru terlebih dahulu."
                  action={
                    <ActionButton
                      label="Daftarkan pasien baru"
                      tone="teal"
                      icon="person-add-outline"
                      onPress={() => router.push('/pasien/daftar')}
                    />
                  }
                />
              ) : (
                <Surface padding={0} style={styles.listCard}>
                  {filteredPatients.map((patient, index) => {
                    const selected = patient.id === selectedPatientId;
                    const patientActive = tickets.find(
                      (ticket) =>
                        ticket.patientId === patient.id &&
                        isToday(ticket.createdAt) &&
                        (ticket.status === 'waiting' || ticket.status === 'called'),
                    );
                    return (
                      <Pressable
                        key={patient.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => {
                          setSelectedPatientId(patient.id);
                          setAttempted(false);
                        }}
                        style={({ pressed }) => [
                          styles.patientRow,
                          index !== filteredPatients.length - 1 &&
                            styles.patientRowBorder,
                          selected && styles.patientRowSelected,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Avatar
                          name={patient.name}
                          size={36}
                          tint={selected ? colors.tealSoft : colors.canvasDeep}
                          color={selected ? colors.tealDeep : colors.inkMuted}
                        />
                        <View style={styles.patientCopy}>
                          <Text style={styles.patientName} numberOfLines={1}>
                            {patient.name}
                          </Text>
                          <Text style={styles.patientMeta} numberOfLines={1}>
                            {patient.rm} · {patient.nik} ·{' '}
                            {ageFromBirthDate(patient.birthDate)} thn
                          </Text>
                          {patientActive ? (
                            <Tag
                              label={`Sudah antre ${patientActive.code}`}
                              tone="amber"
                              style={styles.activeTag}
                            />
                          ) : null}
                        </View>
                        <View
                          style={[
                            styles.radio,
                            selected && styles.radioSelected,
                          ]}
                        >
                          {selected ? (
                            <Ionicons name="checkmark" size={12} color={colors.white} />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </Surface>
              )}
            </View>

            <View style={styles.registerNote}>
              <Text style={styles.registerCopy}>Pasien baru belum terdaftar?</Text>
              <Text
                style={styles.registerLink}
                onPress={() => router.push('/pasien/daftar')}
              >
                Buat rekam medis baru
              </Text>
            </View>
          </>
        ) : null}

        {step === 1 ? (
          <>
            {selectedPatient ? (
              <Surface variant="flat" style={styles.compactPatient}>
                <Avatar name={selectedPatient.name} size={34} />
                <View style={styles.selectedCopy}>
                  <Text style={styles.compactName}>{selectedPatient.name}</Text>
                  <Text style={styles.compactMeta}>
                    {selectedPatient.rm} ·{' '}
                    {patientSexLabel(selectedPatient.sex)} ·{' '}
                    {coverageInfo[selectedPatient.coverage].label}
                  </Text>
                </View>
                <Text style={styles.changeLink} onPress={() => setStep(0)}>
                  Ganti
                </Text>
              </Surface>
            ) : null}

            <View style={styles.section}>
              <SectionHeading label="Pilih poli" />
              <View style={styles.clinicGrid}>
                {clinicOrder.map((code) => {
                  const clinic = clinicInfo[code];
                  const selected = selectedClinic === code;
                  return (
                    <Pressable
                      key={code}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setSelectedClinic(code)}
                      style={({ pressed }) => [
                        styles.clinicCard,
                        selected && styles.clinicCardSelected,
                        pressed && { opacity: 0.75 },
                      ]}
                    >
                      <View style={styles.clinicTop}>
                        <View
                          style={[
                            styles.clinicIcon,
                            { backgroundColor: selected ? colors.teal : clinic.tint },
                          ]}
                        >
                          <Ionicons
                            name={clinic.icon}
                            size={16}
                            color={selected ? colors.white : clinic.color}
                          />
                        </View>
                        <View style={styles.clinicPrefix}>
                          <Text style={styles.clinicPrefixText}>{code}</Text>
                        </View>
                      </View>
                      <Text style={styles.clinicName}>{clinic.label}</Text>
                      <Text style={styles.clinicDescription} numberOfLines={2}>
                        {clinic.description}
                      </Text>
                      <Text style={styles.clinicFee}>
                        {formatRupiah(clinic.fee)}
                      </Text>
                      {selected ? (
                        <View style={styles.selectedCheck}>
                          <Ionicons name="checkmark" size={10} color={colors.white} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Surface
              variant={priority ? 'teal' : 'outline'}
              style={styles.priorityCard}
            >
              <View style={styles.priorityTop}>
                <View style={styles.priorityIcon}>
                  <Ionicons name="flash" size={16} color={colors.coral} />
                </View>
                <View style={styles.priorityCopy}>
                  <Text style={styles.priorityTitle}>Dahulukan pasien</Text>
                  <Text style={styles.priorityText}>
                    Aktifkan untuk kondisi mendesak atau kelompok rentan.
                  </Text>
                </View>
                <Switch
                  value={priority}
                  onValueChange={setPriority}
                  trackColor={{ false: colors.lineStrong, true: colors.teal }}
                  thumbColor={colors.white}
                  ios_backgroundColor={colors.lineStrong}
                />
              </View>
              {priority ? (
                <View style={styles.reasonWrap}>
                  <Text style={styles.reasonLabel}>Alasan prioritas</Text>
                  <ChoicePills
                    options={PRIORITY_REASONS.map((reason) => ({
                      value: reason,
                      label: reason,
                    }))}
                    value={priorityNote}
                    onChange={setPriorityNote}
                    scroll
                  />
                </View>
              ) : null}
            </Surface>

            <Surface variant="flat" style={styles.estimateCard}>
              <View style={styles.estimateIcon}>
                <Ionicons name="time-outline" size={18} color={colors.tealDeep} />
              </View>
              <View style={styles.estimateCopy}>
                <Text style={styles.estimateLabel}>Perkiraan menunggu</Text>
                <Text style={styles.estimateValue}>
                  {waitLabel(estimate)} · {nextCode}
                </Text>
              </View>
              <Tag label={`${waitingNow} antre`} tone="amber" />
            </Surface>

            {priority ? (
              <View style={styles.priorityNote}>
                <Ionicons name="information-circle-outline" size={13} color={colors.amber} />
                <Text style={styles.priorityNoteText}>
                  Tiket prioritas akan dipanggil lebih dahulu setelah pasien yang sedang
                  dilayani.
                </Text>
              </View>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <SectionHeading label="Pratinjau tiket" />
            <TicketCard
              code={nextCode}
              clinicLabel={clinicInfo[selectedClinic].label}
              patientName={selectedPatient?.name}
              statusLabel="Pratinjau"
              statusTone="amber"
              meta={`${waitLabel(estimate)} · ${clinicInfo[selectedClinic].room}`}
              priority={priority}
            />

            <View style={styles.section}>
              <SectionHeading label="Rincian kunjungan" />
              <Surface style={styles.summaryCard}>
                <SummaryRow
                  label="Pasien"
                  value={selectedPatient?.name ?? '—'}
                />
                <SummaryRow
                  label="Rekam medis"
                  value={selectedPatient?.rm ?? '—'}
                />
                <SummaryRow
                  label="NIK"
                  value={selectedPatient ? maskedNik(selectedPatient.nik) : '—'}
                />
                <SummaryRow
                  label="Poli tujuan"
                  value={`${clinicInfo[selectedClinic].label} · ${clinicInfo[selectedClinic].room}`}
                />
                <SummaryRow
                  label="Jaminan"
                  value={
                    selectedPatient
                      ? coverageInfo[selectedPatient.coverage].label
                      : '—'
                  }
                />
                <SummaryRow
                  label="Prioritas"
                  value={priority ? `Ya · ${priorityNote}` : 'Reguler'}
                  last
                />
              </Surface>
            </View>

            {activeTicket ? (
              <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={16} color={colors.amber} />
                <Text style={styles.warningText}>
                  Pasien masih memiliki antrean aktif {activeTicket.code}. Pastikan ini
                  kunjungan terpisah sebelum membuat tiket baru.
                </Text>
              </View>
            ) : null}

            <View style={styles.previewNote}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.tealDeep} />
              <Text style={styles.previewNoteText}>
                Nomor final dibuat saat Anda menekan tombol konfirmasi. Tiket otomatis
                tampil di papan antrean dan display ruang tunggu.
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

function patientSexLabel(sex: 'L' | 'P'): string {
  return sex === 'L' ? 'Laki-laki' : 'Perempuan';
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
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
  section: {
    gap: 10,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.redSoft,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radius.md,
    padding: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.red,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedCopy: {
    flex: 1,
    gap: 1,
  },
  selectedName: {
    ...type.bodyStrong,
    fontSize: 13,
  },
  selectedMeta: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
  },
  listSection: {
    gap: 9,
  },
  count: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.muted,
  },
  listCard: {
    overflow: 'hidden',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  patientRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  patientRowSelected: {
    backgroundColor: colors.tealTint,
  },
  patientCopy: {
    flex: 1,
    gap: 1,
  },
  patientName: {
    ...type.bodyStrong,
    fontSize: 12.5,
  },
  patientMeta: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  activeTag: {
    marginTop: 3,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  registerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 11,
  },
  registerCopy: {
    fontSize: 10,
    color: colors.muted,
  },
  registerLink: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.tealDeep,
  },
  compactPatient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  compactName: {
    ...type.bodyStrong,
    fontSize: 12,
  },
  compactMeta: {
    fontSize: 9,
    color: colors.muted,
  },
  changeLink: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.tealDeep,
  },
  clinicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clinicCard: {
    flexGrow: 1,
    flexBasis: '47%',
    padding: 11,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 2,
  },
  clinicCardSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.tealTint,
  },
  clinicTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  clinicIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicPrefix: {
    backgroundColor: colors.canvasDeep,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  clinicPrefixText: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: colors.muted,
  },
  clinicName: {
    ...type.bodyStrong,
    fontSize: 12,
  },
  clinicDescription: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
    minHeight: 24,
  },
  clinicFee: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '700',
    color: colors.tealDeep,
    marginTop: 2,
  },
  selectedCheck: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 17,
    height: 17,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal,
  },
  priorityCard: {
    gap: 12,
  },
  priorityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  priorityIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.coralSoft,
  },
  priorityCopy: {
    flex: 1,
    gap: 1,
  },
  priorityTitle: {
    ...type.bodyStrong,
    fontSize: 12,
  },
  priorityText: {
    fontSize: 9,
    lineHeight: 13,
    color: colors.muted,
  },
  reasonWrap: {
    gap: 6,
  },
  reasonLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  estimateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  estimateIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  estimateCopy: {
    flex: 1,
    gap: 1,
  },
  estimateLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  estimateValue: {
    ...type.bodyStrong,
    fontSize: 12.5,
  },
  priorityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
  },
  priorityNoteText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    color: colors.amber,
    fontWeight: '500',
  },
  summaryCard: {
    gap: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
    flexShrink: 0,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.md,
    padding: 11,
  },
  warningText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 15,
    color: colors.amber,
    fontWeight: '500',
  },
  previewNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
  },
  previewNoteText: {
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
