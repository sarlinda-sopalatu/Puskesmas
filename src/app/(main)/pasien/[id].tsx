import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import {
  ageFromBirthDate,
  formatDate,
  formatDateTime,
  formatRupiah,
  isToday,
  maskedNik,
} from '@/core/format';
import { hasAccess } from '@/core/navigation';
import { colors, radius, type } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { AppPage } from '@/components/layout/app-page';
import { SectionHeading } from '@/components/layout/section-heading';
import { ActionButton } from '@/components/ui/action-button';
import { Avatar } from '@/components/ui/avatar';
import { EmptyNote } from '@/components/ui/empty-note';
import { IconButton } from '@/components/ui/icon-button';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import {
  clinicInfo,
  coverageInfo,
  invoiceTotal,
  ticketStatusInfo,
} from '@/features/clinic/selectors';

export default function PatientDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { patients, tickets, records, invoices, staff } = useClinic();
  const patientId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!user) return null;
  if (!hasAccess(user.role, '/pasien')) {
    return <AccessDenied required="petugas pendaftaran atau tenaga medis" />;
  }

  const patient = patients.find((entry) => entry.id === patientId);

  if (!patient) {
    return (
      <AppPage header="back" title="Profil pasien" eyebrow="Data induk">
        <EmptyNote
          icon="person-outline"
          title="Pasien tidak ditemukan"
          description="Data mungkin sudah berubah atau tautan tidak valid."
          action={
            <ActionButton
              label="Kembali ke direktori"
              tone="outline"
              onPress={() => router.replace('/pasien')}
            />
          }
        />
      </AppPage>
    );
  }

  const canEdit = user.role === 'administrator' || user.role === 'registration';
  const canPractice = user.role === 'doctor' || user.role === 'nurse';
  const canViewExam =
    user.role === 'administrator' || user.role === 'doctor' || user.role === 'nurse';
  const activeQueue = tickets.find(
    (ticket) =>
      ticket.patientId === patient.id &&
      isToday(ticket.createdAt) &&
      (ticket.status === 'waiting' || ticket.status === 'called'),
  );
  const visits = records
    .filter((record) => record.patientId === patient.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const patientInvoices = invoices
    .filter((invoice) => invoice.patientId === patient.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const shareCard = async () => {
    try {
      await Share.share({
        message: [
          'KARTU PASIEN · PUSKESMAS',
          `Nama: ${patient.name}`,
          `No. RM: ${patient.rm}`,
          `NIK: ${patient.nik}`,
          `TTL: ${patient.birthPlace}, ${formatDate(patient.birthDate)}`,
          `Jaminan: ${patient.coverage}`,
          '',
          'Tunjukkan kartu ini saat mendaftar di puskesmas.',
        ].join('\n'),
      });
    } catch {
      // Pengguna dapat menutup dialog berbagi tanpa aksi lanjutan.
    }
  };

  const primaryAction = activeQueue
    ? {
        label: `Lihat antrean ${activeQueue.code}`,
        icon: 'ticket-outline' as const,
        onPress: () =>
          router.push(`/antrean/${activeQueue.id}` as Href),
      }
    : canEdit
      ? {
          label: 'Daftarkan antrean',
          icon: 'add' as const,
          onPress: () =>
            router.push(`/antrean/ambil?patientId=${patient.id}` as Href),
        }
      : null;

  return (
    <AppPage
      header="back"
      title="Profil pasien"
      eyebrow="Data induk"
      headerRight={
        canEdit ? (
          <IconButton
            icon="create-outline"
            label="Ubah data pasien"
            size={38}
            onPress={() =>
              router.push(`/pasien/daftar?id=${patient.id}` as Href)
            }
          />
        ) : undefined
      }
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.ink, '#143D47', '#0F4D49']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.masthead}
        >
          <View style={styles.decorA} />
          <View style={styles.decorB} />
          <View style={styles.mastheadTop}>
            <Text style={styles.mastheadEyebrow}>Kartu pasien</Text>
            <Tag
              label={coverageInfo[patient.coverage].label}
              tone={coverageInfo[patient.coverage].tone}
              dot
            />
          </View>
          <View style={styles.identityRow}>
            <Avatar
              name={patient.name}
              size={58}
              tint={colors.paper}
              color={colors.tealDeep}
            />
            <View style={styles.identityCopy}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientRm}>{patient.rm}</Text>
            </View>
          </View>
          <View style={styles.mastheadPills}>
            <View style={styles.mastheadPill}>
              <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.6)" />
              <Text style={styles.mastheadPillText}>
                {ageFromBirthDate(patient.birthDate)} tahun
              </Text>
            </View>
            <View style={styles.mastheadPill}>
              <Ionicons name="person-outline" size={11} color="rgba(255,255,255,0.6)" />
              <Text style={styles.mastheadPillText}>
                {patient.sex === 'L' ? 'Laki-laki' : 'Perempuan'}
              </Text>
            </View>
            <View style={styles.mastheadPill}>
              <Ionicons name="call-outline" size={11} color="rgba(255,255,255,0.6)" />
              <Text style={styles.mastheadPillText}>{patient.phone}</Text>
            </View>
          </View>
        </LinearGradient>

        {activeQueue ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Buka antrean ${activeQueue.code}`}
            onPress={() => router.push(`/antrean/${activeQueue.id}` as Href)}
            style={({ pressed }) => [styles.activeBanner, pressed && { opacity: 0.75 }]}
          >
            <View style={styles.activeIcon}>
              <Ionicons name="megaphone-outline" size={16} color={colors.tealDeep} />
            </View>
            <View style={styles.activeCopy}>
              <Text style={styles.activeTitle}>
                {activeQueue.status === 'called' ? 'Sedang dipanggil' : 'Menunggu antrean'}
              </Text>
              <Text style={styles.activeMeta}>
                {activeQueue.code} · {clinicInfo[activeQueue.clinic].label} ·{' '}
                {clinicInfo[activeQueue.clinic].room}
              </Text>
            </View>
            <Tag
              label={ticketStatusInfo[activeQueue.status].label}
              tone={ticketStatusInfo[activeQueue.status].tone}
              dot
            />
          </Pressable>
        ) : null}

        <View style={styles.actions}>
          {primaryAction ? (
            <ActionButton
              label={primaryAction.label}
              icon={primaryAction.icon}
              tone="teal"
              onPress={primaryAction.onPress}
              style={styles.primaryAction}
            />
          ) : null}
          <ActionButton
            label="Kartu pasien"
            icon="share-outline"
            tone="outline"
            onPress={shareCard}
            style={primaryAction ? styles.secondaryAction : styles.primaryAction}
          />
        </View>

        <View style={styles.section}>
          <SectionHeading label="Data identitas" />
          <View style={styles.infoGrid}>
            <InfoCell label="NIK" value={patient.nik} full />
            <InfoCell
              label="Tempat & tanggal lahir"
              value={`${patient.birthPlace}, ${formatDate(patient.birthDate)}`}
              full
            />
            <InfoCell label="Usia" value={`${ageFromBirthDate(patient.birthDate)} tahun`} />
            <InfoCell
              label="Jenis kelamin"
              value={patient.sex === 'L' ? 'Laki-laki' : 'Perempuan'}
            />
            <InfoCell label="Telepon" value={patient.phone} />
            <InfoCell
              label="Jaminan"
              value={
                <Tag
                  label={coverageInfo[patient.coverage].label}
                  tone={coverageInfo[patient.coverage].tone}
                />
              }
            />
            <InfoCell label="Alamat" value={patient.address} full />
            <InfoCell
              label="Kontak darurat"
              value={patient.emergencyContact || 'Belum diisi'}
              full
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading
            label="Riwayat kunjungan"
            right={<Text style={styles.countLabel}>{visits.length} rekam medis</Text>}
          />
          {visits.length === 0 ? (
            <EmptyNote
              icon="document-text-outline"
              title="Belum ada riwayat pemeriksaan"
              description={
                canPractice
                  ? 'Rekam medis akan muncul setelah pemeriksaan pertama disimpan.'
                  : 'Kunjungan pasien akan tercatat di sini setelah dilayani.'
              }
            />
          ) : (
            <Surface padding={0} style={styles.listCard}>
              {visits.map((record, index) => {
                const ticket = tickets.find((entry) => entry.id === record.ticketId);
                const doctor = staff.find((entry) => entry.id === record.doctorId);
                const row = (
                  <View style={styles.visitRow}>
                    <View style={styles.visitIcon}>
                      <Ionicons
                        name="document-text-outline"
                        size={16}
                        color={colors.tealDeep}
                      />
                    </View>
                    <View style={styles.visitCopy}>
                      <Text style={styles.visitTitle} numberOfLines={1}>
                        {record.diagnosis || 'Pemeriksaan'}
                      </Text>
                      <Text style={styles.visitMeta} numberOfLines={1}>
                        {formatDateTime(record.createdAt)} ·{' '}
                        {ticket ? clinicInfo[ticket.clinic].label : 'Poli'} ·{' '}
                        {doctor?.name ?? 'Dokter'}
                      </Text>
                      <Text style={styles.visitSub} numberOfLines={1}>
                        Keluhan: {record.complaint}
                      </Text>
                    </View>
                    <View style={styles.visitRight}>
                      <Tag
                        label={record.handedOver ? 'Obat diserahkan' : 'Resep aktif'}
                        tone={record.handedOver ? 'green' : 'amber'}
                      />
                      {canViewExam ? (
                        <Ionicons
                          name="chevron-forward"
                          size={13}
                          color={colors.mutedSoft}
                        />
                      ) : null}
                    </View>
                  </View>
                );
                return canViewExam ? (
                  <Pressable
                    key={record.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Buka rekam medis ${formatDate(record.createdAt)}`}
                    onPress={() =>
                      router.push(`/periksa/${record.ticketId}` as Href)
                    }
                    style={({ pressed }) => [
                      index !== visits.length - 1 && styles.rowBorder,
                      pressed && { backgroundColor: colors.canvasDeep },
                    ]}
                  >
                    {row}
                  </Pressable>
                ) : (
                  <View
                    key={record.id}
                    style={index !== visits.length - 1 && styles.rowBorder}
                  >
                    {row}
                  </View>
                );
              })}
            </Surface>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeading
            label="Tagihan"
            right={<Text style={styles.countLabel}>{patientInvoices.length} transaksi</Text>}
          />
          {patientInvoices.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada tagihan untuk pasien ini.</Text>
          ) : (
            <Surface padding={0} style={styles.listCard}>
              {patientInvoices.map((invoice, index) => (
                <View
                  key={invoice.id}
                  style={[
                    styles.invoiceRow,
                    index !== patientInvoices.length - 1 && styles.rowBorder,
                  ]}
                >
                  <View style={styles.invoiceCopy}>
                    <Text style={styles.invoiceNumber}>{invoice.number}</Text>
                    <Text style={styles.invoiceMeta}>
                      {formatDate(invoice.createdAt)} · {invoice.lines.length} item
                    </Text>
                  </View>
                  <View style={styles.invoiceRight}>
                    <Text style={styles.invoiceTotal}>
                      {formatRupiah(invoiceTotal(invoice))}
                    </Text>
                    <Tag
                      label={invoice.status === 'paid' ? 'Lunas' : 'Terbuka'}
                      tone={invoice.status === 'paid' ? 'green' : 'amber'}
                    />
                  </View>
                </View>
              ))}
            </Surface>
          )}
        </View>

        <Text style={styles.footer}>
          Terdaftar {formatDate(patient.createdAt)} · NIK {maskedNik(patient.nik)} ·
          data demo lokal
        </Text>
      </View>
    </AppPage>
  );
}

