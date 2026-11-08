import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Share, StyleSheet, Text, View } from 'react-native';

import {
  addDays,
  formatCompactRupiah,
  formatDate,
  formatLongDate,
  formatRupiah,
} from '@/core/format';
import { hasAccess } from '@/core/navigation';
import { colors, radius } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { AppPage } from '@/components/layout/app-page';
import { PageHeading } from '@/components/layout/page-heading';
import { SectionHeading } from '@/components/layout/section-heading';
import { ActionButton } from '@/components/ui/action-button';
import { BarRow } from '@/components/ui/bar-row';
import { ChoicePills } from '@/components/ui/choice-pills';
import { EmptyNote } from '@/components/ui/empty-note';
import { IconButton } from '@/components/ui/icon-button';
import { MetricTile } from '@/components/ui/metric-tile';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import {
  clinicInfo,
  clinicOrder,
  invoiceTotal,
  isStockLow,
} from '@/features/clinic/selectors';
import type { PaymentMethod } from '@/features/clinic/types';

type ReportPeriod = 'today' | 'week' | 'month';

const methodColor: Record<PaymentMethod, string> = {
  Tunai: colors.teal,
  BPJS: colors.blue,
  Transfer: colors.violet,
};

export default function ReportsScreen() {
  const { user } = useAuth();
  const { tickets, records, invoices, stockItems } = useClinic();
  const [period, setPeriod] = useState<ReportPeriod>('today');

  if (!user) return null;
  if (!hasAccess(user.role, '/laporan')) {
    return <AccessDenied required="administrator" />;
  }

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const start =
    period === 'today'
      ? startOfToday
      : addDays(startOfToday, period === 'week' ? -6 : -29);
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  const startTime = start.getTime();
  const endTime = end.getTime();
  const inRange = (input?: string) => {
    if (!input) return false;
    const time = new Date(input).getTime();
    return time >= startTime && time <= endTime;
  };

  const ticketsInRange = tickets.filter((ticket) =>
    inRange(ticket.createdAt),
  );
  const recordsInRange = records.filter((record) => inRange(record.createdAt));
  const paidInRange = invoices.filter(
    (invoice) =>
      invoice.status === 'paid' && inRange(invoice.paidAt ?? invoice.createdAt),
  );
  const revenue = paidInRange.reduce(
    (total, invoice) => total + invoiceTotal(invoice),
    0,
  );
  const uniquePatients = new Set(
    ticketsInRange.map((ticket) => ticket.patientId),
  ).size;
  const handedPrescriptions = recordsInRange.filter(
    (record) => record.handedOver,
  ).length;
  const lowStock = stockItems.filter(isStockLow).length;

  const clinicStats = clinicOrder.map((code) => {
    const count = ticketsInRange.filter(
      (ticket) => ticket.clinic === code,
    ).length;
    return {
      code,
      label: clinicInfo[code].label,
      description: clinicInfo[code].description,
      color: clinicInfo[code].color,
      count,
    };
  });
  const maxClinic = Math.max(1, ...clinicStats.map((stat) => stat.count));

  const diagnosisCounts = new Map<string, number>();
  for (const record of recordsInRange) {
    const key = record.diagnosis.trim() || 'Belum terdiagnosis';
    diagnosisCounts.set(key, (diagnosisCounts.get(key) ?? 0) + 1);
  }
  const diagnosisStats = [...diagnosisCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxDiagnosis = Math.max(1, ...diagnosisStats.map(([, count]) => count));

  const methodStats: {
    method: PaymentMethod;
    count: number;
    total: number;
  }[] = (['Tunai', 'BPJS', 'Transfer'] as PaymentMethod[]).map((method) => {
    const matching = paidInRange.filter(
      (invoice) => invoice.method === method,
    );
    return {
      method,
      count: matching.length,
      total: matching.reduce(
        (sum, invoice) => sum + invoiceTotal(invoice),
        0,
      ),
    };
  });
  const maxMethodCount = Math.max(1, ...methodStats.map((stat) => stat.count));

  const medicineCounts = new Map<string, number>();
  for (const record of recordsInRange) {
    for (const line of record.prescription) {
      medicineCounts.set(
        line.itemId,
        (medicineCounts.get(line.itemId) ?? 0) + line.quantity,
      );
    }
  }
  const medicineStats = [...medicineCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([itemId, quantity]) => {
      const item = stockItems.find((entry) => entry.id === itemId);
      return {
        itemId,
        name: item?.name ?? 'Obat tidak dikenal',
        unit: item?.unit ?? 'unit',
        group: item?.group ?? '—',
        quantity,
      };
    });
  const maxMedicine = Math.max(
    1,
    ...medicineStats.map((stat) => stat.quantity),
  );

  const topClinic = [...clinicStats].sort((a, b) => b.count - a.count)[0];
  const topDiagnosis = diagnosisStats[0]?.[0];
  const periodLabel =
    period === 'today'
      ? formatLongDate(now)
      : `${formatDate(start)} – ${formatDate(now)}`;
  const periodShort =
    period === 'today' ? 'Hari ini' : period === 'week' ? '7 hari' : '30 hari';

  const shareReport = async () => {
    const lines = [
      'LAPORAN LAYANAN PUSKESMAS',
      `Periode: ${periodLabel}`,
      `Dibuat: ${formatLongDate(now)}`,
      '',
      'RINGKASAN',
      `Kunjungan: ${ticketsInRange.length}`,
      `Pasien unik: ${uniquePatients}`,
      `EMR selesai: ${recordsInRange.length}`,
      `Resep diserahkan: ${handedPrescriptions}`,
      `Pendapatan lunas: ${formatRupiah(revenue)} dari ${paidInRange.length} transaksi`,
      '',
      'KUNJUNGAN PER POLI',
      ...clinicStats.map((stat) => `- ${stat.label}: ${stat.count} kunjungan`),
      '',
      diagnosisStats.length > 0
        ? 'DIAGNOSIS TERBANYAK'
        : 'DIAGNOSIS TERBANYAK: belum ada data',
      ...diagnosisStats.map(
        ([diagnosis, count]) => `- ${diagnosis}: ${count} kasus`,
      ),
      '',
      methodStats.some((stat) => stat.count > 0)
        ? 'PEMBAYARAN'
        : 'PEMBAYARAN: belum ada transaksi lunas',
      ...methodStats
        .filter((stat) => stat.count > 0)
        .map(
          (stat) =>
            `- ${stat.method}: ${stat.count} transaksi · ${formatRupiah(stat.total)}`,
        ),
      '',
      medicineStats.length > 0
        ? 'OBAT PALING DIRESEPKAN'
        : 'OBAT PALING DIRESEPKAN: belum ada resep',
      ...medicineStats.map(
        (stat) => `- ${stat.name}: ${stat.quantity} ${stat.unit}`,
      ),
      '',
      `Catatan: ${lowStock} item obat berada pada atau di bawah stok minimum.`,
      '',
      'Laporan demo dari aplikasi Puskesmas.',
    ];
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // Dialog berbagi dapat ditutup tanpa aksi lanjutan.
    }
  };

  return (
    <AppPage
      dock
      headerRight={
        <IconButton
          icon="share-social-outline"
          label="Bagikan laporan"
          variant="quiet"
          size={38}
          onPress={shareReport}
        />
      }
    >
      <View style={styles.container}>
        <PageHeading
          eyebrow="Manajemen"
          title="Laporan"
          description="Ringkasan kunjungan, diagnosis, pembayaran, dan penggunaan obat pada periode terpilih."
          right={<Tag label={periodShort} tone="teal" dot />}
        />

        <ChoicePills
          options={[
            { value: 'today', label: 'Hari ini', icon: 'today-outline' },
            { value: 'week', label: '7 hari', icon: 'calendar-outline' },
            { value: 'month', label: '30 hari', icon: 'calendar-number-outline' },
          ]}
          value={period}
          onChange={setPeriod}
        />

        <View style={styles.periodNote}>
          <Ionicons
            name="time-outline"
            size={13}
            color={colors.mutedSoft}
          />
          <Text style={styles.periodText}>{periodLabel}</Text>
        </View>

        <View style={styles.metricGrid}>
          <View style={styles.metricRow}>
            <MetricTile
              label="Kunjungan"
              value={String(ticketsInRange.length)}
              hint={`${uniquePatients} pasien unik`}
              tone="teal"
            />
            <MetricTile
              label="EMR selesai"
              value={String(recordsInRange.length)}
              hint={`${handedPrescriptions} resep diserahkan`}
            />
          </View>
          <View style={styles.metricRow}>
            <MetricTile
              label="Pendapatan"
              value={formatCompactRupiah(revenue)}
              hint={`${paidInRange.length} transaksi lunas`}
              tone="amber"
            />
            <MetricTile
              label="Stok kritis"
              value={String(lowStock)}
              hint="item perlu restock"
              tone={lowStock > 0 ? 'rose' : 'paper'}
            />
          </View>
        </View>

        <Surface variant="dark" padding={15} style={styles.revenueCard}>
          <View style={styles.revenueTop}>
            <View style={styles.revenueCopy}>
              <Text style={styles.revenueLabel}>Pendapatan lunas</Text>
              <Text style={styles.revenueValue}>{formatRupiah(revenue)}</Text>
            </View>
            <Tag label={`${periodShort}`} tone="green" dot />
          </View>
          <View style={styles.revenueStats}>
            <DarkStat
              label="Transaksi"
              value={String(paidInRange.length)}
            />
            <View style={styles.darkDivider} />
            <DarkStat
              label="Rata-rata"
              value={
                paidInRange.length > 0
                  ? formatCompactRupiah(revenue / paidInRange.length)
                  : '—'
              }
            />
            <View style={styles.darkDivider} />
            <DarkStat
              label="Klaim BPJS"
              value={String(
                paidInRange.filter((invoice) => invoice.method === 'BPJS')
                  .length,
              )}
            />
          </View>
        </Surface>

        <View style={styles.insight}>
          <View style={styles.insightIcon}>
            <Ionicons
              name="sparkles-outline"
              size={17}
              color={colors.tealDeep}
            />
          </View>
          <Text style={styles.insightText}>
            {ticketsInRange.length > 0 && topClinic
              ? `${topClinic.label} paling ramai dengan ${topClinic.count} kunjungan. `
              : 'Belum ada kunjungan pada periode ini. '}
            {topDiagnosis
              ? `Diagnosis terbanyak: ${topDiagnosis}. `
              : 'Belum ada diagnosis tercatat. '}
            {lowStock > 0
              ? `${lowStock} item obat berada pada atau di bawah stok minimum.`
              : 'Seluruh stok obat berada di atas ambang minimum.'}
          </Text>
        </View>

        <View style={styles.section}>
          <SectionHeading
            label="Kunjungan per poli"
            right={
              <Text style={styles.countLabel}>
                {ticketsInRange.length} kunjungan
              </Text>
            }
          />
          <Surface padding={14} style={styles.barCard}>
            {clinicStats.map((stat) => (
              <BarRow
                key={stat.code}
                label={stat.label}
                value={stat.count}
                max={maxClinic}
                color={stat.color}
                suffix="kunjungan"
                caption={stat.description}
              />
            ))}
          </Surface>
        </View>

        <View style={styles.section}>
          <SectionHeading
            label="Diagnosis terbanyak"
            right={
              <Text style={styles.countLabel}>
                {recordsInRange.length} EMR
              </Text>
            }
          />
          {diagnosisStats.length === 0 ? (
            <EmptyNote
              icon="medkit-outline"
              title="Belum ada diagnosis"
              description="Simpan pemeriksaan untuk mulai mengisi statistik diagnosis."
            />
          ) : (
            <Surface padding={14} style={styles.barCard}>
              {diagnosisStats.map(([diagnosis, count]) => (
                <BarRow
                  key={diagnosis}
                  label={diagnosis}
                  value={count}
                  max={maxDiagnosis}
                  color={colors.rose}
                  suffix="kasus"
                  caption={
                    recordsInRange.length > 0
                      ? `${Math.round((count / recordsInRange.length) * 100)}% dari EMR periode ini`
                      : undefined
                  }
                />
              ))}
            </Surface>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeading
            label="Metode pembayaran"
            right={
              <Text style={styles.countLabel}>
                {paidInRange.length} lunas
              </Text>
            }
          />
          {paidInRange.length === 0 ? (
            <EmptyNote
              icon="wallet-outline"
              title="Belum ada pembayaran"
              description="Transaksi lunas pada periode ini akan terangkum di sini."
            />
          ) : (
            <Surface padding={14} style={styles.barCard}>
              {methodStats.map((stat) => (
                <BarRow
                  key={stat.method}
                  label={stat.method}
                  value={stat.count}
                  max={maxMethodCount}
                  color={methodColor[stat.method]}
                  suffix="transaksi"
                  caption={formatRupiah(stat.total)}
                />
              ))}
            </Surface>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeading
            label="Obat paling diresepkan"
            right={
              <Text style={styles.countLabel}>
                {recordsInRange.length} resep
              </Text>
            }
          />
          {medicineStats.length === 0 ? (
            <EmptyNote
              icon="flask-outline"
              title="Belum ada resep"
              description="Obat yang diresepkan pada periode ini akan diperingkatkan di sini."
            />
          ) : (
            <Surface padding={14} style={styles.barCard}>
              {medicineStats.map((stat) => (
                <BarRow
                  key={stat.itemId}
                  label={stat.name}
                  value={stat.quantity}
                  max={maxMedicine}
                  color={colors.violet}
                  suffix={stat.unit}
                  caption={stat.group}
                />
              ))}
            </Surface>
          )}
        </View>

        <ActionButton
          label="Bagikan laporan periode ini"
          icon="share-social-outline"
          tone="ink"
          onPress={shareReport}
          fullWidth
        />

        <Text style={styles.footer}>
          Laporan dihitung dari data demo pada perangkat ini. Gunakan dialog
          bagikan untuk mengekspor ringkasan ke aplikasi lain.
        </Text>
      </View>
    </AppPage>
  );
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.darkStat}>
      <Text style={styles.darkStatLabel}>{label}</Text>
      <Text style={styles.darkStatValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingTop: 4,
  },
  periodNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -8,
  },
  periodText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  metricGrid: {
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  revenueCard: {
    gap: 13,
  },
  revenueTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  revenueCopy: {
    gap: 2,
  },
  revenueLabel: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.55)',
  },
  revenueValue: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '800',
    letterSpacing: -0.9,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  revenueStats: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.13)',
    paddingTop: 11,
  },
  darkStat: {
    flex: 1,
    gap: 2,
  },
  darkStatLabel: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  darkStatValue: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  darkDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.13)',
    marginHorizontal: 10,
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: colors.paperWarm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: 12,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  insightText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 15,
    color: colors.inkMuted,
    paddingTop: 1,
  },
  section: {
    gap: 9,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.muted,
  },
  barCard: {
    gap: 13,
  },
  footer: {
    textAlign: 'center',
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.mutedSoft,
    paddingTop: 2,
  },
});
