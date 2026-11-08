import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDateTime, isToday } from '@/core/format';
import { hasAccess } from '@/core/navigation';
import { colors, type } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { AppPage } from '@/components/layout/app-page';
import { PageHeading } from '@/components/layout/page-heading';
import { SectionHeading } from '@/components/layout/section-heading';
import { ActionButton } from '@/components/ui/action-button';
import { Avatar } from '@/components/ui/avatar';
import { ChoicePills } from '@/components/ui/choice-pills';
import { EmptyNote } from '@/components/ui/empty-note';
import { MetricTile } from '@/components/ui/metric-tile';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { TicketCard } from '@/components/ui/ticket-card';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import {
  clinicInfo,
  nextWaitingTicket,
  sortTickets,
  ticketStatusInfo,
} from '@/features/clinic/selectors';
import type { Ticket } from '@/features/clinic/types';

type Filter = 'active' | 'done';

export default function PemeriksaanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { tickets, patients, records, staff } = useClinic();
  const [filter, setFilter] = useState<Filter>('active');

  if (!user) return null;
  if (!hasAccess(user.role, '/periksa')) {
    return <AccessDenied required="dokter, perawat, atau administrator" />;
  }

  const scopedTickets =
    user.role === 'doctor' && user.clinic
      ? tickets.filter((ticket) => ticket.clinic === user.clinic)
      : tickets;
  const activeTickets = sortTickets(
    scopedTickets.filter(
      (ticket) =>
        isToday(ticket.createdAt) &&
        (ticket.status === 'waiting' || ticket.status === 'called'),
    ),
  );
  const calledTicket = activeTickets.find((ticket) => ticket.status === 'called');
  const nextTicket = nextWaitingTicket(activeTickets);
  const focusTicket = calledTicket ?? nextTicket;
  const otherActive = activeTickets.filter(
    (ticket) => ticket.id !== focusTicket?.id,
  );
  const doneToday = records
    .filter(
      (record) =>
        isToday(record.createdAt) &&
        (user.role !== 'doctor' || record.doctorId === user.id),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pendingPrescriptions = records.filter(
    (record) =>
      !record.handedOver &&
      record.prescription.length > 0 &&
      (user.role !== 'doctor' || record.doctorId === user.id),
  ).length;

  const openExam = (ticket: Ticket) => {
    router.push(`/periksa/${ticket.id}` as Href);
  };

  const spotlightPatient = focusTicket
    ? patients.find((patient) => patient.id === focusTicket.patientId)
    : undefined;

  return (
    <AppPage dock>
      <View style={styles.container}>
        <PageHeading
          eyebrow="Rekam medis elektronik"
          title="Pemeriksaan"
          description="Mulai dari antrean aktif, lanjutkan pengisian EMR, lalu simpan resep digital."
          right={<Tag label={`${activeTickets.length} aktif`} tone="teal" dot />}
        />

        <View style={styles.metrics}>
          <MetricTile
            label="Aktif"
            value={String(activeTickets.length)}
            hint="antrean menunggu"
            tone={activeTickets.length > 0 ? 'teal' : 'paper'}
          />
          <MetricTile
            label="Selesai"
            value={String(doneToday.length)}
            hint="EMR hari ini"
          />
          <MetricTile
            label="Resep"
            value={String(pendingPrescriptions)}
            hint="belum diserahkan"
            tone={pendingPrescriptions > 0 ? 'violet' : 'paper'}
          />
        </View>

        <ChoicePills
          options={[
            {
              value: 'active',
              label: 'Antrean aktif',
              count: activeTickets.length,
            },
            { value: 'done', label: 'Selesai hari ini', count: doneToday.length },
          ]}
          value={filter}
          onChange={setFilter}
        />

        {filter === 'active' ? (
          <>
            {focusTicket ? (
              <View style={styles.focusSection}>
                <SectionHeading
                  label={focusTicket.status === 'called' ? 'Fokus sekarang' : 'Berikutnya'}
                  right={
                    <Tag
                      label={ticketStatusInfo[focusTicket.status].label}
                      tone={ticketStatusInfo[focusTicket.status].tone}
                      dot
                    />
                  }
                />
                <TicketCard
                  code={focusTicket.code}
                  clinicLabel={clinicInfo[focusTicket.clinic].label}
                  patientName={spotlightPatient?.name}
                  meta={
                    focusTicket.status === 'called'
                      ? `${clinicInfo[focusTicket.clinic].room} · siap diperiksa`
                      : `Menunggu · ${clinicInfo[focusTicket.clinic].room}`
                  }
                  statusLabel={focusTicket.status === 'called' ? 'Dipanggil' : 'Menunggu'}
                  statusTone={focusTicket.status === 'called' ? 'teal' : 'amber'}
                  priority={focusTicket.priority}
                  onPress={() => openExam(focusTicket)}
                />
                <ActionButton
                  label={
                    focusTicket.status === 'called'
                      ? 'Buka EMR pasien'
                      : 'Mulai pemeriksaan'
                  }
                  tone="teal"
                  icon="document-text-outline"
                  onPress={() => openExam(focusTicket)}
                  fullWidth
                />
              </View>
            ) : (
              <EmptyNote
                icon="checkmark-done-outline"
                title="Tidak ada pasien aktif"
                description={
                  user.role === 'doctor' && user.clinic
                    ? `Belum ada antrean aktif di ${clinicInfo[user.clinic].label}.`
                    : 'Semua antrean pada cakupan Anda sudah selesai.'
                }
              />
            )}

            <View style={styles.listSection}>
              <SectionHeading
                label="Daftar tunggu"
                right={
                  <Text style={styles.countLabel}>{otherActive.length} pasien</Text>
                }
              />
              {otherActive.length === 0 ? (
                <Text style={styles.emptyText}>
                  Tidak ada pasien lain di daftar tunggu.
                </Text>
              ) : (
                <Surface padding={0} style={styles.listCard}>
                  {otherActive.map((ticket, index) => {
                    const patient = patients.find(
                      (entry) => entry.id === ticket.patientId,
                    );
                    const status = ticketStatusInfo[ticket.status];
                    return (
                      <Pressable
                        key={ticket.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Buka pemeriksaan ${ticket.code}`}
                        onPress={() => openExam(ticket)}
                        style={({ pressed }) => [
                          styles.queueRow,
                          index !== otherActive.length - 1 && styles.queueBorder,
                          pressed && { backgroundColor: colors.canvasDeep },
                        ]}
                      >
                        <Avatar name={patient?.name ?? 'Pasien'} size={38} />
                        <View style={styles.queueCopy}>
                          <Text style={styles.queueName} numberOfLines={1}>
                            {patient?.name ?? 'Pasien'}
                          </Text>
                          <Text style={styles.queueMeta} numberOfLines={1}>
                            {ticket.code} · {clinicInfo[ticket.clinic].label} ·{' '}
                            {formatDateTime(ticket.createdAt)}
                          </Text>
                          {ticket.priority ? (
                            <Tag
                              label={ticket.priorityNote ?? 'Prioritas'}
                              tone="coral"
                              icon="flash"
                              style={styles.priorityTag}
                            />
                          ) : null}
                        </View>
                        <View style={styles.queueRight}>
                          <Tag label={status.label} tone={status.tone} dot />
                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color={colors.mutedSoft}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </Surface>
              )}
            </View>
          </>
        ) : (
          <View style={styles.listSection}>
            <SectionHeading
              label="EMR selesai"
              right={<Text style={styles.countLabel}>{doneToday.length} catatan</Text>}
            />
            {doneToday.length === 0 ? (
              <EmptyNote
                icon="document-text-outline"
                title="Belum ada EMR selesai"
                description="Simpan pemeriksaan pertama hari ini untuk melihat riwayatnya di sini."
              />
            ) : (
              <Surface padding={0} style={styles.listCard}>
                {doneToday.map((record, index) => {
                  const patient = patients.find(
                    (entry) => entry.id === record.patientId,
                  );
                  const ticket = tickets.find(
                    (entry) => entry.id === record.ticketId,
                  );
                  const doctor = staff.find(
                    (entry) => entry.id === record.doctorId,
                  );
                  return (
                    <Pressable
                      key={record.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Buka EMR ${patient?.name ?? ''}`}
                      onPress={() =>
                        router.push(`/periksa/${record.ticketId}` as Href)
                      }
                      style={({ pressed }) => [
                        styles.doneRow,
                        index !== doneToday.length - 1 && styles.queueBorder,
                        pressed && { backgroundColor: colors.canvasDeep },
                      ]}
                    >
                      <View style={styles.doneIcon}>
                        <Ionicons
                          name="document-text-outline"
                          size={16}
                          color={colors.tealDeep}
                        />
                      </View>
                      <View style={styles.queueCopy}>
                        <Text style={styles.queueName}>
                          {patient?.name ?? 'Pasien'}
                        </Text>
                        <Text style={styles.queueMeta} numberOfLines={1}>
                          {record.diagnosis || 'Pemeriksaan'} ·{' '}
                          {ticket ? clinicInfo[ticket.clinic].label : 'Poli'}
                        </Text>
                        <Text style={styles.queueSub} numberOfLines={1}>
                          {doctor?.name ?? 'Dokter'} ·{' '}
                          {formatDateTime(record.createdAt)}
                        </Text>
                      </View>
                      <View style={styles.doneRight}>
                        <Tag
                          label={record.handedOver ? 'Obat diserahkan' : 'Resep aktif'}
                          tone={record.handedOver ? 'green' : 'amber'}
                        />
                        <Ionicons
                          name="chevron-forward"
                          size={13}
                          color={colors.mutedSoft}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </Surface>
            )}
          </View>
        )}
      </View>
    </AppPage>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingTop: 4,
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
  },
  focusSection: {
    gap: 10,
  },
  listSection: {
    gap: 9,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.muted,
  },
  listCard: {
    overflow: 'hidden',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  queueBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  queueCopy: {
    flex: 1,
    gap: 1,
  },
  queueName: {
    ...type.bodyStrong,
    fontSize: 12,
  },
  queueMeta: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  queueSub: {
    fontSize: 8,
    lineHeight: 12,
    color: colors.mutedSoft,
  },
  queueRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priorityTag: {
    marginTop: 3,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  doneIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  doneRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  emptyText: {
    ...type.small,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
});
