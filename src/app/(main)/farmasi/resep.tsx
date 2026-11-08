import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { expiryLabel, expiryStatus, formatDateTime, formatRupiah, isToday } from '@/core/format';
import { hasAccess } from '@/core/navigation';
import { colors, radius } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { AppPage } from '@/components/layout/app-page';
import { PageHeading } from '@/components/layout/page-heading';
import { SectionHeading } from '@/components/layout/section-heading';
import { ActionButton } from '@/components/ui/action-button';
import { Avatar } from '@/components/ui/avatar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ChoicePills } from '@/components/ui/choice-pills';
import { EmptyNote } from '@/components/ui/empty-note';
import { IconButton } from '@/components/ui/icon-button';
import { MetricTile } from '@/components/ui/metric-tile';
import { SearchField } from '@/components/ui/search-field';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import {
  clinicInfo,
  prescriptionTotal,
  recordHasStockIssue,
} from '@/features/clinic/selectors';
import type { MedicalRecord, StockItem } from '@/features/clinic/types';

type RxFilter = 'pending' | 'handed';

export default function PrescriptionQueueScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { records, patients, tickets, staff, stockItems, actions } = useClinic();
  const [filter, setFilter] = useState<RxFilter>('pending');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!user) return null;
  if (!hasAccess(user.role, '/farmasi/resep')) {
    return <AccessDenied required="petugas farmasi atau administrator" />;
  }

  const pendingRecords = records
    .filter((record) => !record.handedOver && record.prescription.length > 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const handedRecords = records
    .filter((record) => record.handedOver)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const issueRecords = pendingRecords.filter((record) =>
    recordHasStockIssue(record, stockItems),
  );
  const handedToday = handedRecords.filter((record) =>
    isToday(record.createdAt),
  ).length;
  const selected = selectedId
    ? records.find((record) => record.id === selectedId)
    : undefined;
  const selectedPatient = selected
    ? patients.find((patient) => patient.id === selected.patientId)
    : undefined;
  const selectedHasIssue = selected
    ? recordHasStockIssue(selected, stockItems)
    : false;
  const source = filter === 'pending' ? pendingRecords : handedRecords;
  const visibleRecords = source.filter((record) => {
    const patient = patients.find((entry) => entry.id === record.patientId);
    const haystack = `${patient?.name ?? ''} ${patient?.rm ?? ''} ${record.diagnosis}`;
    return haystack.toLowerCase().includes(query.trim().toLowerCase());
  });

  const confirmHandover = () => {
    if (!selected) return;
    const result = actions.handOverPrescription(selected.id);
    if (!result.ok) {
      Alert.alert('Serah terima gagal', result.message ?? 'Coba lagi.');
      return;
    }
    setSelectedId(null);
    Alert.alert(
      'Obat berhasil diserahkan',
      'Stok obat telah dipotong dan resep ditandai selesai. Pasien dapat diarahkan ke kasir.',
      [{ text: 'Selesai' }],
    );
  };

  return (
    <>
      <AppPage
        dock
        headerRight={
          <IconButton
            icon="cube-outline"
            label="Buka buku stok"
            variant="quiet"
            size={38}
            onPress={() => router.push('/farmasi')}
          />
        }
      >
        <View style={styles.container}>
          <PageHeading
            eyebrow="Farmasi"
            title="Resep masuk"
            description="Verifikasi ketersediaan dan masa berlaku obat sebelum diserahkan kepada pasien."
            right={
              <Tag
                label={`${pendingRecords.length} menunggu`}
                tone={pendingRecords.length > 0 ? 'violet' : 'neutral'}
                dot
              />
            }
          />

          <View style={styles.metrics}>
            <MetricTile
              label="Menunggu"
              value={String(pendingRecords.length)}
              hint="resep aktif"
              tone={pendingRecords.length > 0 ? 'violet' : 'paper'}
            />
            <MetricTile
              label="Bermasalah"
              value={String(issueRecords.length)}
              hint="stok / ED"
              tone={issueRecords.length > 0 ? 'amber' : 'paper'}
            />
            <MetricTile
              label="Diserahkan"
              value={String(handedToday)}
              hint="hari ini"
              tone="teal"
            />
          </View>

          {issueRecords.length > 0 ? (
            <View style={styles.warning}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={colors.amber}
              />
              <Text style={styles.warningText}>
                {issueRecords.length} resep terblokir karena stok tidak cukup
                atau obat kedaluwarsa. Sesuaikan stok melalui buku stok farmasi.
              </Text>
            </View>
          ) : null}

          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Cari pasien, nomor RM, atau diagnosis…"
          />

          <ChoicePills
            options={[
              {
                value: 'pending',
                label: 'Menunggu',
                count: pendingRecords.length,
              },
              {
                value: 'handed',
                label: 'Sudah diserahkan',
                count: handedRecords.length,
              },
            ]}
            value={filter}
            onChange={setFilter}
          />

          <View style={styles.listSection}>
            <SectionHeading
              label={filter === 'pending' ? 'Antrean resep' : 'Riwayat serah terima'}
              right={
                <Text style={styles.countLabel}>
                  {visibleRecords.length} resep
                </Text>
              }
            />
            {visibleRecords.length === 0 ? (
              <EmptyNote
                icon={
                  filter === 'pending'
                    ? 'checkmark-done-outline'
                    : 'receipt-outline'
                }
                title={
                  filter === 'pending'
                    ? 'Tidak ada resep menunggu'
                    : 'Belum ada resep diserahkan'
                }
                description={
                  query
                    ? 'Tidak ada resep yang cocok dengan pencarian Anda.'
                    : filter === 'pending'
                      ? 'Resep baru dari dokter akan muncul di sini setelah EMR disimpan.'
                      : 'Riwayat serah terima obat akan tercatat di sini.'
                }
              />
            ) : (
              <View style={styles.cardList}>
                {visibleRecords.map((record) => {
                  const patient = patients.find(
                    (entry) => entry.id === record.patientId,
                  );
                  const ticket = tickets.find(
                    (entry) => entry.id === record.ticketId,
                  );
                  const doctor = staff.find(
                    (entry) => entry.id === record.doctorId,
                  );
                  const clinic = ticket ? clinicInfo[ticket.clinic] : undefined;
                  const hasIssue = recordHasStockIssue(record, stockItems);
                  return (
                    <PrescriptionCard
                      key={record.id}
                      record={record}
                      patientName={patient?.name ?? 'Pasien'}
                      patientRm={patient?.rm ?? '—'}
                      clinicLabel={clinic?.label ?? 'Poli'}
                      clinicColor={clinic?.color ?? colors.teal}
                      clinicTint={clinic?.tint ?? colors.tealSoft}
                      ticketCode={ticket?.code ?? '—'}
                      doctorName={doctor?.name ?? 'Dokter'}
                      stockItems={stockItems}
                      hasIssue={hasIssue}
                      onHandover={() => setSelectedId(record.id)}
                    />
                  );
                })}
              </View>
            )}
          </View>

          <Text style={styles.footer}>
            Stok dan masa berlaku divalidasi ulang saat tombol serah terima
            ditekan. Penyerahan memotong stok secara otomatis.
          </Text>
        </View>
      </AppPage>

      <BottomSheet
        visible={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title="Konfirmasi serah terima"
        eyebrow="Validasi resep & stok"
        footer={
          <View style={styles.sheetFooter}>
            <ActionButton
              label="Batal"
              tone="quiet"
              onPress={() => setSelectedId(null)}
              style={styles.sheetFooterButton}
            />
            <ActionButton
              label="Serahkan obat"
              icon="checkmark-circle-outline"
              tone="teal"
              onPress={confirmHandover}
              disabled={selectedHasIssue}
              style={styles.sheetFooterPrimary}
            />
          </View>
        }
      >
        {selected && selectedPatient ? (
          <>
            <View style={styles.patientRow}>
              <Avatar name={selectedPatient.name} size={42} />
              <View style={styles.patientCopy}>
                <Text style={styles.patientName}>{selectedPatient.name}</Text>
                <Text style={styles.patientMeta}>
                  {selectedPatient.rm} · {selectedPatient.coverage} ·{' '}
                  {selectedPatient.sex === 'L' ? 'Laki-laki' : 'Perempuan'}
                </Text>
              </View>
              <Tag
                label={selectedHasIssue ? 'Perlu perhatian' : 'Siap'}
                tone={selectedHasIssue ? 'amber' : 'green'}
                dot
              />
            </View>

            <View style={styles.sheetMedList}>
              {selected.prescription.map((line) => {
                const item = stockItems.find(
                  (entry) => entry.id === line.itemId,
                );
                const status = item ? expiryStatus(item.expiry) : 'missing';
                const insufficient = !item || item.stock < line.quantity;
                const expired = status === 'expired';
                return (
                  <View key={line.itemId} style={styles.sheetMedRow}>
                    <View style={styles.sheetMedIcon}>
                      <Ionicons
                        name="medical-outline"
                        size={15}
                        color={colors.tealDeep}
                      />
                    </View>
                    <View style={styles.sheetMedCopy}>
                      <Text style={styles.sheetMedName}>
                        {item?.name ?? 'Obat tidak ditemukan'}
                      </Text>
                      <Text style={styles.sheetMedMeta}>
                        {line.instruction || 'Aturan pakai belum diisi'}
                      </Text>
                      {item ? (
                        <Text style={styles.sheetMedStock}>
                          Butuh {line.quantity} {item.unit} · tersedia{' '}
                          {item.stock} · {expiryLabel(item.expiry)}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.sheetMedRight}>
                      <Text style={styles.sheetMedQty}>×{line.quantity}</Text>
                      <Tag
                        label={
                          expired
                            ? 'Kedaluwarsa'
                            : insufficient
                              ? 'Stok kurang'
                              : 'Cukup'
                        }
                        tone={
                          expired ? 'red' : insufficient ? 'amber' : 'green'
                        }
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            <View
              style={[
                styles.validation,
                selectedHasIssue && styles.validationWarning,
              ]}
            >
              <Ionicons
                name={
                  selectedHasIssue
                    ? 'alert-circle-outline'
                    : 'shield-checkmark-outline'
                }
                size={16}
                color={selectedHasIssue ? colors.amber : colors.tealDeep}
              />
              <Text
                style={[
                  styles.validationText,
                  selectedHasIssue && { color: colors.amber },
                ]}
              >
                {selectedHasIssue
                  ? 'Serah terima diblokir. Perbaiki stok atau ganti obat kedaluwarsa terlebih dahulu.'
                  : 'Semua obat tersedia dan belum kedaluwarsa. Stok akan dipotong setelah konfirmasi.'}
              </Text>
            </View>

            <View style={styles.sheetTotal}>
              <Text style={styles.sheetTotalLabel}>Nilai obat dalam resep</Text>
              <Text style={styles.sheetTotalValue}>
                {formatRupiah(prescriptionTotal(selected, stockItems))}
              </Text>
            </View>
          </>
        ) : null}
      </BottomSheet>
    </>
  );
}

function PrescriptionCard({
  record,
  patientName,
  patientRm,
  clinicLabel,
  clinicColor,
  clinicTint,
  ticketCode,
  doctorName,
  stockItems,
  hasIssue,
  onHandover,
}: {
  record: MedicalRecord;
  patientName: string;
  patientRm: string;
  clinicLabel: string;
  clinicColor: string;
  clinicTint: string;
  ticketCode: string;
  doctorName: string;
  stockItems: StockItem[];
  hasIssue: boolean;
  onHandover: () => void;
}) {
  const handed = record.handedOver;
  return (
    <Surface
      padding={0}
      style={[styles.card, { borderTopColor: clinicColor }]}
    >
      <View style={styles.cardHead}>
        <View style={[styles.cardAvatar, { backgroundColor: clinicTint }]}>
          <Ionicons
            name="document-text-outline"
            size={17}
            color={clinicColor}
          />
        </View>
        <View style={styles.cardHeadCopy}>
          <Text style={styles.cardPatient} numberOfLines={1}>
            {patientName}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {patientRm} · {clinicLabel} · {ticketCode}
          </Text>
        </View>
        <Tag
          label={handed ? 'Diserahkan' : hasIssue ? 'Terblokir' : 'Menunggu'}
          tone={handed ? 'green' : hasIssue ? 'amber' : 'violet'}
          dot
        />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.diagnosisRow}>
          <View style={styles.diagnosisDot} />
          <Text style={styles.diagnosisText} numberOfLines={2}>
            {record.diagnosis}
          </Text>
        </View>
        <Text style={styles.doctorLine}>
          {doctorName} · {formatDateTime(record.createdAt)}
        </Text>

        <View style={styles.medList}>
          {record.prescription.map((line) => {
            const item = stockItems.find((entry) => entry.id === line.itemId);
            const insufficient = !item || item.stock < line.quantity;
            const expired = item
              ? expiryStatus(item.expiry) === 'expired'
              : false;
            return (
              <View key={line.itemId} style={styles.medRow}>
                <View style={styles.medIcon}>
                  <Ionicons
                    name="medical-outline"
                    size={14}
                    color={colors.tealDeep}
                  />
                </View>
                <View style={styles.medCopy}>
                  <Text style={styles.medName} numberOfLines={1}>
                    {item?.name ?? 'Obat tidak ditemukan'}
                  </Text>
                  <Text style={styles.medInstruction} numberOfLines={2}>
                    {line.instruction || 'Aturan pakai belum diisi'}
                  </Text>
                  {item ? (
                    <Text style={styles.medStock}>
                      Stok {item.stock} {item.unit} · {expiryLabel(item.expiry)}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.medRight}>
                  <Text style={styles.medQty}>×{line.quantity}</Text>
                  {expired ? (
                    <Tag label="ED" tone="red" />
                  ) : insufficient ? (
                    <Tag label="Kurang" tone="amber" />
                  ) : (
                    <Tag label="Siap" tone="green" />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {hasIssue && !handed ? (
          <View style={styles.cardWarning}>
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color={colors.amber}
            />
            <Text style={styles.cardWarningText}>
              Ada obat dengan stok kurang atau kedaluwarsa. Serah terima
              diblokir hingga stok diperbaiki.
            </Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardTotalLabel}>Nilai obat</Text>
            <Text style={styles.cardTotal}>
              {formatRupiah(prescriptionTotal(record, stockItems))}
            </Text>
          </View>
          {handed ? (
            <View style={styles.handedNote}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.green}
              />
              <Text style={styles.handedText}>Stok telah dipotong</Text>
            </View>
          ) : (
            <ActionButton
              label="Serahkan obat"
              icon="arrow-forward"
              tone={hasIssue ? 'quiet' : 'teal'}
              size="sm"
              onPress={onHandover}
            />
          )}
        </View>
      </View>
    </Surface>
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
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.md,
    padding: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.amber,
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
    gap: 10,
  },
  card: {
    overflow: 'hidden',
    borderTopWidth: 3,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  cardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeadCopy: {
    flex: 1,
    gap: 1,
  },
  cardPatient: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '800',
    color: colors.ink,
  },
  cardMeta: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  cardBody: {
    padding: 12,
    gap: 8,
  },
  diagnosisRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  diagnosisDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.teal,
    marginTop: 5,
  },
  diagnosisText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  doctorLine: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
    marginTop: -4,
  },
  medList: {
    backgroundColor: colors.paperWarm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  medIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  medCopy: {
    flex: 1,
    gap: 0,
  },
  medName: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  medInstruction: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  medStock: {
    fontSize: 8,
    lineHeight: 11,
    color: colors.mutedSoft,
  },
  medRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  medQty: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  cardWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.sm,
    padding: 8,
  },
  cardWarningText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.amber,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 2,
  },
  cardTotalLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  cardTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  handedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  handedText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: colors.green,
  },
  footer: {
    textAlign: 'center',
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.mutedSoft,
    paddingTop: 2,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  sheetFooterButton: {
    flex: 1,
  },
  sheetFooterPrimary: {
    flex: 1.7,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 11,
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
  sheetMedList: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  sheetMedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  sheetMedIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  sheetMedCopy: {
    flex: 1,
    gap: 1,
  },
  sheetMedName: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  sheetMedMeta: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  sheetMedStock: {
    fontSize: 8,
    lineHeight: 11,
    color: colors.mutedSoft,
  },
  sheetMedRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  sheetMedQty: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.ink,
  },
  validation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: colors.tealTint,
    borderWidth: 1,
    borderColor: colors.tealSoft,
    borderRadius: radius.md,
    padding: 10,
  },
  validationWarning: {
    backgroundColor: colors.amberSoft,
    borderColor: 'rgba(180, 83, 9, 0.14)',
  },
  validationText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 13,
    color: colors.tealDeep,
  },
  sheetTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    padding: 11,
  },
  sheetTotalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
  },
  sheetTotalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
});
