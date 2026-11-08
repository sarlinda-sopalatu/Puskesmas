import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  dateKey,
  formatCompactRupiah,
  formatDateTime,
  formatLongDate,
  formatRupiah,
  isToday,
} from '@/core/format';
import { hasAccess } from '@/core/navigation';
import { colors } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { AppPage } from '@/components/layout/app-page';
import { PageHeading } from '@/components/layout/page-heading';
import { SectionHeading } from '@/components/layout/section-heading';
import { ChoicePills } from '@/components/ui/choice-pills';
import { EmptyNote } from '@/components/ui/empty-note';
import { IconButton } from '@/components/ui/icon-button';
import { MetricTile } from '@/components/ui/metric-tile';
import { SearchField } from '@/components/ui/search-field';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import { invoiceTotal } from '@/features/clinic/selectors';
import { PaymentReceiptSheet } from '@/features/clinic/payment-receipt-sheet';
import type { Invoice, PaymentMethod } from '@/features/clinic/types';

type HistoryFilter = 'all' | 'today';

const methodTone: Record<PaymentMethod, 'teal' | 'blue' | 'violet'> = {
  Tunai: 'teal',
  BPJS: 'blue',
  Transfer: 'violet',
};

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { invoices, patients } = useClinic();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [query, setQuery] = useState('');
  const [receiptId, setReceiptId] = useState<string | null>(null);

  if (!user) return null;
  if (!hasAccess(user.role, '/kasir/riwayat')) {
    return <AccessDenied required="petugas kasir atau administrator" />;
  }

  const paid = invoices
    .filter((invoice) => invoice.status === 'paid')
    .sort((a, b) =>
      (b.paidAt ?? b.createdAt).localeCompare(a.paidAt ?? a.createdAt),
    );
  const paidToday = paid.filter((invoice) =>
    isToday(invoice.paidAt ?? invoice.createdAt),
  );
  const allTotal = paid.reduce(
    (total, invoice) => total + invoiceTotal(invoice),
    0,
  );
  const todayTotal = paidToday.reduce(
    (total, invoice) => total + invoiceTotal(invoice),
    0,
  );
  const source = filter === 'today' ? paidToday : paid;
  const visible = source.filter((invoice) => {
    const patient = patients.find((entry) => entry.id === invoice.patientId);
    const haystack = `${invoice.number} ${patient?.name ?? ''} ${patient?.rm ?? ''} ${invoice.method ?? ''}`;
    return haystack.toLowerCase().includes(query.trim().toLowerCase());
  });

  const groups = new Map<string, Invoice[]>();
  for (const invoice of visible) {
    const key = dateKey(invoice.paidAt ?? invoice.createdAt);
    const bucket = groups.get(key) ?? [];
    bucket.push(invoice);
    groups.set(key, bucket);
  }
  const groupList = [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => ({
      key,
      label: isToday(key) ? 'Hari ini' : formatLongDate(key),
      total: items.reduce((total, invoice) => total + invoiceTotal(invoice), 0),
      items,
    }));

  const receipt = receiptId
    ? invoices.find((invoice) => invoice.id === receiptId)
    : undefined;
  const receiptPatient = receipt
    ? patients.find((patient) => patient.id === receipt.patientId)
    : undefined;

  return (
    <>
      <AppPage
        dock
        headerRight={
          <IconButton
            icon="wallet-outline"
            label="Kembali ke tagihan aktif"
            variant="quiet"
            size={38}
            onPress={() => router.push('/kasir')}
          />
        }
      >
        <View style={styles.container}>
          <PageHeading
            eyebrow="Kasir"
            title="Riwayat pembayaran"
            description="Semua transaksi lunas tersimpan di sini. Buka satu transaksi untuk melihat dan membagikan tanda terima."
            right={<Tag label="Lunas" tone="green" icon="checkmark-circle" />}
          />

          <View style={styles.metrics}>
            <MetricTile
              label="Transaksi"
              value={String(paid.length)}
              hint="total lunas"
              tone="teal"
            />
            <MetricTile
              label="Hari ini"
              value={String(paidToday.length)}
              hint={formatCompactRupiah(todayTotal)}
              tone={paidToday.length > 0 ? 'teal' : 'paper'}
            />
            <MetricTile
              label="Nilai"
              value={formatCompactRupiah(allTotal)}
              hint="akumulasi"
            />
          </View>

          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Cari nomor tagihan, pasien, atau metode…"
          />

          <ChoicePills
            options={[
              { value: 'all', label: 'Semua transaksi', count: paid.length },
              { value: 'today', label: 'Hari ini', count: paidToday.length },
            ]}
            value={filter}
            onChange={setFilter}
          />

          <View style={styles.listSection}>
            <SectionHeading
              label="Tanda terima"
              right={
                <Text style={styles.countLabel}>
                  {visible.length} transaksi
                </Text>
              }
            />
            {groupList.length === 0 ? (
              <EmptyNote
                icon="receipt-outline"
                title="Belum ada transaksi lunas"
                description={
                  query
                    ? 'Tidak ada transaksi yang cocok dengan pencarian Anda.'
                    : 'Pembayaran yang dikonfirmasi di kasir akan muncul pada riwayat ini.'
                }
              />
            ) : (
              <View style={styles.groupList}>
                {groupList.map((group) => (
                  <View key={group.key} style={styles.group}>
                    <View style={styles.groupHead}>
                      <Text style={styles.groupLabel}>{group.label}</Text>
                      <Text style={styles.groupTotal}>
                        {formatRupiah(group.total)}
                      </Text>
                    </View>
                    <Surface padding={0} style={styles.groupCard}>
                      {group.items.map((invoice, index) => {
                        const patient = patients.find(
                          (entry) => entry.id === invoice.patientId,
                        );
                        return (
                          <Pressable
                            key={invoice.id}
                            accessibilityRole="button"
                            accessibilityLabel={`Buka tanda terima ${invoice.number}`}
                            onPress={() => setReceiptId(invoice.id)}
                            style={({ pressed }) => [
                              styles.row,
                              index !== group.items.length - 1 &&
                                styles.rowBorder,
                              pressed && {
                                backgroundColor: colors.canvasDeep,
                              },
                            ]}
                          >
                            <View style={styles.receiptIcon}>
                              <Ionicons
                                name="receipt-outline"
                                size={16}
                                color={colors.green}
                              />
                            </View>
                            <View style={styles.rowCopy}>
                              <Text style={styles.rowNumber} numberOfLines={1}>
                                {invoice.number}
                              </Text>
                              <Text style={styles.rowPatient} numberOfLines={1}>
                                {patient?.name ?? 'Pasien'} ·{' '}
                                {patient?.rm ?? '—'}
                              </Text>
                              <View style={styles.rowMeta}>
                                <Tag
                                  label={invoice.method ?? 'Tunai'}
                                  tone={
                                    methodTone[invoice.method ?? 'Tunai']
                                  }
                                />
                                <Text style={styles.rowTime}>
                                  {formatDateTime(
                                    invoice.paidAt ?? invoice.createdAt,
                                  )}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.rowRight}>
                              <Text style={styles.rowTotal}>
                                {formatRupiah(invoiceTotal(invoice))}
                              </Text>
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
                  </View>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.footer}>
            Tanda terima demo dapat dibagikan melalui menu bagikan pada setiap
            transaksi. Data kembali ke kondisi awal saat aplikasi dimuat ulang.
          </Text>
        </View>
      </AppPage>

      <PaymentReceiptSheet
        invoice={receipt}
        patient={receiptPatient}
        visible={Boolean(receipt)}
        onClose={() => setReceiptId(null)}
        cashierName={user.name}
      />
    </>
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
  listSection: {
    gap: 9,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.muted,
  },
  groupList: {
    gap: 14,
  },
  group: {
    gap: 6,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 2,
  },
  groupLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  groupTotal: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  groupCard: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  receiptIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenSoft,
  },
  rowCopy: {
    flex: 1,
    gap: 1,
  },
  rowNumber: {
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '800',
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  rowPatient: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  rowTime: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  rowTotal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    textAlign: 'center',
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.mutedSoft,
    paddingTop: 2,
  },
});
