import type { ReactNode } from 'react';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import {
  formatDateTimeLong,
  formatRupiah,
  formatTime,
  maskedNik,
  waitLabel,
} from '@/core/format';
import { hasAccess } from '@/core/navigation';
import { colors, radius } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { AppPage } from '@/components/layout/app-page';
import { SectionHeading } from '@/components/layout/section-heading';
import { ActionButton } from '@/components/ui/action-button';
import { EmptyNote } from '@/components/ui/empty-note';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { TicketCard } from '@/components/ui/ticket-card';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import {
  clinicInfo,
  coverageInfo,
  invoiceTotal,
  ticketStatusInfo,
} from '@/features/clinic/selectors';

export default function TicketDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { tickets, patients, records, invoices, actions } = useClinic();
  const ticketId = Array.isArray(id) ? id[0] : id;

  if (!user) return null;
  if (!hasAccess(user.role, '/antrean')) {
    return <AccessDenied required="petugas pendaftaran, dokter, atau perawat" />;
  }

  const ticket = tickets.find((entry) => entry.id === ticketId);

  if (!ticket) {
    return (
      <AppPage header="back" title="Detail antrean" eyebrow="Antrean">
        <EmptyNote
          icon="help-circle-outline"
          title="Tiket tidak ditemukan"
          description="Tiket mungkin sudah dihapus atau tautannya tidak lagi valid."
          action={
            <ActionButton
              label="Kembali ke antrean"
              tone="outline"
              onPress={() => router.replace('/antrean')}
            />
          }
        />
      </AppPage>
    );
  }

  const patient = patients.find((entry) => entry.id === ticket.patientId);
  const record = records.find((entry) => entry.ticketId === ticket.id);
  const invoice = invoices.find((entry) => entry.recordId === record?.id);
  const status = ticketStatusInfo[ticket.status];
  const canPractice = user.role === 'doctor' || user.role === 'nurse';
  const clinic = clinicInfo[ticket.clinic];

  const finishTicket = () => {
    Alert.alert(
      'Selesaikan antrean?',
      `${ticket.code} akan ditutup. Pastikan pelayanan dan pencatatan sudah selesai.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Selesaikan',
          onPress: () => actions.setTicketStatus(ticket.id, 'done'),
        },
      ],
    );
  };

  const cancelTicket = () => {
    Alert.alert(
      'Batalkan antrean?',
      'Tiket yang dibatalkan tetap tersimpan sebagai riwayat dan tidak dipanggil kembali.',
      [
        { text: 'Kembali', style: 'cancel' },
        {
          text: 'Batalkan',
          style: 'destructive',
          onPress: () => actions.setTicketStatus(ticket.id, 'cancelled'),
        },
      ],
    );
  };

  const journey = [
    {
      label: 'Tiket dibuat',
      time: ticket.createdAt,
      done: true,
      danger: false,
    },
    {
      label: 'Pasien dipanggil',
      time: ticket.calledAt,
      done: Boolean(ticket.calledAt),
      danger: false,
    },
    ticket.status === 'cancelled'
      ? {
          label: 'Antrean dibatalkan',
          time: ticket.closedAt,
          done: Boolean(ticket.closedAt),
          danger: true,
        }
      : {
          label: 'Pelayanan selesai',
          time: ticket.closedAt,
          done: ticket.status === 'done',
          danger: false,
        },
  ];

  return (
    <AppPage
      header="back"
      title={`Tiket ${ticket.code}`}
      eyebrow={clinic.label}
      headerRight={<Tag label={status.label} tone={status.tone} dot />}
    >
      <View style={styles.container}>
        <TicketCard
          code={ticket.code}
          clinicLabel={clinic.label}
          patientName={patient?.name}
          meta={
            ticket.status === 'waiting'
              ? `${waitLabel(ticket.estimateMinutes)} · ${clinic.room}`
              : `${clinic.room} · ${status.description}`
          }
          statusLabel={status.label}
          statusTone={status.tone}
          priority={ticket.priority}
        />

        <View style={styles.actions}>
          {ticket.status === 'waiting' ? (
            <>
              <ActionButton
                label="Panggil pasien"
                tone="teal"
                icon="megaphone-outline"
                onPress={() => actions.setTicketStatus(ticket.id, 'called')}
                style={styles.flex}
              />
              <ActionButton
                label="Batalkan"
                tone="outline"
                onPress={cancelTicket}
                style={styles.flex}
              />
            </>
          ) : null}
          {ticket.status === 'called' ? (
            <>
              {canPractice ? (
                <ActionButton
                  label="Mulai periksa"
                  tone="teal"
                  icon="medkit-outline"
                  onPress={() => router.push(`/periksa/${ticket.id}` as Href)}
                  style={styles.flex}
                />
              ) : (
                <ActionButton
                  label="Tandai selesai"
                  tone="teal"
                  icon="checkmark"
                  onPress={finishTicket}
                  style={styles.flex}
                />
              )}
              <ActionButton
                label="Batalkan"
                tone="outline"
                onPress={cancelTicket}
                style={styles.flex}
              />
            </>
          ) : null}
          {ticket.status === 'done' && record ? (
            <ActionButton
              label="Lihat rekam medis"
              tone="ink"
              icon="document-text-outline"
              onPress={() => router.push(`/periksa/${ticket.id}` as Href)}
              style={styles.flex}
            />
          ) : null}
          {ticket.status === 'done' && !record ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                Antrean ditutup tanpa rekam medis. Dokter perlu melengkapi EMR bila
                pasien sudah diperiksa.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeading
            label="Identitas pasien"
            right={
              <Text
                style={styles.link}
                onPress={() =>
                  patient ? router.push(`/pasien/${patient.id}` as Href) : undefined
                }
              >
                Buka data pasien
              </Text>
            }
          />
          <View style={styles.infoGrid}>
            <InfoCell label="Nama lengkap" value={patient?.name ?? '—'} full />
            <InfoCell label="No. rekam medis" value={patient?.rm ?? '—'} />
            <InfoCell label="NIK" value={patient ? maskedNik(patient.nik) : '—'} />
            <InfoCell label="Telepon" value={patient?.phone ?? '—'} />
            <InfoCell
              label="Jaminan"
              value={
                patient ? (
                  <Tag
                    label={coverageInfo[patient.coverage].label}
                    tone={coverageInfo[patient.coverage].tone}
                  />
                ) : (
                  '—'
                )
              }
            />
            <InfoCell label="Alamat" value={patient?.address ?? '—'} full />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading label="Detail kunjungan" />
          <View style={styles.infoGrid}>
            <InfoCell label="Poli" value={clinic.label} />
            <InfoCell label="Ruang" value={clinic.room} />
            <InfoCell
              label="Estimasi tunggu"
              value={
                ticket.status === 'waiting'
                  ? waitLabel(ticket.estimateMinutes)
                  : 'Sudah dipanggil'
              }
            />
            <InfoCell label="Dibuat" value={formatTime(ticket.createdAt)} />
            <InfoCell
              label="Prioritas"
              value={
                ticket.priority ? (
                  <Tag label="Prioritas" tone="coral" dot />
                ) : (
                  <Text style={styles.cellValue}>Reguler</Text>
                )
              }
            />
            <InfoCell
              label="Tagihan"
              value={
                invoice
                  ? `${formatRupiah(invoiceTotal(invoice))} · ${
                      invoice.status === 'paid' ? 'Lunas' : 'Terbuka'
                    }`
                  : 'Belum dibuat'
              }
            />
            {ticket.priority && ticket.priorityNote ? (
              <InfoCell label="Alasan prioritas" value={ticket.priorityNote} full />
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading label="Perjalanan tiket" />
          <Surface style={styles.journeyCard}>
            {journey.map((event, index) => (
              <View key={event.label} style={styles.journeyRow}>
                <View style={styles.journeyTrack}>
                  <View
                    style={[
                      styles.journeyDot,
                      event.done && styles.journeyDotDone,
                      event.danger && styles.journeyDotDanger,
                    ]}
                  />
                  {index < journey.length - 1 ? (
                    <View
                      style={[
                        styles.journeyLine,
                        event.done && styles.journeyLineDone,
                      ]}
                    />
                  ) : null}
                </View>
                <View style={styles.journeyCopy}>
                  <Text
                    style={[
                      styles.journeyLabel,
                      event.done && styles.journeyLabelDone,
                      event.danger && { color: colors.rose },
                    ]}
                  >
                    {event.label}
                  </Text>
                  <Text style={styles.journeyTime}>
                    {event.time
                      ? formatDateTimeLong(event.time)
                      : 'Menunggu proses berikutnya'}
                  </Text>
                </View>
              </View>
            ))}
          </Surface>
        </View>

        <Text style={styles.footer}>
          Dibuat pada {formatDateTimeLong(ticket.createdAt)} · data demo lokal
        </Text>
      </View>
    </AppPage>
  );
}

function InfoCell({
  label,
  value,
  full = false,
}: {
  label: string;
  value: ReactNode;
  full?: boolean;
}) {
  return (
    <View style={[styles.infoCell, full && styles.infoCellFull]}>
      <Text style={styles.cellLabel}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={styles.cellValue}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  noteBox: {
    flex: 1,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.md,
    padding: 11,
  },
  noteText: {
    fontSize: 10,
    lineHeight: 15,
    color: colors.amber,
    fontWeight: '600',
  },
  section: {
    gap: 10,
  },
  link: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.tealDeep,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  infoCell: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 10,
    gap: 4,
    minHeight: 60,
  },
  infoCellFull: {
    flexBasis: '100%',
  },
  cellLabel: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  cellValue: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  journeyCard: {
    gap: 0,
  },
  journeyRow: {
    flexDirection: 'row',
    gap: 11,
  },
  journeyTrack: {
    alignItems: 'center',
    width: 12,
  },
  journeyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    backgroundColor: colors.paper,
    marginTop: 2,
  },
  journeyDotDone: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  journeyDotDanger: {
    backgroundColor: colors.rose,
    borderColor: colors.rose,
  },
  journeyLine: {
    flex: 1,
    width: 1,
    backgroundColor: colors.line,
    marginVertical: 3,
    minHeight: 26,
  },
  journeyLineDone: {
    backgroundColor: colors.tealSoft,
  },
  journeyCopy: {
    flex: 1,
    paddingBottom: 16,
    gap: 1,
  },
  journeyLabel: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.muted,
  },
  journeyLabelDone: {
    color: colors.ink,
    fontWeight: '700',
  },
  journeyTime: {
    fontSize: 9,
    lineHeight: 13,
    color: colors.mutedSoft,
  },
  footer: {
    textAlign: 'center',
    fontSize: 8.5,
    color: colors.mutedSoft,
    paddingTop: 2,
  },
});
