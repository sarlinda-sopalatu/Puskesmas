import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatLongDate, formatTime, isToday, waitLabel } from '@/core/format';
import { hasAccess } from '@/core/navigation';
import { colors, radius, type } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { AppPage } from '@/components/layout/app-page';
import { PageHeading } from '@/components/layout/page-heading';
import { SectionHeading } from '@/components/layout/section-heading';
import { ActionButton } from '@/components/ui/action-button';
import { ChoicePills } from '@/components/ui/choice-pills';
import { EmptyNote } from '@/components/ui/empty-note';
import { IconButton } from '@/components/ui/icon-button';
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
import type { Ticket, TicketStatus } from '@/features/clinic/types';

type Filter = 'all' | 'waiting' | 'called' | 'done';

const statusDot: Record<TicketStatus, string> = {
  waiting: colors.amber,
  called: colors.teal,
  done: colors.green,
  cancelled: colors.mutedSoft,
};

export default function AntreanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { tickets, patients, records, actions } = useClinic();
  const [filter, setFilter] = useState<Filter>('all');

  if (!user) return null;
  if (!hasAccess(user.role, '/antrean')) {
    return <AccessDenied required="petugas pendaftaran, dokter, atau perawat" />;
  }

  const todayTickets = tickets.filter((ticket) => isToday(ticket.createdAt));
  const scopedTickets =
    user.role === 'doctor' && user.clinic
      ? todayTickets.filter((ticket) => ticket.clinic === user.clinic)
      : todayTickets;
  const sorted = sortTickets(scopedTickets);
  const calledTicket = sorted.find((ticket) => ticket.status === 'called');
  const nextTicket = nextWaitingTicket(scopedTickets);
  const focusTicket = calledTicket ?? nextTicket;
  const visible =
    filter === 'all'
      ? sorted
      : sorted.filter((ticket) => ticket.status === filter);
  const canCreate = user.role === 'administrator' || user.role === 'registration';
  const canPractice = user.role === 'doctor' || user.role === 'nurse';
  const waitingCount = scopedTickets.filter(
    (ticket) => ticket.status === 'waiting',
  ).length;

  const callNext = () => {
    const called = actions.callNext(
      user.role === 'doctor' && user.clinic ? user.clinic : undefined,
    );
    if (!called) {
      Alert.alert('Tidak ada antrean', 'Semua pasien pada cakupan ini sudah dipanggil.');
      return;
    }
    Alert.alert(
      'Pasien dipanggil',
      `${called.code} · ${patients.find((patient) => patient.id === called.patientId)?.name ?? 'Pasien'} menuju ${clinicInfo[called.clinic].room}.`,
      [{ text: 'Baik' }],
    );
  };

  const finishTicket = (ticket: Ticket) => {
    Alert.alert(
      'Selesaikan antrean?',
      `${ticket.code} akan ditutup. Rekam medis dan tagihan tetap perlu diproses pada alur normal.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Selesaikan',
          onPress: () => actions.setTicketStatus(ticket.id, 'done'),
        },
      ],
    );
  };

  const cancelTicket = (ticket: Ticket) => {
    Alert.alert(
      'Batalkan antrean?',
      `Antrean ${ticket.code} akan ditandai batal dan tidak dihitung dalam panggilan berikutnya.`,
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

  const openDetail = (ticket: Ticket) => {
    router.push(`/antrean/${ticket.id}` as Href);
  };

  const filters = [
    { value: 'all' as const, label: 'Semua', count: scopedTickets.length },
    {
      value: 'waiting' as const,
      label: 'Menunggu',
      count: scopedTickets.filter((ticket) => ticket.status === 'waiting').length,
    },
    {
      value: 'called' as const,
      label: 'Dipanggil',
      count: scopedTickets.filter((ticket) => ticket.status === 'called').length,
    },
    {
      value: 'done' as const,
      label: 'Selesai',
      count: scopedTickets.filter((ticket) => ticket.status === 'done').length,
    },
  ];

  const focusPatient = focusTicket
    ? patients.find((patient) => patient.id === focusTicket.patientId)
    : undefined;
  const focusMeta = focusTicket
    ? `${clinicInfo[focusTicket.clinic].label} · ${
        focusTicket.status === 'waiting'
          ? waitLabel(focusTicket.estimateMinutes)
          : `${focusTicket.priority ? 'Prioritas · ' : ''}${clinicInfo[focusTicket.clinic].room}`
      }`
    : '';

  return (
    <AppPage
      dock
      headerRight={
        canCreate ? (
          <IconButton
            icon="add"
            label="Ambil nomor antrean"
            variant="ink"
            size={38}
            onPress={() => router.push('/antrean/ambil')}
          />
        ) : undefined
      }
    >
      <View style={styles.container}>
        <PageHeading
          eyebrow="Manajemen kunjungan"
          title="Antrean"
          description={`${formatLongDate(new Date())}${
            user.role === 'doctor' && user.clinic
              ? ` · ${clinicInfo[user.clinic].label}`
              : ' · seluruh poli'
          }`}
          right={
            <Tag
              label={`${waitingCount} menunggu`}
              tone={waitingCount > 0 ? 'amber' : 'green'}
              dot
            />
          }
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buka display antrean"
          onPress={() => router.push('/antrean/display')}
          style={({ pressed }) => [styles.displayBanner, pressed && { opacity: 0.75 }]}
        >
          <View style={styles.displayIcon}>
            <Ionicons name="desktop-outline" size={18} color={colors.tealDeep} />
          </View>
          <View style={styles.displayCopy}>
            <Text style={styles.displayTitle}>Display ruang tunggu</Text>
            <Text style={styles.displayText}>
              Tampilkan nomor aktif untuk pasien di layar besar.
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={15} color={colors.tealDeep} />
        </Pressable>

        {focusTicket ? (
          <View style={styles.focusSection}>
            <SectionHeading
              label={focusTicket.status === 'called' ? 'Sedang dilayani' : 'Berikutnya'}
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
              patientName={focusPatient?.name}
              meta={focusMeta}
              statusLabel={focusTicket.status === 'called' ? 'Dipanggil' : 'Berikutnya'}
              statusTone={focusTicket.status === 'called' ? 'teal' : 'amber'}
              priority={focusTicket.priority}
              onPress={() => openDetail(focusTicket)}
            />
            <View style={styles.focusActions}>
              {focusTicket.status === 'called' ? (
                canPractice ? (
                  <ActionButton
                    label="Mulai periksa"
                    tone="teal"
                    icon="medkit-outline"
                    onPress={() =>
                      router.push(`/periksa/${focusTicket.id}` as Href)
                    }
                    style={styles.flexButton}
                  />
                ) : (
                  <ActionButton
                    label="Panggil berikutnya"
                    tone="teal"
                    icon="megaphone-outline"
                    onPress={callNext}
                    style={styles.flexButton}
                  />
                )
              ) : (
                <ActionButton
                  label="Panggil pasien"
                  tone="teal"
                  icon="megaphone-outline"
                  onPress={() => actions.setTicketStatus(focusTicket.id, 'called')}
                  style={styles.flexButton}
                />
              )}
              {focusTicket.status === 'called' ? (
                <ActionButton
                  label="Selesai"
                  tone="outline"
                  icon="checkmark"
                  onPress={() => finishTicket(focusTicket)}
                  style={styles.flexButton}
                />
              ) : null}
            </View>
          </View>
        ) : (
          <EmptyNote
            icon="checkmark-done-outline"
            title="Tidak ada antrean aktif"
            description="Semua pasien pada cakupan ini sudah terlayani."
            action={
              canCreate ? (
                <ActionButton
                  label="Ambil nomor antrean"
                  tone="teal"
                  icon="add"
                  onPress={() => router.push('/antrean/ambil')}
                />
              ) : undefined
            }
          />
        )}

        <View style={styles.listSection}>
          <SectionHeading
            label="Daftar tiket"
            right={<Text style={styles.countLabel}>{visible.length} tiket</Text>}
          />
          <ChoicePills
            options={filters}
            value={filter}
            onChange={setFilter}
            scroll
          />

          {visible.length === 0 ? (
            <EmptyNote
              icon="funnel-outline"
              title="Filter ini masih kosong"
              description="Belum ada tiket dengan status tersebut. Tampilkan semua tiket untuk melihat gambaran lengkap."
              action={
                <ActionButton
                  label="Tampilkan semua"
                  tone="outline"
                  onPress={() => setFilter('all')}
                />
              }
            />
          ) : (
            <View style={styles.timeline}>
              <View style={styles.rail} />
              {visible.map((ticket, index) => {
                const patient = patients.find(
                  (entry) => entry.id === ticket.patientId,
                );
                const record = records.find(
                  (entry) => entry.ticketId === ticket.id,
                );
                const status = ticketStatusInfo[ticket.status];
                const timeLabel =
                  ticket.status === 'waiting'
                    ? `Dibuat ${formatTime(ticket.createdAt)}`
                    : ticket.status === 'called' && ticket.calledAt
                      ? `Dipanggil ${formatTime(ticket.calledAt)}`
                      : ticket.closedAt
                        ? `Ditutup ${formatTime(ticket.closedAt)}`
                        : '';
                return (
                  <View key={ticket.id} style={styles.timelineRow}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: statusDot[ticket.status] },
                      ]}
                    />
                    <View
                      style={[
                        styles.timelineContent,
                        index !== visible.length - 1 && styles.timelineBorder,
                      ]}
                    >
                      <View style={styles.ticketTop}>
                        <View style={styles.codeBadge}>
                          <Text style={styles.codeText}>{ticket.code}</Text>
                        </View>
                        {ticket.priority ? (
                          <Tag label="Prioritas" tone="coral" icon="flash" />
                        ) : null}
                        <View style={styles.spacer} />
                        <Tag label={status.label} tone={status.tone} dot />
                      </View>

                      <Text style={styles.patientName}>
                        {patient?.name ?? 'Pasien'}
                      </Text>
                      <Text style={styles.ticketMeta} numberOfLines={2}>
                        {clinicInfo[ticket.clinic].label}
                        {ticket.priorityNote ? ` · ${ticket.priorityNote}` : ''}
                        {record?.diagnosis ? ` · ${record.diagnosis}` : ''}
                        {timeLabel ? ` · ${timeLabel}` : ''}
                      </Text>

                      <View style={styles.ticketFooter}>
                        <Text style={styles.estimate}>
                          {ticket.status === 'waiting'
                            ? waitLabel(ticket.estimateMinutes)
                            : ticket.status === 'called'
                              ? `Menuju ${clinicInfo[ticket.clinic].room}`
                              : ticket.status === 'done'
                                ? 'Pelayanan selesai'
                                : 'Antrean dibatalkan'}
                        </Text>
                        <View style={styles.rowActions}>
                          {ticket.status === 'waiting' ? (
                            <IconButton
                              icon="megaphone-outline"
                              label={`Panggil ${ticket.code}`}
                              size={30}
                              variant="quiet"
                              color={colors.tealDeep}
                              style={{ backgroundColor: colors.tealSoft }}
                              onPress={() =>
                                actions.setTicketStatus(ticket.id, 'called')
                              }
                            />
                          ) : null}
                          {ticket.status === 'called' ? (
                            canPractice ? (
                              <IconButton
                                icon="medkit-outline"
                                label={`Periksa ${ticket.code}`}
                                size={30}
                                variant="quiet"
                                color={colors.tealDeep}
                                style={{ backgroundColor: colors.tealSoft }}
                                onPress={() =>
                                  router.push(`/periksa/${ticket.id}` as Href)
                                }
                              />
                            ) : (
                              <IconButton
                                icon="checkmark"
                                label={`Selesaikan ${ticket.code}`}
                                size={30}
                                variant="quiet"
                                color={colors.tealDeep}
                                style={{ backgroundColor: colors.tealSoft }}
                                onPress={() => finishTicket(ticket)}
                              />
                            )
                          ) : null}
                          {ticket.status === 'waiting' ||
                          ticket.status === 'called' ? (
                            <IconButton
                              icon="close"
                              label={`Batalkan ${ticket.code}`}
                              size={30}
                              variant="quiet"
                              color={colors.red}
                              style={{ backgroundColor: colors.redSoft }}
                              onPress={() => cancelTicket(ticket)}
                            />
                          ) : null}
                          <IconButton
                            icon="chevron-forward"
                            label={`Detail ${ticket.code}`}
                            size={30}
                            variant="outline"
                            onPress={() => openDetail(ticket)}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Alur status</Text>
          <View style={styles.legendRow}>
            {(['waiting', 'called', 'done', 'cancelled'] as TicketStatus[]).map(
              (status) => (
                <View key={status} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: statusDot[status] }]}
                  />
                  <Text style={styles.legendLabel}>
                    {ticketStatusInfo[status].label}
                  </Text>
                </View>
              ),
            )}
          </View>
        </View>
      </View>
    </AppPage>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    paddingTop: 4,
  },
  displayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.tealTint,
    borderWidth: 1,
    borderColor: colors.tealSoft,
    borderRadius: radius.md,
    padding: 12,
  },
  displayIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  displayCopy: {
    flex: 1,
    gap: 1,
  },
  displayTitle: {
    ...type.bodyStrong,
    fontSize: 12,
  },
  displayText: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
  },
  focusSection: {
    gap: 11,
  },
  focusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  flexButton: {
    flex: 1,
  },
  listSection: {
    gap: 11,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.muted,
  },
  timeline: {
    position: 'relative',
    marginTop: 2,
  },
  rail: {
    position: 'absolute',
    left: 5,
    top: 18,
    bottom: 18,
    width: 1,
    backgroundColor: colors.line,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginTop: 17,
    borderWidth: 2,
    borderColor: colors.canvas,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 13,
    gap: 2,
  },
  timelineBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  codeBadge: {
    backgroundColor: colors.ink,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  codeText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  spacer: {
    flex: 1,
  },
  patientName: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  ticketMeta: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
  },
  ticketFooter: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  estimate: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 12,
    fontWeight: '600',
    color: colors.mutedSoft,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legend: {
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 7,
  },
  legendTitle: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.mutedSoft,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 8.5,
    color: colors.muted,
    fontWeight: '600',
  },
});
