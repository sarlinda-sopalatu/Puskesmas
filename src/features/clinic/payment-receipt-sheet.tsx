import { Ionicons } from '@expo/vector-icons';
import { Share, StyleSheet, Text, View } from 'react-native';

import { formatDateTime, formatRupiah } from '@/core/format';
import { colors, radius, type } from '@/core/theme';
import { ActionButton } from '@/components/ui/action-button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { invoiceTotal } from './selectors';
import type { Invoice, Patient } from './types';

type PaymentReceiptSheetProps = {
  invoice?: Invoice;
  patient?: Patient;
  visible: boolean;
  onClose: () => void;
  cashierName?: string;
};

export function PaymentReceiptSheet({
  invoice,
  patient,
  visible,
  onClose,
  cashierName,
}: PaymentReceiptSheetProps) {
  const paid = invoice?.status === 'paid';
  const total = invoice ? invoiceTotal(invoice) : 0;

  const shareReceipt = async () => {
    if (!invoice) return;
    const lines = [
      paid ? 'TANDA TERIMA PEMBAYARAN' : 'RINCIAN TAGIHAN',
      'PUSKESMAS · Layanan terpadu',
      '',
      `No. tagihan: ${invoice.number}`,
      `Pasien: ${patient?.name ?? 'Pasien'}`,
      `No. RM: ${patient?.rm ?? '—'}`,
      `Tanggal: ${formatDateTime(invoice.createdAt)}`,
      ...(paid && invoice.paidAt
        ? [
            `Dibayar: ${formatDateTime(invoice.paidAt)}`,
            `Metode: ${invoice.method ?? '—'}`,
          ]
        : []),
      '',
      ...invoice.lines.map(
        (line) => `• ${line.label} — ${formatRupiah(line.amount)}`,
      ),
      '',
      `Total: ${formatRupiah(total)}`,
      paid ? 'Status: LUNAS' : 'Status: BELUM DIBAYAR',
      '',
      'Dokumen demo, bukan bukti pembayaran resmi.',
    ];
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // Dialog berbagi dapat ditutup tanpa aksi lanjutan.
    }
  };

  return (
    <BottomSheet
      visible={visible && Boolean(invoice)}
      onClose={onClose}
      title={paid ? 'Tanda terima pembayaran' : 'Rincian tagihan'}
      eyebrow="Kasir puskesmas"
      footer={
        invoice ? (
          <View style={styles.footer}>
            <ActionButton
              label="Tutup"
              tone="quiet"
              onPress={onClose}
              style={styles.footerButton}
            />
            <ActionButton
              label="Bagikan"
              icon="share-social-outline"
              tone="teal"
              onPress={shareReceipt}
              style={styles.footerPrimary}
            />
          </View>
        ) : undefined
      }
    >
      {invoice ? (
        <>
          <View style={styles.hero}>
            <View
              style={[
                styles.heroIcon,
                {
                  backgroundColor: paid
                    ? colors.greenSoft
                    : colors.amberSoft,
                },
              ]}
            >
              <Ionicons
                name={paid ? 'checkmark' : 'time-outline'}
                size={26}
                color={paid ? colors.green : colors.amber}
              />
            </View>
            <Text style={styles.heroTitle}>
              {paid ? 'Pembayaran lunas' : 'Tagihan belum dibayar'}
            </Text>
            <Text style={styles.heroNumber}>{invoice.number}</Text>
            <Tag
              label={paid ? 'Lunas' : 'Terbuka'}
              tone={paid ? 'green' : 'amber'}
              dot
            />
          </View>

          <Surface padding={12} style={styles.patientCard}>
            <View style={styles.patientRow}>
              <View style={styles.patientIcon}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={colors.tealDeep}
                />
              </View>
              <View style={styles.patientCopy}>
                <Text style={styles.patientName}>
                  {patient?.name ?? 'Pasien'}
                </Text>
                <Text style={styles.patientMeta}>
                  {patient?.rm ?? '—'} ·{' '}
                  {patient?.coverage === 'BPJS' ? 'BPJS' : 'Umum'}
                </Text>
              </View>
            </View>
            <View style={styles.metaGrid}>
              <MetaCell
                label="Diterbitkan"
                value={formatDateTime(invoice.createdAt)}
              />
              <MetaCell
                label="Metode"
                value={invoice.method ?? 'Belum dibayar'}
              />
              <MetaCell
                label={paid ? 'Dibayar pada' : 'Petugas'}
                value={
                  paid && invoice.paidAt
                    ? formatDateTime(invoice.paidAt)
                    : cashierName ?? 'Kasir'
                }
              />
              <MetaCell
                label={paid ? 'Kasir' : 'Status'}
                value={paid ? cashierName ?? 'Kasir' : 'Menunggu pembayaran'}
              />
            </View>
          </Surface>

          <Surface padding={12} style={styles.lineCard}>
            <Text style={styles.lineHeading}>Rincian biaya</Text>
            {invoice.lines.map((line, index) => (
              <View
                key={`${line.label}-${index}`}
                style={[
                  styles.lineRow,
                  index !== invoice.lines.length - 1 && styles.lineBorder,
                ]}
              >
                <Text style={styles.lineLabel}>{line.label}</Text>
                <Text style={styles.lineAmount}>
                  {formatRupiah(line.amount)}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total tagihan</Text>
              <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
            </View>
          </Surface>

          <Text style={styles.note}>
            {paid
              ? 'Simpan tanda terima ini sebagai bukti pembayaran demo. Data transaksi kembali ke kondisi awal saat aplikasi dimuat ulang.'
              : 'Tagihan ini belum dibayar. Selesaikan pembayaran melalui lembar pembayaran kasir.'}
          </Text>
        </>
      ) : null}
    </BottomSheet>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: 3,
    paddingTop: 4,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    ...type.h3,
    textAlign: 'center',
  },
  heroNumber: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
    marginBottom: 3,
  },
  patientCard: {
    gap: 10,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  patientIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  patientCopy: {
    flex: 1,
    gap: 1,
  },
  patientName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.ink,
  },
  patientMeta: {
    fontSize: 8.5,
    color: colors.muted,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  metaCell: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: colors.paperWarm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 8,
    gap: 2,
  },
  metaLabel: {
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  metaValue: {
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  lineCard: {
    gap: 0,
  },
  lineHeading: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
    paddingBottom: 7,
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
    fontSize: 10,
    lineHeight: 14,
    color: colors.inkSoft,
  },
  lineAmount: {
    fontSize: 10,
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
    borderTopWidth: 1,
    borderTopColor: colors.lineStrong,
    marginTop: 3,
    paddingTop: 9,
  },
  totalLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.ink,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.tealDeep,
    fontVariant: ['tabular-nums'],
  },
  note: {
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.mutedSoft,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
  },
  footerButton: {
    flex: 1,
  },
  footerPrimary: {
    flex: 1.4,
  },
});
