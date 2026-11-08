import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ageFromBirthDate,
  maskedNik,
} from '@/core/format';
import { hasAccess } from '@/core/navigation';
import { colors, radius, type } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { AppPage } from '@/components/layout/app-page';
import { PageHeading } from '@/components/layout/page-heading';
import { ActionButton } from '@/components/ui/action-button';
import { ChoicePills } from '@/components/ui/choice-pills';
import { EmptyNote } from '@/components/ui/empty-note';
import { IconButton } from '@/components/ui/icon-button';
import { SearchField } from '@/components/ui/search-field';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import { coverageInfo } from '@/features/clinic/selectors';
import type { Coverage } from '@/features/clinic/types';

type CoverageFilter = 'all' | Coverage;

export default function PasienScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { patients } = useClinic();
  const [query, setQuery] = useState('');
  const [coverage, setCoverage] = useState<CoverageFilter>('all');

  if (!user) return null;
  if (!hasAccess(user.role, '/pasien')) {
    return <AccessDenied required="petugas pendaftaran atau tenaga medis" />;
  }

  const canCreate = user.role === 'administrator' || user.role === 'registration';
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = patients
    .filter((patient) => {
      const matchesCoverage = coverage === 'all' || patient.coverage === coverage;
      const matchesQuery =
        !normalizedQuery ||
        patient.name.toLowerCase().includes(normalizedQuery) ||
        patient.rm.toLowerCase().includes(normalizedQuery) ||
        patient.nik.includes(normalizedQuery);
      return matchesCoverage && matchesQuery;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const bpjsCount = patients.filter((patient) => patient.coverage === 'BPJS').length;
  const umumCount = patients.filter((patient) => patient.coverage === 'Umum').length;

  return (
    <AppPage
      dock
      headerRight={
        canCreate ? (
          <IconButton
            icon="person-add-outline"
            label="Daftarkan pasien baru"
            variant="ink"
            size={38}
            onPress={() => router.push('/pasien/daftar')}
          />
        ) : undefined
      }
    >
      <View style={styles.container}>
        <PageHeading
          eyebrow="Data induk"
          title="Pasien"
          description="Direktori pasien terdaftar beserta nomor rekam medis dan jaminan kesehatan."
          right={<Tag label={`${filtered.length} hasil`} tone="teal" dot />}
        />

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{patients.length}</Text>
            <Text style={styles.summaryLabel}>Total pasien</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{bpjsCount}</Text>
            <Text style={styles.summaryLabel}>BPJS</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{umumCount}</Text>
            <Text style={styles.summaryLabel}>Umum</Text>
          </View>
        </View>

        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Cari nama, NIK, atau nomor rekam medis…"
        />

        <ChoicePills
          options={[
            { value: 'all', label: 'Semua', count: patients.length },
            { value: 'BPJS', label: 'BPJS', count: bpjsCount },
            { value: 'Umum', label: 'Umum', count: umumCount },
          ]}
          value={coverage}
          onChange={setCoverage}
        />

        {filtered.length === 0 ? (
          <EmptyNote
            icon="person-outline"
            title="Tidak ada pasien yang cocok"
            description="Coba ubah kata kunci atau filter jaminan. Pasien baru dapat didaftarkan lewat tombol di kanan atas."
            action={
              canCreate ? (
                <ActionButton
                  label="Daftarkan pasien baru"
                  tone="teal"
                  icon="person-add-outline"
                  onPress={() => router.push('/pasien/daftar')}
                />
              ) : undefined
            }
          />
        ) : (
          <Surface padding={0} style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={[styles.headCell, styles.numberCell]}>#</Text>
              <Text style={[styles.headCell, styles.nameCell]}>Nama & No. RM</Text>
              <Text style={styles.headCell}>Jaminan</Text>
            </View>
            {filtered.map((patient, index) => (
              <Pressable
                key={patient.id}
                accessibilityRole="button"
                accessibilityLabel={`Buka pasien ${patient.name}`}
                onPress={() => router.push(`/pasien/${patient.id}` as Href)}
                style={({ pressed }) => [
                  styles.row,
                  index !== filtered.length - 1 && styles.rowBorder,
                  pressed && { backgroundColor: colors.canvasDeep },
                ]}
              >
                <Text style={styles.indexCell}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <View style={styles.rowCopy}>
                  <Text style={styles.name} numberOfLines={1}>
                    {patient.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {patient.rm} · {maskedNik(patient.nik)}
                  </Text>
                  <Text style={styles.subMeta}>
                    {ageFromBirthDate(patient.birthDate)} tahun ·{' '}
                    {patient.sex === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Tag
                    label={coverageInfo[patient.coverage].label}
                    tone={coverageInfo[patient.coverage].tone}
                  />
                  <Ionicons
                    name="chevron-forward"
                    size={13}
                    color={colors.mutedSoft}
                  />
                </View>
              </Pressable>
            ))}
            <View style={styles.tableFooter}>
              <Text style={styles.tableFooterText}>
                {filtered.length} dari {patients.length} pasien ditampilkan
              </Text>
              <Ionicons name="id-card-outline" size={12} color={colors.mutedSoft} />
            </View>
          </Surface>
        )}

        <View style={styles.note}>
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.tealDeep} />
          <Text style={styles.noteText}>
            NIK divalidasi 16 digit dan disamarkan pada daftar. Nomor rekam medis dibuat
            otomatis saat pasien baru disimpan.
          </Text>
        </View>
      </View>
    </AppPage>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  summaryValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  summaryDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.line,
  },
  table: {
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.canvasDeep,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headCell: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  numberCell: {
    width: 22,
  },
  nameCell: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  indexCell: {
    width: 22,
    fontSize: 9,
    fontWeight: '700',
    color: colors.mutedSoft,
    fontVariant: ['tabular-nums'],
  },
  rowCopy: {
    flex: 1,
    gap: 0,
  },
  name: {
    ...type.bodyStrong,
    fontSize: 12.5,
  },
  meta: {
    fontSize: 9,
    lineHeight: 13,
    color: colors.muted,
  },
  subMeta: {
    fontSize: 8,
    lineHeight: 12,
    color: colors.mutedSoft,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paperWarm,
  },
  tableFooterText: {
    fontSize: 8.5,
    color: colors.muted,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.mutedSoft,
  },
});