function InfoCell({
  label,
  value,
  full = false,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <View style={[styles.infoCell, full && styles.infoCellFull]}>
      <Text style={styles.infoLabel}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={styles.infoValue}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingTop: 2,
  },
  masthead: {
    borderRadius: radius.lg + 2,
    padding: 16,
    overflow: 'hidden',
    gap: 12,
  },
  decorA: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -60,
    top: -80,
    backgroundColor: 'rgba(15, 118, 110, 0.24)',
  },
  decorB: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    right: 40,
    bottom: -60,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  mastheadTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mastheadEyebrow: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  identityCopy: {
    flex: 1,
    gap: 1,
  },
  patientName: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.white,
  },
  patientRm: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.tealSoft,
    letterSpacing: 0.5,
  },
  mastheadPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  mastheadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mastheadPillText: {
    fontSize: 8.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.tealTint,
    borderWidth: 1,
    borderColor: colors.tealSoft,
    borderRadius: radius.md,
    padding: 11,
  },
  activeIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  activeCopy: {
    flex: 1,
    gap: 1,
  },
  activeTitle: {
    ...type.bodyStrong,
    fontSize: 11.5,
  },
  activeMeta: {
    fontSize: 9,
    color: colors.muted,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryAction: {
    flex: 1.5,
  },
  secondaryAction: {
    flex: 1,
  },
  section: {
    gap: 10,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.muted,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  infoCell: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 10,
    gap: 4,
    minHeight: 58,
  },
  infoCellFull: {
    flexBasis: '100%',
  },
  infoLabel: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  infoValue: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  listCard: {
    overflow: 'hidden',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  visitIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  visitCopy: {
    flex: 1,
    gap: 1,
  },
  visitTitle: {
    ...type.bodyStrong,
    fontSize: 12,
  },
  visitMeta: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  visitSub: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.mutedSoft,
  },
  visitRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  invoiceCopy: {
    flex: 1,
    gap: 1,
  },
  invoiceNumber: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  invoiceMeta: {
    fontSize: 8.5,
    color: colors.muted,
  },
  invoiceRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  invoiceTotal: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  emptyText: {
    ...type.small,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  footer: {
    textAlign: 'center',
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.mutedSoft,
    paddingTop: 2,
  },
});
