import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { expiryLabel, formatRupiah } from '@/core/format';
import { hasAccess } from '@/core/navigation';
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
import { isStockExpired, isStockExpiringSoon, isStockLow } from '@/features/clinic/selectors';

type StockFilter = 'all' | 'low' | 'expiring';
type AdjustMode = 'in' | 'out';

export default function PharmacyStockScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { stockItems, records, actions } = useClinic();
  const [filter, setFilter] = useState<StockFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<AdjustMode>('in');
  const [quantity, setQuantity] = useState('10');

  if (!user) return null;
  if (!hasAccess(user.role, '/farmasi')) {
    return <AccessDenied required="petugas farmasi atau administrator" />;
  }

  const selected = selectedId
    ? stockItems.find((item) => item.id === selectedId)
    : undefined;
  const pendingPrescriptions = records.filter(
    (record) => !record.handedOver && record.prescription.length > 0,
  ).length;
  const lowCount = stockItems.filter(isStockLow).length;
  const expiringCount = stockItems.filter(
    (item) => isStockExpired(item) || isStockExpiringSoon(item),
  ).length;
  const quantityValue = Math.max(0, Math.floor(Number(quantity) || 0));
  const delta = mode === 'in' ? quantityValue : -quantityValue;
  const projectedStock = selected ? selected.stock + delta : 0;
  const adjustmentInvalid =
    !selected || quantityValue < 1 || projectedStock < 0;

  const visibleItems = stockItems
    .filter((item) => {
      const matchesQuery = `${item.name} ${item.group}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      if (!matchesQuery) return false;
      if (filter === 'low') return isStockLow(item);
      if (filter === 'expiring') {
        return isStockExpired(item) || isStockExpiringSoon(item);
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const openAdjustment = (itemId: string) => {
    setSelectedId(itemId);
    setMode('in');
    setQuantity('10');
  };

  const applyAdjustment = () => {
    if (!selected || adjustmentInvalid) return;
    const result = actions.adjustStock(selected.id, delta);
    if (!result.ok) {
      Alert.alert('Stok tidak dapat diubah', result.message ?? 'Coba lagi.');
      return;
    }
    setSelectedId(null);
    Alert.alert(
      'Stok diperbarui',
      `${selected.name} kini ${projectedStock} ${selected.unit}. Mutasi ini hanya tersimpan pada sesi demo.`,
      [{ text: 'Selesai' }],
    );
  };

  return (
    <AppPage
      dock
      headerRight={
        <IconButton
          icon="document-text-outline"
          label="Buka resep masuk"
          variant="quiet"
          size={38}
          onPress={() => router.push('/farmasi/resep')}
        />
      }
    >
      <View style={styles.container}>
        <PageHeading
          eyebrow="Gudang obat"
          title="Farmasi"
          description="Pantau ketersediaan obat, masa berlaku, dan resep yang menunggu diserahkan."
          right={<Tag label="Apotek" tone="violet" icon="flask-outline" />}
        />

        <View style={styles.metrics}>
          <MetricTile
            label="Item"
            value={String(stockItems.length)}
            hint="di formularium"
          />
          <MetricTile
            label="Menipis"
            value={String(lowCount)}
            hint="perlu restock"
            tone={lowCount > 0 ? 'amber' : 'paper'}
          />
          <MetricTile
            label="Resep"
            value={String(pendingPrescriptions)}
            hint="belum diserahkan"
            tone={pendingPrescriptions > 0 ? 'violet' : 'paper'}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buka daftar resep masuk"
          onPress={() => router.push('/farmasi/resep')}
          style={({ pressed }) => [
            styles.rxBanner,
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={styles.rxBannerIcon}>
            <Ionicons
              name="document-text-outline"
              size={19}
              color={colors.violet}
            />
          </View>
          <View style={styles.rxBannerCopy}>
            <Text style={styles.rxBannerTitle}>Resep menunggu serah terima</Text>
            <Text style={styles.rxBannerText}>
              {pendingPrescriptions > 0
                ? `${pendingPrescriptions} resep siap diverifikasi dan diserahkan.`
                : 'Semua resep sudah diserahkan hari ini.'}
            </Text>
          </View>
          <View style={styles.rxBannerCount}>
            <Text style={styles.rxBannerCountText}>{pendingPrescriptions}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={15}
            color={colors.violet}
          />
        </Pressable>

        {expiringCount > 0 ? (
          <View style={styles.warning}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={colors.amber}
            />
            <Text style={styles.warningText}>
              {expiringCount} item mendekati atau sudah melewati masa berlaku.
              Periksa batch sebelum menyerahkan obat.
            </Text>
          </View>
        ) : null}

        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Cari nama obat atau golongan…"
        />

        <ChoicePills
          options={[
            { value: 'all', label: 'Semua', count: stockItems.length },
            { value: 'low', label: 'Menipis', count: lowCount },
            {
              value: 'expiring',
              label: 'Kedaluwarsa',
              count: expiringCount,
            },
          ]}
          value={filter}
          onChange={setFilter}
          scroll
        />

        <View style={styles.ledgerSection}>
          <SectionHeading
            label="Buku stok"
            right={
              <Text style={styles.countLabel}>{visibleItems.length} item</Text>
            }
          />

          {visibleItems.length === 0 ? (
            <EmptyNote
              icon="flask-outline"
              title="Tidak ada obat yang cocok"
              description="Ubah kata kunci atau filter untuk melihat item lain."
            />
          ) : (
            <Surface padding={0} style={styles.ledger}>
              <View style={styles.ledgerHead}>
                <Text style={styles.ledgerHeadLabel}>Obat</Text>
                <Text style={styles.ledgerHeadRight}>Stok</Text>
              </View>
              {visibleItems.map((item, index) => {
                const expired = isStockExpired(item);
                const soon = isStockExpiringSoon(item);
                const low = isStockLow(item);
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Sesuaikan stok ${item.name}`}
                    onPress={() => openAdjustment(item.id)}
                    style={({ pressed }) => [
                      styles.ledgerRow,
                      index !== visibleItems.length - 1 && styles.ledgerBorder,
                      pressed && { backgroundColor: colors.canvasDeep },
                    ]}
                  >
                    <View
                      style={[
                        styles.ledgerIcon,
                        expired && { backgroundColor: colors.redSoft },
                      ]}
                    >
                      <Ionicons
                        name="medical-outline"
                        size={16}
                        color={expired ? colors.red : colors.tealDeep}
                      />
                    </View>
                    <View style={styles.ledgerCopy}>
                      <Text style={styles.ledgerName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.ledgerMeta}>
                        {item.group} · {formatRupiah(item.price)}/{item.unit}
                      </Text>
                      <View style={styles.ledgerTags}>
                        {low ? (
                          <Tag
                            label={item.stock === 0 ? 'Habis' : 'Menipis'}
                            tone="amber"
                          />
                        ) : null}
                        <Tag
                          label={expiryLabel(item.expiry)}
                          tone={expired ? 'red' : soon ? 'amber' : 'green'}
                          dot
                        />
                      </View>
                    </View>
                    <View style={styles.stockBlock}>
                      <Text
                        style={[
                          styles.stockValue,
                          low && { color: colors.amber },
                          expired && { color: colors.red },
                        ]}
                      >
                        {item.stock}
                      </Text>
                      <Text style={styles.stockUnit}>{item.unit}</Text>
                      <View style={styles.adjustIcon}>
                        <Ionicons
                          name="swap-vertical-outline"
                          size={14}
                          color={colors.tealDeep}
                        />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </Surface>
          )}
        </View>

        <Text style={styles.footer}>
          Ketuk baris obat untuk mencatat stok masuk atau keluar. Stok minimum
          dipakai sebagai ambang peringatan.
        </Text>
      </View>

      <BottomSheet
        visible={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.name ?? 'Penyesuaian stok'}
        eyebrow="Buku stok farmasi"
        footer={
          <ActionButton
            label="Simpan penyesuaian"
            icon="save-outline"
            tone="teal"
            onPress={applyAdjustment}
            disabled={adjustmentInvalid}
            fullWidth
          />
        }
      >
        {selected ? (
          <>
            <View style={styles.sheetSummary}>
              <View style={styles.sheetSummaryCell}>
                <Text style={styles.sheetLabel}>Stok saat ini</Text>
                <Text style={styles.sheetValue}>
                  {selected.stock}{' '}
                  <Text style={styles.sheetUnit}>{selected.unit}</Text>
                </Text>
              </View>
              <View style={styles.sheetDivider} />
              <View style={styles.sheetSummaryCell}>
                <Text style={styles.sheetLabel}>Stok minimum</Text>
                <Text style={styles.sheetValue}>
                  {selected.minStock}{' '}
                  <Text style={styles.sheetUnit}>{selected.unit}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.sheetMetaRow}>
              <Tag label={selected.group} tone="neutral" />
              <Tag
                label={expiryLabel(selected.expiry)}
                tone={
                  isStockExpired(selected)
                    ? 'red'
                    : isStockExpiringSoon(selected)
                      ? 'amber'
                      : 'green'
                }
              />
            </View>

            <ChoicePills
              options={[
                {
                  value: 'in',
                  label: 'Stok masuk',
                  icon: 'arrow-down-circle-outline',
                },
                {
                  value: 'out',
                  label: 'Stok keluar',
                  icon: 'arrow-up-circle-outline',
                },
              ]}
              value={mode}
              onChange={setMode}
            />

            <TextField
              label="Jumlah"
              value={quantity}
              onChangeText={(value) =>
                setQuantity(value.replace(/[^0-9]/g, '').slice(0, 4))
              }
              keyboardType="numeric"
              suffix={selected.unit}
              placeholder="0"
              hint="Masukkan jumlah mutasi tanpa tanda minus."
            />

            <View style={styles.quickRow}>
              {[5, 10, 25, 50].map((preset) => (
                <Pressable
                  key={preset}
                  accessibilityRole="button"
                  accessibilityLabel={`Isi jumlah ${preset}`}
                  onPress={() => setQuantity(String(preset))}
                  style={({ pressed }) => [
                    styles.quickChip,
                    quantityValue === preset && styles.quickChipActive,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      quantityValue === preset && styles.quickChipTextActive,
                    ]}
                  >
                    {preset}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View
              style={[
                styles.preview,
                projectedStock < 0 && styles.previewError,
              ]}
            >
              <View style={styles.previewCopy}>
                <Text style={styles.previewLabel}>Stok setelah mutasi</Text>
                <Text style={styles.previewHint}>
                  {mode === 'in' ? 'Penerimaan barang' : 'Pengeluaran barang'} ·{' '}
                  {selected.name}
                </Text>
              </View>
              <Text
                style={[
                  styles.previewValue,
                  projectedStock < 0 && { color: colors.red },
                ]}
              >
                {projectedStock} {selected.unit}
              </Text>
            </View>

            {projectedStock < 0 ? (
              <Text style={styles.errorText}>
                Stok keluar melebihi jumlah tersedia. Kurangi jumlah terlebih
                dahulu.
              </Text>
            ) : null}

            <Text style={styles.sheetNote}>
              Penyesuaian stok tidak mengubah tanggal kedaluwarsa. Data demo
              kembali ke kondisi awal saat aplikasi dimuat ulang.
            </Text>
          </>
        ) : null}
      </BottomSheet>
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
  rxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.violetSoft,
    borderWidth: 1,
    borderColor: 'rgba(109, 40, 217, 0.14)',
    borderRadius: radius.lg,
    padding: 12,
  },
  rxBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  rxBannerCopy: {
    flex: 1,
    gap: 1,
  },
  rxBannerTitle: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '800',
    color: colors.violet,
  },
  rxBannerText: {
    fontSize: 9,
    lineHeight: 13,
    color: colors.violet,
  },
  rxBannerCount: {
    minWidth: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.violet,
    paddingHorizontal: 7,
  },
  rxBannerCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
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
  ledgerSection: {
    gap: 9,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.muted,
  },
  ledger: {
    overflow: 'hidden',
  },
  ledgerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: colors.canvasDeep,
  },
  ledgerHeadLabel: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  ledgerHeadRight: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ledgerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  ledgerIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  ledgerCopy: {
    flex: 1,
    gap: 1,
  },
  ledgerName: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  ledgerMeta: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  ledgerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  stockBlock: {
    alignItems: 'center',
    minWidth: 44,
    gap: 0,
  },
  stockValue: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  stockUnit: {
    fontSize: 8,
    lineHeight: 11,
    color: colors.muted,
    marginTop: -1,
  },
  adjustIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealTint,
    marginTop: 4,
  },
  footer: {
    textAlign: 'center',
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.mutedSoft,
    paddingTop: 2,
  },
  sheetSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  sheetSummaryCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  sheetDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.line,
  },
  sheetLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  sheetValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  sheetUnit: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.muted,
  },
  sheetMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  quickChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  quickChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  quickChipTextActive: {
    color: colors.white,
  },
  preview: {
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
  previewError: {
    backgroundColor: colors.redSoft,
    borderColor: 'rgba(185, 28, 28, 0.2)',
  },
  previewCopy: {
    flex: 1,
    gap: 1,
  },
  previewLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.tealDeep,
  },
  previewHint: {
    fontSize: 8.5,
    color: colors.muted,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.tealDeep,
    fontVariant: ['tabular-nums'],
  },
  errorText: {
    fontSize: 9.5,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.red,
  },
  sheetNote: {
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.mutedSoft,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
