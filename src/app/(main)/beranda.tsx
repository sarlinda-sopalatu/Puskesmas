import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  formatCompactRupiah,
  formatDate,
  formatLongDate,
  formatRupiah,
  formatTime,
  greeting,
  isToday,
} from '@/core/format';
import {
  clinicInfo,
  clinicOrder,
  invoiceTotal,
  isStockExpired,
  isStockLow,
  nextWaitingTicket,
  ticketStatusInfo,
} from '@/features/clinic/selectors';
import {
  quickActionsByRole,
  roleMeta,
} from '@/core/navigation';
import { colors, radius, type } from '@/core/theme';
import { AppPage } from '@/components/layout/app-page';
import { SectionHeading } from '@/components/layout/section-heading';
import { ActionButton } from '@/components/ui/action-button';
import { BarRow } from '@/components/ui/bar-row';
import { MetricTile } from '@/components/ui/metric-tile';
import { Surface } from '@/components/ui/surface';
import { Tag, type TagTone } from '@/components/ui/tag';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';

type Metric = {
  label: string;
  value: string;
  hint: string;
  tone?: 'paper' | 'teal' | 'amber' | 'rose' | 'violet';
};

type ActivityItem = {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  tone: TagTone;
  dot: string;
  onPress: () => void;
};

export default function BerandaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { tickets, patients, records, invoices, stockItems } = useClinic();

  if (!user) return null;

  const meta = roleMeta[user.role];
  const todayTickets = tickets.filter((ticket) => isToday(ticket.createdAt));
  const roleTickets =
    user.role === 'doctor' && user.clinic
      ? todayTickets.filter((ticket) => ticket.clinic === user.clinic)
      : todayTickets;

  const waiting = roleTickets.filter((ticket) => ticket.status === 'waiting').length;
  const called = roleTickets.filter((ticket) => ticket.status === 'called');
  const done = roleTickets.filter((ticket) => ticket.status === 'done');
  const priority = roleTickets.filter(
    (ticket) => ticket.priority && ticket.status !== 'done' && ticket.status !== 'cancelled',
  ).length;
  const uniquePatients = new Set(todayTickets.map((ticket) => ticket.patientId)).size;

  const openInvoices = invoices.filter((invoice) => invoice.status === 'open');
  const paidToday = invoices.filter(
    (invoice) => invoice.status === 'paid' && invoice.paidAt && isToday(invoice.paidAt),
  );
  const openAmount = openInvoices.reduce(
    (total, invoice) => total + invoiceTotal(invoice),
    0,
  );
  const paidAmount = paidToday.reduce(
    (total, invoice) => total + invoiceTotal(invoice),
    0,
  );

  const pendingPrescriptions = records.filter(
    (record) => record.prescription.length > 0 && !record.handedOver,
  );
  const lowStock = stockItems.filter(isStockLow);
  const expiredStock = stockItems.filter(isStockExpired);

  const firstName = user.name.replace(/^(drg?|Ns)\.?\s+/i, '').split(' ')[0];

  const subtitleByRole: Record<typeof user.role, string> = {
    administrator: 'Pantau seluruh alur layanan dalam satu ringkasan.',
    registration: 'Siap melayani pendaftaran dan antrean hari ini.',
    doctor: `Fokus pada pasien di ${user.clinic ? clinicInfo[user.clinic].label : 'poli Anda'}.`,
    nurse: 'Bantu kelancaran alur layanan dan kesiapan pasien.',
    pharmacy: 'Cek resep masuk dan ketersediaan obat hari ini.',
    cashier: 'Pastikan seluruh pembayaran pasien tertangani.',
  };

  const nextTicket = nextWaitingTicket(roleTickets);
  const currentTicket = called[0] ?? nextTicket;

  let heroEyebrow = 'Antrean berjalan';
  let heroValue = currentTicket?.code ?? '—';
  let heroLabel = 'Belum ada antrean aktif';
  let heroNote = 'Antrean baru akan tampil di sini.';
  let heroAction = 'Kelola antrean';
  let heroHref: Href = '/antrean';
  let heroQueueValue = true;

  if (currentTicket) {
    const patientName =
      patients.find((entry) => entry.id === currentTicket.patientId)?.name ?? 'Pasien';
    heroEyebrow =
      currentTicket.status === 'called' ? 'Sedang dipanggil' : 'Antrean berikutnya';
    heroLabel = patientName;
    heroNote = `${clinicInfo[currentTicket.clinic].label} · ${
      currentTicket.status === 'called'
        ? 'menuju ruang pemeriksaan'
        : `estimasi ± ${currentTicket.estimateMinutes} menit`
    }`;
    if ((user.role === 'doctor' || user.role === 'nurse') && currentTicket.status === 'called') {
      heroAction = 'Mulai periksa';
      heroHref = `/periksa/${currentTicket.id}` as Href;
    } else if (user.role === 'registration' || user.role === 'administrator') {
      heroAction = 'Kelola antrean';
      heroHref = '/antrean';
    } else {
      heroAction = 'Lihat antrean';
      heroHref = '/antrean';
    }
  }

  if (user.role === 'pharmacy') {
    heroQueueValue = false;
    heroEyebrow = 'Resep menunggu';
    heroValue = String(pendingPrescriptions.length);
    heroLabel = `${pendingPrescriptions.length} resep siap ditinjau`;
    heroNote =
      pendingPrescriptions.length > 0
        ? `${patients.find((entry) => entry.id === pendingPrescriptions[0].patientId)?.name ?? 'Pasien'} · ${formatTime(pendingPrescriptions[0].createdAt)}`
        : 'Semua resep sudah diserahkan.';
    heroAction = 'Buka resep';
    heroHref = '/farmasi/resep';
  }

  if (user.role === 'cashier') {
    heroQueueValue = false;
    heroEyebrow = 'Tagihan terbuka';
    heroValue = formatCompactRupiah(openAmount);
    heroLabel = `${openInvoices.length} tagihan aktif`;
    heroNote = `${paidToday.length} transaksi lunas · ${formatCompactRupiah(paidAmount)} hari ini`;
    heroAction = 'Buka kasir';
    heroHref = '/kasir';
  }

  let metrics: Metric[] = [
    { label: 'Pasien', value: String(uniquePatients), hint: 'terdaftar hari ini' },
    { label: 'Menunggu', value: String(waiting), hint: 'belum dipanggil' },
    { label: 'Selesai', value: String(done.length), hint: 'pelayanan tuntas' },
  ];

  if (user.role === 'registration') {
    metrics = [
      { label: 'Pasien', value: String(uniquePatients), hint: 'terdaftar hari ini' },
      { label: 'Menunggu', value: String(waiting), hint: 'di seluruh poli' },
      {
        label: 'Prioritas',
        value: String(priority),
        hint: 'perlu didahulukan',
        tone: priority > 0 ? 'amber' : 'paper',
      },
    ];
  }

  if (user.role === 'doctor') {
    metrics = [
      { label: 'Antrean', value: String(waiting + called.length), hint: 'di poli Anda' },
      { label: 'Selesai', value: String(done.length), hint: 'pasien hari ini' },
      {
        label: 'EMR saya',
        value: String(records.filter((record) => record.doctorId === user.id).length),
        hint: 'rekam medis tersimpan',
        tone: 'teal',
      },
    ];
  }

  if (user.role === 'nurse') {
    metrics = [
      { label: 'Menunggu', value: String(waiting), hint: 'di seluruh poli' },
      { label: 'Dipanggil', value: String(called.length), hint: 'sedang menuju ruang' },
      { label: 'Selesai', value: String(done.length), hint: 'pasien hari ini' },
    ];
  }

  if (user.role === 'pharmacy') {
    metrics = [
      {
        label: 'Resep',
        value: String(pendingPrescriptions.length),
        hint: 'menunggu diserahkan',
        tone: pendingPrescriptions.length > 0 ? 'violet' : 'paper',
      },
      {
        label: 'Menipis',
        value: String(lowStock.length),
        hint: 'item perlu restock',
        tone: lowStock.length > 0 ? 'amber' : 'paper',
      },
      {
        label: 'Kedaluwarsa',
        value: String(expiredStock.length),
        hint: 'perlu pemusnahan',
        tone: expiredStock.length > 0 ? 'rose' : 'paper',
      },
    ];
  }

  if (user.role === 'cashier') {
    metrics = [
      {
        label: 'Terbuka',
        value: String(openInvoices.length),
        hint: 'tagihan menunggu',
        tone: openInvoices.length > 0 ? 'amber' : 'paper',
      },
      {
        label: 'Lunas',
        value: String(paidToday.length),
        hint: 'transaksi hari ini',
        tone: 'teal',
      },
      {
        label: 'Pendapatan',
        value: formatCompactRupiah(paidAmount),
        hint: 'terbayar hari ini',
      },
    ];
  }

  const clinicCounts = clinicOrder.map((code) => ({
    code,
    count: todayTickets.filter((ticket) => ticket.clinic === code).length,
  }));
  const maxClinicCount = Math.max(1, ...clinicCounts.map((entry) => entry.count));

  const linkTarget: Href =
    user.role === 'pharmacy'
      ? '/farmasi/resep'
      : user.role === 'cashier'
        ? '/kasir/riwayat'
        : '/antrean';
  const linkLabel =
    user.role === 'pharmacy'
      ? 'Semua resep'
      : user.role === 'cashier'
        ? 'Riwayat bayar'
        : 'Semua antrean';

  const activityItems: ActivityItem[] =
    user.role === 'pharmacy'
      ? records
          .filter((record) => record.prescription.length > 0)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 4)
          .map((record) => {
            const patient = patients.find((entry) => entry.id === record.patientId);
            const ticket = tickets.find((entry) => entry.id === record.ticketId);
            return {
              id: record.id,
              name: patient?.name ?? 'Pasien',
              subtitle: `${ticket ? clinicInfo[ticket.clinic].label : 'Poli'} · ${formatTime(record.createdAt)}`,
              tag: record.handedOver ? 'Diserahkan' : 'Menunggu',
              tone: record.handedOver ? 'green' : 'amber',
              dot: record.handedOver ? colors.teal : colors.coral,
              onPress: () => router.push('/farmasi/resep'),
            };
          })
      : user.role === 'cashier'
        ? invoices
            .slice()
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 4)
            .map((invoice) => {
              const patient = patients.find((entry) => entry.id === invoice.patientId);
              return {
                id: invoice.id,
                name: patient?.name ?? 'Pasien',
                subtitle: `${invoice.number} · ${formatRupiah(invoiceTotal(invoice))}`,
                tag: invoice.status === 'open' ? 'Belum bayar' : 'Lunas',
                tone: invoice.status === 'open' ? 'amber' : 'green',
                dot: invoice.status === 'open' ? colors.coral : colors.teal,
                onPress: () =>
                  router.push(invoice.status === 'open' ? '/kasir' : '/kasir/riwayat'),
              };
            })
        : roleTickets
            .slice()
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 4)
            .map((ticket) => {
              const patient = patients.find((entry) => entry.id === ticket.patientId);
              return {
                id: ticket.id,
                name: patient?.name ?? 'Pasien',
                subtitle: `${ticket.code} · ${clinicInfo[ticket.clinic].label} · ${formatTime(ticket.createdAt)}`,
                tag: ticketStatusInfo[ticket.status].label,
                tone: ticketStatusInfo[ticket.status].tone,
                dot: clinicInfo[ticket.clinic].color,
                onPress: () => router.push(`/antrean/${ticket.id}` as Href),
              };
            });

  const actions = quickActionsByRole[user.role];

  return (
    <AppPage dock>
      <View style={styles.sections}>
        <View>
          <Text style={styles.date}>{formatLongDate(new Date())}</Text>
          <Text style={styles.greeting}>
            {greeting()}, {firstName}.
          </Text>
          <Text style={styles.roleSubtitle}>{subtitleByRole[user.role]}</Text>
        </View>

        <View style={styles.roleRow}>
          <View style={[styles.roleChip, { backgroundColor: meta.tint }]}>
            <Ionicons name={meta.icon} size={13} color={meta.color} />
            <Text style={[styles.roleChipText, { color: meta.color }]}>
              {meta.label}
            </Text>
          </View>
          {user.clinic ? (
            <View style={styles.clinicChip}>
              <Ionicons name="location-outline" size={11} color={colors.muted} />
              <Text style={styles.clinicChipText}>{clinicInfo[user.clinic].label}</Text>
            </View>
          ) : null}
        </View>

        <LinearGradient
          colors={[colors.ink, '#123B47', '#0E4B4B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroDecorA} />
          <View style={styles.heroDecorB} />
          <Ionicons
            name="medkit"
            size={140}
            color="rgba(255,255,255,0.035)"
            style={styles.heroWatermark}
          />

          <View style={styles.heroTop}>
            <View style={styles.heroEyebrowRow}>
              <View style={styles.liveDot} />
              <Text style={styles.heroEyebrow}>{heroEyebrow}</Text>
            </View>
            <View style={styles.heroDateChip}>
              <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.55)" />
              <Text style={styles.heroDateText}>{formatDate(new Date())}</Text>
            </View>
          </View>

          <Text
            style={[styles.heroValue, !heroQueueValue && styles.heroValueMoney]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {heroValue}
          </Text>
          <Text style={styles.heroLabel}>{heroLabel}</Text>
          <Text style={styles.heroNote}>{heroNote}</Text>

          <View style={styles.heroFooter}>
            <ActionButton
              label={heroAction}
              size="sm"
              tone="quiet"
              icon="arrow-forward"
              iconPosition="right"
              onPress={() => router.push(heroHref)}
            />
            <Text style={styles.heroBrand}>PUSKESMAS</Text>
          </View>
        </LinearGradient>

        <View style={styles.metricRow}>
          {metrics.map((metric) => (
            <MetricTile
              key={metric.label}
              label={metric.label}
              value={metric.value}
              hint={metric.hint}
              tone={metric.tone}
            />
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeading label="Aksi cepat" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}
          >
            {actions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                onPress={() => router.push(action.href)}
                style={({ pressed }) => [
                  styles.quickCard,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <View style={styles.quickTop}>
                  <View style={[styles.quickIcon, { backgroundColor: action.tint }]}>
                    <Ionicons name={action.icon} size={16} color={action.color} />
                  </View>
                  <Ionicons name="arrow-up-outline" size={12} color={colors.mutedSoft} />
                </View>
                <Text style={styles.quickLabel} numberOfLines={2}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeading
            label="Denyut poli"
            right={<Text style={styles.totalLabel}>{todayTickets.length} kunjungan</Text>}
          />
          <Surface elevated style={styles.pulseCard}>
            <View style={styles.pulseTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pulseTitle}>Aktivitas layanan hari ini</Text>
                <Text style={styles.pulseSubtitle}>
                  Sebaran antrean di lima poli puskesmas.
                </Text>
              </View>
              <View style={styles.pulseBadge}>
                <Ionicons name="pulse-outline" size={13} color={colors.tealDeep} />
              </View>
            </View>
            <View style={styles.barList}>
              {clinicCounts.map((entry) => (
                <BarRow
                  key={entry.code}
                  label={clinicInfo[entry.code].label}
                  value={entry.count}
                  max={maxClinicCount}
                  color={clinicInfo[entry.code].color}
                  suffix="antrean"
                />
              ))}
            </View>
          </Surface>
        </View>

        <View style={styles.section}>
          <SectionHeading
            label={user.role === 'pharmacy' ? 'Resep terbaru' : user.role === 'cashier' ? 'Transaksi terbaru' : 'Linimasa antrean'}
            right={
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => router.push(linkTarget)}
                style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.linkText}>{linkLabel}</Text>
                <Ionicons name="chevron-forward" size={11} color={colors.tealDeep} />
              </Pressable>
            }
          />
          {activityItems.length > 0 ? (
            <View style={styles.activityList}>
              {activityItems.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={item.onPress}
                  style={({ pressed }) => [
                    styles.activityRow,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={[styles.activityDot, { backgroundColor: item.dot }]} />
                  <View style={styles.activityCopy}>
                    <Text style={styles.activityName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.activitySubtitle} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Tag label={item.tag} tone={item.tone} />
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Belum ada aktivitas hari ini.</Text>
          )}
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerBrand}>PUSKESMAS</Text>
          <Text style={styles.footerCopy}>
            Layanan terpadu · data demo lokal · sesi aman di perangkat
          </Text>
        </View>
      </View>
    </AppPage>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: 22,
    paddingTop: 4,
  },
  date: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.tealDeep,
  },
  greeting: {
    ...type.display,
    fontSize: 27,
    lineHeight: 32,
    marginTop: 2,
  },
  roleSubtitle: {
    ...type.small,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 2,
    maxWidth: 460,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: -12,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  roleChipText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 0.25,
  },
  clinicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasDeep,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  clinicChipText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  hero: {
    borderRadius: radius.lg + 2,
    padding: 18,
    overflow: 'hidden',
    minHeight: 220,
  },
  heroDecorA: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    right: -70,
    top: -80,
    backgroundColor: 'rgba(15, 118, 110, 0.26)',
  },
  heroDecorB: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    right: 35,
    bottom: -60,
    backgroundColor: 'rgba(249, 115, 22, 0.13)',
  },
  heroWatermark: {
    position: 'absolute',
    right: -24,
    bottom: -22,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.tealSoft,
  },
  heroEyebrow: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.55)',
  },
  heroDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heroDateText: {
    fontSize: 8.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  heroValue: {
    marginTop: 18,
    fontSize: 46,
    lineHeight: 51,
    fontWeight: '800',
    letterSpacing: -1.8,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  heroValueMoney: {
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1.2,
  },
  heroLabel: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: colors.white,
  },
  heroNote: {
    marginTop: 2,
    fontSize: 10.5,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.58)',
    maxWidth: '80%',
  },
  heroFooter: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroBrand: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 1.8,
    color: 'rgba(255,255,255,0.26)',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: -8,
  },
  section: {
    gap: 11,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  quickCard: {
    width: 138,
    minHeight: 92,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 11,
    justifyContent: 'space-between',
    gap: 10,
  },
  quickTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  totalLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  pulseCard: {
    gap: 14,
  },
  pulseTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pulseTitle: {
    ...type.h3,
    fontSize: 14,
    lineHeight: 19,
  },
  pulseSubtitle: {
    ...type.small,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 1,
  },
  pulseBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barList: {
    gap: 10,
  },
  activityList: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  activityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  activityCopy: {
    flex: 1,
    gap: 1,
  },
  activityName: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  activitySubtitle: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: colors.tealDeep,
  },
  emptyText: {
    ...type.small,
    paddingVertical: 14,
    fontStyle: 'italic',
  },
  footerNote: {
    alignItems: 'center',
    paddingTop: 6,
    gap: 3,
  },
  footerBrand: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.mutedSoft,
  },
  footerCopy: {
    fontSize: 8,
    color: colors.mutedSoft,
    textAlign: 'center',
  },
});
