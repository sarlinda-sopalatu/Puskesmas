import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatLongDate, formatTime, isToday } from '@/core/format';
import { hasAccess } from '@/core/navigation';
import { colors, radius } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { ActionButton } from '@/components/ui/action-button';
import { BrandMark } from '@/components/ui/brand-mark';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import { clinicInfo } from '@/features/clinic/selectors';

export default function DisplayAntreanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { tickets, patients, actions } = useClinic();
  const [clock, setClock] = useState(new Date());
  const { width } = useWindowDimensions();

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;
  if (!hasAccess(user.role, '/antrean/display')) {
    return <AccessDenied required="petugas antrean atau tenaga medis" />;
  }

  const wide = width >= 760;
  const todayTickets = tickets.filter((ticket) => isToday(ticket.createdAt));
  const waitingTickets = todayTickets
    .filter((ticket) => ticket.status === 'waiting')
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority ? -1 : 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
  const calledTicket = todayTickets.find((ticket) => ticket.status === 'called');
  const focus = calledTicket ?? waitingTickets[0];
  const focusPatient = focus
    ? patients.find((patient) => patient.id === focus.patientId)
    : undefined;
  const waitingCount = waitingTickets.length;
  const doneCount = todayTickets.filter((ticket) => ticket.status === 'done').length;
  const otherWaiting = waitingTickets
    .filter((ticket) => ticket.id !== focus?.id)
    .slice(0, 6);

  const callNext = () => {
    const called = actions.callNext();
    if (!called) {
      Alert.alert('Tidak ada antrean', 'Semua pasien sudah dipanggil atau dilayani.');
    }
  };

  return (
    <LinearGradient
      colors={[colors.ink, '#102F39', '#0D4A47']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.decorA} />
        <View style={styles.decorB} />

        <View style={styles.header}>
          <View style={styles.brand}>
            <BrandMark size={34} tone="light" />
            <View>
              <Text style={styles.brandTitle}>PUSKESMAS</Text>
              <Text style={styles.brandSubtitle}>DISPLAY ANTREAN · {formatLongDate(clock)}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.clockBox}>
              <Text style={styles.clock}>{formatTime(clock)}</Text>
              <Text style={styles.clockZone}>WIB</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keluar dari display"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.exit, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="close" size={16} color={colors.white} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.main,
            wide ? styles.mainWide : styles.mainNarrow,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.stage, wide && styles.stageWide]}>
            <View style={styles.stageEyebrowRow}>
              <View style={styles.liveDot} />
              <Text style={styles.stageEyebrow}>
                {calledTicket ? 'Sedang dipanggil' : focus ? 'Antrean berikutnya' : 'Ruang tunggu'}
              </Text>
            </View>

            <Text
              style={[styles.bigCode, !focus && styles.bigCodeEmpty]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {focus?.code ?? '—'}
            </Text>

            {focus ? (
              <>
                <Text style={styles.focusClinic}>
                  {clinicInfo[focus.clinic].label} · {clinicInfo[focus.clinic].room}
                </Text>
                <Text style={styles.focusPatient}>
                  {focusPatient?.name ?? 'Pasien'}
                </Text>
                <View style={styles.focusMetaRow}>
                  {focus.priority ? (
                    <View style={styles.priorityTag}>
                      <Ionicons name="flash" size={11} color={colors.coral} />
                      <Text style={styles.priorityText}>Prioritas</Text>
                    </View>
                  ) : null}
                  <Text style={styles.focusInstruction}>
                    {calledTicket
                      ? 'Silakan menuju ruang pemeriksaan'
                      : 'Siap untuk dipanggil'}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.noQueueText}>
                Belum ada antrean menunggu saat ini.
              </Text>
            )}

            <View style={styles.stageStats}>
              <View style={styles.stageStat}>
                <Text style={styles.stageStatValue}>{waitingCount}</Text>
                <Text style={styles.stageStatLabel}>Menunggu</Text>
              </View>
              <View style={styles.stageDivider} />
              <View style={styles.stageStat}>
                <Text style={styles.stageStatValue}>{doneCount}</Text>
                <Text style={styles.stageStatLabel}>Selesai</Text>
              </View>
              <View style={styles.stageDivider} />
              <View style={styles.stageStat}>
                <Text style={styles.stageStatValue}>
                  {String(waitingCount + doneCount).padStart(2, '0')}
                </Text>
                <Text style={styles.stageStatLabel}>Hari ini</Text>
              </View>
            </View>
          </View>

          <View style={[styles.waitingPanel, wide && styles.waitingPanelWide]}>
            <View style={styles.waitingHeader}>
              <View>
                <Text style={styles.waitingEyebrow}>Berikutnya</Text>
                <Text style={styles.waitingTitle}>Daftar tunggu</Text>
              </View>
              <View style={styles.waitingCount}>
                <Text style={styles.waitingCountText}>{waitingCount}</Text>
              </View>
            </View>

            {otherWaiting.length > 0 ? (
              <View style={styles.waitingList}>
                {otherWaiting.map((ticket, index) => {
                  const patient = patients.find(
                    (entry) => entry.id === ticket.patientId,
                  );
                  return (
                    <View key={ticket.id} style={styles.waitingRow}>
                      <Text style={styles.waitingIndex}>
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                      <View style={styles.waitingCopy}>
                        <Text style={styles.waitingCode}>{ticket.code}</Text>
                        <Text style={styles.waitingPatient} numberOfLines={1}>
                          {patient?.name ?? 'Pasien'}
                        </Text>
                      </View>
                      <View style={styles.waitingClinic}>
                        <Text style={styles.waitingClinicText}>
                          {clinicInfo[ticket.clinic].short}
                        </Text>
                        {ticket.priority ? (
                          <Ionicons name="flash" size={10} color={colors.coral} />
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.waitingEmpty}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={26}
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.waitingEmptyText}>
                  Tidak ada pasien lain yang menunggu.
                </Text>
              </View>
            )}

            <View style={styles.waitingPanelFooter}>
              <ActionButton
                label="Panggil berikutnya"
                tone="teal"
                icon="megaphone-outline"
                size="md"
                onPress={callNext}
                fullWidth
                disabled={waitingCount === 0}
              />
              <Text style={styles.waitingHint}>
                Panggilan akan memperbarui layar ini secara otomatis.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>PUSKESMAS · LAYANAN TERPADU</Text>
          <Text style={styles.footerNote}>
            Mohon perhatikan nomor dan ruang tujuan Anda
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  decorA: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    right: -140,
    top: -130,
    backgroundColor: 'rgba(15, 118, 110, 0.2)',
  },
  decorB: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    left: -100,
    bottom: 20,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandTitle: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    letterSpacing: 2.2,
    color: colors.white,
  },
  brandSubtitle: {
    fontSize: 7.5,
    lineHeight: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.4)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clockBox: {
    alignItems: 'flex-end',
  },
  clock: {
    fontSize: 20,
    lineHeight: 23,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  clockZone: {
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 1.3,
    color: 'rgba(255,255,255,0.4)',
  },
  exit: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  main: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
  },
  mainWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  mainNarrow: {
    flexDirection: 'column',
  },
  stage: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg + 2,
    padding: 20,
    justifyContent: 'center',
    minHeight: 280,
    overflow: 'hidden',
  },
  stageWide: {
    flex: 1.35,
    minHeight: 420,
  },
  stageEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.tealSoft,
  },
  stageEyebrow: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
  },
  bigCode: {
    fontSize: 98,
    lineHeight: 104,
    fontWeight: '800',
    letterSpacing: -5,
    color: colors.white,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  bigCodeEmpty: {
    color: 'rgba(255,255,255,0.18)',
  },
  focusClinic: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.tealSoft,
  },
  focusPatient: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    color: colors.white,
    marginTop: 1,
  },
  focusMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  priorityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.coral,
  },
  focusInstruction: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.55)',
  },
  noQueueText: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
  },
  stageStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 22,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  stageStat: {
    gap: 1,
  },
  stageStatValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  stageStatLabel: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
  },
  stageDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  waitingPanel: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.lg + 2,
    padding: 16,
    gap: 12,
  },
  waitingPanelWide: {
    flex: 0.85,
  },
  waitingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  waitingEyebrow: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
  },
  waitingTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.white,
  },
  waitingCount: {
    minWidth: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(15, 118, 110, 0.3)',
  },
  waitingCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.tealSoft,
  },
  waitingList: {
    gap: 6,
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  waitingIndex: {
    width: 18,
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
    fontVariant: ['tabular-nums'],
  },
  waitingCopy: {
    flex: 1,
    gap: 0,
  },
  waitingCode: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  waitingPatient: {
    fontSize: 8.5,
    lineHeight: 12,
    color: 'rgba(255,255,255,0.45)',
  },
  waitingClinic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waitingClinicText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
  },
  waitingEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 22,
  },
  waitingEmptyText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  waitingPanelFooter: {
    marginTop: 'auto',
    gap: 7,
  },
  waitingHint: {
    fontSize: 7.5,
    lineHeight: 11,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
  },
  footer: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  footerBrand: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.28)',
  },
  footerNote: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.34)',
  },
});
