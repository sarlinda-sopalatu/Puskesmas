import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius } from '@/core/theme';
import { Tag, type TagTone } from './tag';

type TicketCardProps = {
  code: string;
  clinicLabel: string;
  patientName?: string;
  meta?: string;
  statusLabel?: string;
  statusTone?: TagTone;
  priority?: boolean;
  onPress?: () => void;
  notchColor?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function TicketCard({
  code,
  clinicLabel,
  patientName,
  meta,
  statusLabel,
  statusTone = 'teal',
  priority = false,
  onPress,
  notchColor = colors.canvas,
  compact = false,
  style,
}: TicketCardProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Antrean ${code}` : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.9 }, style]}
    >
      <LinearGradient
        colors={[colors.ink, '#123B47', '#0E4B4B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, compact && styles.cardCompact]}
      >
        <View style={styles.decorCircleA} />
        <View style={styles.decorCircleB} />

        <View style={[styles.top, compact && styles.horizontalCompact]}>
          <View style={styles.headerRow}>
            <Text style={styles.eyebrow}>Nomor antrean</Text>
            {statusLabel ? (
              <Tag label={statusLabel} tone={statusTone} dot />
            ) : null}
          </View>

          <View style={styles.numberRow}>
            <Text
              style={[styles.code, compact && styles.codeCompact]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {code}
            </Text>
            {priority ? (
              <View style={styles.priorityBadge}>
                <Ionicons name="flash" size={12} color={colors.coral} />
              </View>
            ) : null}
          </View>

          <Text style={styles.clinic}>{clinicLabel}</Text>
          {patientName ? <Text style={styles.patient}>{patientName}</Text> : null}
        </View>

        <View style={styles.dividerRow}>
          <View style={[styles.notch, { backgroundColor: notchColor, left: -11 }]} />
          <View style={styles.dashed} />
          <View style={[styles.notch, { backgroundColor: notchColor, right: -11 }]} />
        </View>

        <View style={styles.footer}>
          <View style={styles.footerMeta}>
            {priority ? (
              <Ionicons name="star" size={11} color={colors.coral} />
            ) : (
              <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.62)" />
            )}
            <Text style={styles.meta} numberOfLines={1}>
              {priority ? 'Prioritas · segera dipanggil' : meta ?? 'Menunggu panggilan'}
            </Text>
          </View>
          {onPress ? (
            <View style={styles.arrow}>
              <Ionicons name="arrow-forward" size={13} color={colors.white} />
            </View>
          ) : (
            <Text style={styles.brand}>PUSKESMAS</Text>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg + 2,
    overflow: 'hidden',
    paddingTop: 18,
  },
  cardCompact: {
    paddingTop: 15,
  },
  top: {
    paddingHorizontal: 20,
  },
  horizontalCompact: {
    paddingHorizontal: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  eyebrow: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.52)',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  code: {
    fontSize: 52,
    lineHeight: 57,
    fontWeight: '800',
    letterSpacing: -2,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  codeCompact: {
    fontSize: 42,
    lineHeight: 47,
  },
  priorityBadge: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  clinic: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.78)',
  },
  patient: {
    marginTop: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.white,
  },
  dividerRow: {
    marginTop: 15,
    height: 22,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dashed: {
    marginHorizontal: 20,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  notch: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 11,
    paddingBottom: 15,
  },
  footerMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  meta: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.62)',
  },
  arrow: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.3)',
  },
  decorCircleA: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    right: -50,
    top: -70,
    backgroundColor: 'rgba(15, 118, 110, 0.24)',
  },
  decorCircleB: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    left: -30,
    bottom: -32,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
});
