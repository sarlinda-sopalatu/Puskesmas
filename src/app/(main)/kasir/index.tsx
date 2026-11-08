import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  formatCompactRupiah,
  formatDateTime,
  formatRupiah,
  isToday,
} from '@/core/format';
import { hasAccess, type IconName } from '@/core/navigation';
import { colors, radius } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { AppPage } from '@/components/layout/app-page';
import { PageHeading } from '@/components/layout/page-heading';
import { SectionHeading } from '@/components/layout/section-heading';
import { ActionButton } from '@/components/ui/action-button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ChoicePills } from '@/components/ui/choice-pills';
import { EmptyNote } from '@/components/ui/empty-note';
import { IconButton } from '@/components/ui/icon-button';
import { MetricTile } from '@/components/ui/metric-tile';
import { SearchField } from '@/components/ui/search-field';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import { invoiceTotal } from '@/features/clinic/selectors';
import { PaymentReceiptSheet } from '@/features/clinic/payment-receipt-sheet';
import type { PaymentMethod } from '@/features/clinic/types';

export default function CashierScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { invoices, patients, actions } = useClinic();
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('Tunai');
  const [cash, setCash] = useState('');
  const [receiptId, setReceiptId] = useState<string | null>(null);

  if (!user) return null;
  if (!hasAccess(user.role, '/kasir')) {
    return <AccessDenied required="petugas kasir atau administrator" />;
  }

  const openInvoices = invoices
    .filter((invoice) => invoice.status === 'open')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid');
  const paidToday = paidInvoices.filter((invoice) =>
    isToday(invoice.paidAt ?? invoice.createdAt),
  );
  const paidTodayTotal = paidToday.reduce(
    (total, invoice) => total + invoiceTotal(invoice),
    0,
  );
  const outstanding = openInvoices.reduce(
    (total, invoice) => total + invoiceTotal(invoice),
    0,
  );
  const visibleInvoices = openInvoices.filter((invoice) => {
    const patient = patients.find((entry) => entry.id === invoice.patientId);
    const haystack = `${invoice.number} ${patient?.name ?? ''} ${patient?.rm ?? ''}`;
    return haystack.toLowerCase().includes(query.trim().toLowerCase());
  });

  const selected = selectedId
    ? invoices.find((invoice) => invoice.id === selectedId)
    : undefined;
  const selectedPatient = selected
    ? patients.find((patient) => patient.id === selected.patientId)
    : undefined;
  const selectedTotal = selected ? invoiceTotal(selected) : 0;
  const receipt = receiptId
    ? invoices.find((invoice) => invoice.id === receiptId)
    : undefined;
  const receiptPatient = receipt
    ? patients.find((patient) => patient.id === receipt.patientId)
    : undefined;
  const cashValue = Math.floor(Number(cash.replace(/\D/g, '')) || 0);
  const change = cashValue - selectedTotal;
  const paymentBlocked = method === 'Tunai' && cashValue < selectedTotal;

  const methodOptions: {
    value: PaymentMethod;
    label: string;
    icon: IconName;
  }[] = [
    { value: 'Tunai', label: 'Tunai', icon: 'cash-outline' },
    { value: 'Transfer', label: 'Transfer', icon: 'card-outline' },
    ...(selectedPatient?.coverage === 'BPJS'
      ? [
          {
            value: 'BPJS' as PaymentMethod,
            label: 'BPJS',
            icon: 'shield-checkmark-outline' as IconName,
          },
        ]
      : []),
  ];

  const openPayment = (invoiceId: string) => {
    const invoice = invoices.find((entry) => entry.id === invoiceId);
    const patient = invoice
      ? patients.find((entry) => entry.id === invoice.patientId)
      : undefined;
    setSelectedId(invoiceId);
    setMethod(patient?.coverage === 'BPJS' ? 'BPJS' : 'Tunai');
    setCash('');
  };

  const submitPayment = () => {
    if (!selected || paymentBlocked) return;
    const result = actions.payInvoice(selected.id, method);
    if (!result.ok) {
      Alert.alert('Pembayaran gagal', result.message ?? 'Coba lagi.');
      return;
    }
    setSelectedId(null);
    setExpandedId(null);
    setCash('');
    setReceiptId(selected.id);
  };

  return (
    <>
      <AppPage
        dock
        headerRight={
          <IconButton
            icon="receipt-outline"
            label="Buka riwayat pembayaran"
            variant="quiet"
            size={38}
            onPress={() => router.push('/kasir/riwayat')}
          />
        }
      >
        <View style={styles.container}>
          <PageHeading
            eyebrow="Pembayaran"
            title="Kasir"
            description="Periksa rincian tagihan, pilih metode pembayaran, lalu terbitkan tanda terima."
            right={<Tag label="Loket kasir" tone="amber" icon="wallet-outline" />}
          />

          <View style={styles.metrics}>
            <MetricTile
              label="Terbuka"
              value={String(openInvoices.length)}
              hint="tagihan aktif"
              tone={openInvoices.length > 0 ? 'amber' : 'paper'}
            />
            <MetricTile
              label="Piutang"
              value={formatCompactRupiah(outstanding)}
              hint="belum dibayar"
            />
            <MetricTile
              label="Lunas"
              value={String(paidToday.length)}
              hint={formatCompactRupiah(paidTodayTotal)}
              tone="teal"
            />
          </View>

          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Cari nomor tagihan, pasien, atau RM…"
          />

          <View style={styles.listSection}>
            <SectionHeading
              label="Tagihan aktif"
              right={
                <Text style={styles.countLabel}>
                  {visibleInvoices.length} tagihan
                </Text>
              }
            />
            {visibleInvoices.length === 0 ? (
              <EmptyNote
                icon="checkmark-done-outline"
                title="Tidak ada tagihan terbuka"
                description={
                  query
                    ? 'Tidak ada tagihan yang cocok dengan pencarian Anda.'
                    : 'Tagihan baru muncul setelah dokter menyimpan rekam medis.'
                }
              />
            ) : (
              <View style={styles.cardList}>
                {visibleInvoices.map((invoice) => {
                  const patient = patients.find(
                    (entry) => entry.id === invoice.patientId,
                  );
                  const total = invoiceTotal(invoice);
                  const expanded = expandedId === invoice.id;
                  return (
                    <Surface
                      key={invoice.id}
                      padding={0}
                      style={styles.invoiceCard}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ expanded }}
                        accessibilityLabel={`Lihat rincian ${invoice.number}`}
                        onPress={() =>
                          setExpandedId(expanded ? null : invoice.id)
                        }
                        style={({ pressed }) => [
                          styles.invoiceHead,
                          pressed && { backgroundColor: colors.canvasDeep },
                        ]}
                      >
                        <View style={styles.invoiceIcon}>
                          <Ionicons
                            name="receipt-outline"
                            size={17}
                            color={colors.amber}
                          />
                        </View>
                        <View style={styles.invoiceHeadCopy}>
                          <Text style={styles.invoiceNumber}>
                            {invoice.number}
                          </Text>
                          <Text style={styles.invoicePatient} numberOfLines={1}>
                            {patient?.name ?? 'Pasien'} · {patient?.rm ?? '—'}
                          </Text>
                          <Text style={styles.invoiceMeta}>
                            {formatDateTime(invoice.createdAt)} ·{' '}
                            {patient?.coverage ?? 'Umum'}
                          </Text>
                        </View>
                        <View style={styles.invoiceHeadRight}>
                          <Text style={styles.invoiceTotal}>
                            {formatRupiah(total)}
                          </Text>
                          <View style={styles.expandRow}>
                            <Tag label="Terbuka" tone="amber" dot />
                            <Ionicons
                              name={expanded ? 'chevron-up' : 'chevron-down'}
                              size={13}
                              color={colors.muted}
                            />
                          </View>
                        </View>
                      </Pressable>

                      {expanded ? (
                        <View style={styles.invoiceBody}>
                          <Text style={styles.linesLabel}>Rincian biaya</Text>
                          <View style={styles.lines}>
                            {invoice.lines.map((line, index) => (
                              <View
                                key={`${invoice.id}-${index}`}
                                style={[
                                  styles.lineRow,
                                  index !== invoice.lines.length - 1 &&
                                    styles.lineBorder,
                                ]}
                              >
                                <Text style={styles.lineLabel}>
                                  {line.label}
                                </Text>
                                <Text style={styles.lineAmount}>
                                  {formatRupiah(line.amount)}
                                </Text>
                              </View>
                            ))}
                          </View>
                          <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total tagihan</Text>
                            <Text style={styles.totalValue}>
                              {formatRupiah(total)}
                            </Text>
                          </View>
                          <View style={styles.invoiceActions}>
                            <View style={styles.invoiceTags}>
                              <Tag
                                label={patient?.coverage ?? 'Umum'}
                                tone={
                                  patient?.coverage === 'BPJS'
                                    ? 'blue'
                                    : 'neutral'
                                }
                              />
                              <Tag label="Belum dibayar" tone="amber" />
                            </View>
                            <ActionButton
                              label="Proses bayar"
                              icon="wallet-outline"
                              tone="teal"
                              size="sm"
                              onPress={() => openPayment(invoice.id)}
                            />
                          </View>
                        </View>
                      ) : null}
                    </Surface>
                  );
                })}
              </View>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buka riwayat pembayaran"
            onPress={() => router.push('/kasir/riwayat')}
            style={({ pressed }) => [
              styles.historyLink,
              pressed && { opacity: 0.75 },
            ]}
          >
            <View style={styles.historyIcon}>
              <Ionicons
                name="time-outline"
                size={17}
                color={colors.tealDeep}
              />
            </View>
            <View style={styles.historyCopy}>
              <Text style={styles.historyTitle}>Riwayat pembayaran</Text>
              <Text style={styles.historyText}>
                {paidToday.length} transaksi lunas hari ini ·{' '}
                {formatRupiah(paidTodayTotal)}
              </Text>
            </View>
            <Ionicons
              name="arrow-forward"
              size={15}
              color={colors.tealDeep}
            />
          </Pressable>

          <Text style={styles.footer}>
            Metode BPJS hanya tersedia untuk pasien dengan jaminan BPJS.
            Tanda terima dapat dibagikan setelah pembayaran.
          </Text>
        </View>
      </AppPage>

      <BottomSheet
        visible={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title="Pembayaran tagihan"
        eyebrow={selected?.number}
        footer={
          <ActionButton
            label={
              method === 'Tunai'
                ? `Bayar ${formatRupiah(selectedTotal)}`
                : method === 'BPJS'
                  ? 'Konfirmasi klaim BPJS'
                  : 'Konfirmasi transfer'
            }
            icon="checkmark-circle-outline"
            tone="teal"
            onPress={submitPayment}
            disabled={paymentBlocked}
            fullWidth
          />
        }
      >
        {selected && selectedPatient ? (
          <>
            <View style={styles.payHead}>
              <View style={styles.payPatientIcon}>
                <Ionicons
                  name="person-outline"
                  size={17}
                  color={colors.tealDeep}
                />
              </View>
              <View style={styles.payPatientCopy}>
                <Text style={styles.payPatientName}>{selectedPatient.name}</Text>
                <Text style={styles.payPatientMeta}>
                  {selectedPatient.rm} · {selected.lines.length} item ·{' '}
                  {selectedPatient.coverage}
                </Text>
              </View>
              <Tag label="Terbuka" tone="amber" dot />
            </View>

            <View style={styles.payTotal}>
              <Text style={styles.payTotalLabel}>Total yang harus dibayar</Text>
              <Text style={styles.payTotalValue}>
                {formatRupiah(selectedTotal)}
              </Text>
            </View>

            <View style={styles.methodBlock}>
              <Text style={styles.fieldLabel}>Metode pembayaran</Text>
              <ChoicePills
                options={methodOptions}
                value={method}
                onChange={setMethod}
              />
            </View>

            {method === 'Tunai' ? (
              <>
                <TextField
                  label="Uang diterima"
                  value={cash}
                  onChangeText={(value) =>
                    setCash(value.replace(/\D/g, '').slice(0, 9))
                  }
                  placeholder="0"
                  keyboardType="numeric"
                  suffix="Rp"
                  hint="Masukkan nominal uang tunai yang diterima."
                />
                <View style={styles.cashQuickRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Isi uang pas"
                    onPress={() => setCash(String(selectedTotal))}
                    style={({ pressed }) => [
                      styles.cashQuick,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons
                      name="flash-outline"
                      size={12}
                      color={colors.tealDeep}
                    />
                    <Text style={styles.cashQuickText}>Uang pas</Text>
                  </Pressable>
                  {[50000, 100000, 150000].map((preset) => (
                    <Pressable
                      key={preset}
                      accessibilityRole="button"
                      accessibilityLabel={`Isi uang ${formatRupiah(preset)}`}
                      onPress={() => setCash(String(preset))}
                      style={({ pressed }) => [
                        styles.cashQuick,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={styles.cashQuickText}>
                        {formatCompactRupiah(preset)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View
                  style={[
                    styles.changeBox,
                    cashValue > 0 &&
                      cashValue < selectedTotal &&
                      styles.changeBoxShort,
                  ]}
                >
                  <View>
                    <Text style={styles.changeLabel}>Kembalian</Text>
                    <Text style={styles.changeHint}>
                      {cashValue > 0
                        ? cashValue >= selectedTotal
                          ? 'Uang diterima mencukupi'
                          : 'Uang yang diterima belum cukup'
                        : 'Masukkan nominal terlebih dahulu'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.changeValue,
                      cashValue > 0 &&
                        cashValue < selectedTotal && { color: colors.red },
                    ]}
                  >
                    {cashValue >= selectedTotal && cashValue > 0
                      ? formatRupiah(change)
                      : '—'}
                  </Text>
                </View>
              </>
            ) : method === 'BPJS' ? (
              <View style={styles.methodInfo}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color={colors.blue}
                />
                <Text style={styles.methodInfoText}>
                  Pastikan eligibilitas BPJS pasien sudah terverifikasi. Tagihan
                  akan ditandai lunas sebagai klaim jaminan tanpa pembayaran
                  tunai.
                </Text>
              </View>
            ) : (
              <View style={styles.methodInfo}>
                <Ionicons
                  name="card-outline"
                  size={17}
                  color={colors.blue}
                />
                <Text style={styles.methodInfoText}>
                  Konfirmasi hanya setelah dana transfer diterima. Nomor
                  referensi bank tidak dicatat pada versi demo.
                </Text>
              </View>
            )}

            <View style={styles.payLines}>
              <Text style={styles.payLinesLabel}>Ringkasan tagihan</Text>
              {selected.lines.map((line, index) => (
                <View
                  key={`${selected.id}-pay-${index}`}
                  style={styles.payLineRow}
                >
                  <Text style={styles.payLineLabel} numberOfLines={1}>
                    {line.label}
                  </Text>
                  <Text style={styles.payLineAmount}>
                    {formatRupiah(line.amount)}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.payNote}>
              Setelah dikonfirmasi, tagihan dipindahkan ke riwayat pembayaran dan
              tanda terima dapat dibagikan.
            </Text>
          </>
        ) : null}
      </BottomSheet>

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
  cardList: {
    gap: 9,
  },
  invoiceCard: {
    overflow: 'hidden',
  },
  invoiceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  invoiceIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.amberSoft,
  },
  invoiceHeadCopy: {
    flex: 1,
    gap: 1,
  },
  invoiceNumber: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  invoicePatient: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  invoiceMeta: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  invoiceHeadRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  invoiceTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  invoiceBody: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paperWarm,
    padding: 12,
    gap: 8,
  },
  linesLabel: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  lines: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 10,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 7,
  },
  lineBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  lineLabel: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.inkSoft,
  },
  lineAmount: {
    fontSize: 9.5,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 2,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.tealDeep,
    fontVariant: ['tabular-nums'],
  },
  invoiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 2,
  },
  invoiceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.tealTint,
    borderWidth: 1,
    borderColor: colors.tealSoft,
    borderRadius: radius.lg,
    padding: 12,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  historyCopy: {
    flex: 1,
    gap: 1,
  },
  historyTitle: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  historyText: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  footer: {
    textAlign: 'center',
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.mutedSoft,
    paddingTop: 2,
  },
  payHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 11,
  },
  payPatientIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  payPatientCopy: {
    flex: 1,
    gap: 1,
  },
  payPatientName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  payPatientMeta: {
    fontSize: 8.5,
    color: colors.muted,
  },
  payTotal: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: 14,
    gap: 2,
  },
  payTotalLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.58)',
  },
  payTotalValue: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  methodBlock: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  cashQuickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  cashQuick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  cashQuickText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  changeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: colors.tealTint,
    borderWidth: 1,
    borderColor: colors.tealSoft,
    borderRadius: radius.md,
    padding: 11,
  },
  changeBoxShort: {
    backgroundColor: colors.redSoft,
    borderColor: 'rgba(185, 28, 28, 0.18)',
  },
  changeLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.tealDeep,
  },
  changeHint: {
    fontSize: 8,
    lineHeight: 11,
    color: colors.muted,
    marginTop: 1,
  },
  changeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.tealDeep,
    fontVariant: ['tabular-nums'],
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.blueSoft,
    borderRadius: radius.md,
    padding: 11,
  },
  methodInfoText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    color: colors.blue,
  },
  payLines: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 10,
    gap: 5,
  },
  payLinesLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 1,
  },
  payLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  payLineLabel: {
    flex: 1,
    fontSize: 9,
    lineHeight: 13,
    color: colors.muted,
  },
  payLineAmount: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '700',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  payNote: {
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.mutedSoft,
    textAlign: 'center',
  },
});
