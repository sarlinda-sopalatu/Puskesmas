import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { IconName } from '@/core/navigation';
import { colors, radius } from '@/core/theme';

type Tone = 'paper' | 'dark' | 'teal' | 'amber' | 'rose' | 'violet';

const tones: Record<
  Tone,
  { background: string; border: string; label: string; value: string; hint: string }
> = {
  paper: {
    background: colors.paper,
    border: colors.line,
    label: colors.muted,
    value: colors.ink,
    hint: colors.muted,
  },
  dark: {
    background: colors.ink,
    border: colors.ink,
    label: 'rgba(255,255,255,0.6)',
    value: colors.white,
    hint: 'rgba(255,255,255,0.65)',
  },
  teal: {
    background: colors.tealSoft,
    border: colors.tealSoft,
    label: colors.tealDeep,
    value: colors.tealDeep,
    hint: colors.tealDeep,
  },
  amber: {
    background: colors.amberSoft,
    border: colors.amberSoft,
    label: colors.amber,
    value: colors.ink,
    hint: colors.amber,
  },
  rose: {
    background: colors.roseSoft,
    border: colors.roseSoft,
    label: colors.rose,
    value: colors.ink,
    hint: colors.rose,
  },
  violet: {
    background: colors.violetSoft,
    border: colors.violetSoft,
    label: colors.violet,
    value: colors.ink,
    hint: colors.violet,
  },
};

type MetricTileProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: IconName;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
};

export function MetricTile({
  label,
  value,
  hint,
  icon,
  tone = 'paper',
  style,
}: MetricTileProps) {
  const palette = tones[tone];
  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <View style={styles.labelRow}>
        <Text style={[styles.labelText, { color: palette.label }]} numberOfLines={1}>
          {label}
        </Text>
        {icon ? <Ionicons name={icon} size={13} color={palette.label} /> : null}
      </View>
      <Text style={[styles.value, { color: palette.value }]} numberOfLines={1}>
        {value}
      </Text>
      {hint ? (
        <Text style={[styles.hint, { color: palette.hint }]} numberOfLines={2}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 86,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 10,
    gap: 3,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  labelText: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  value: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: -0.7,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontSize: 8.5,
    lineHeight: 12,
    fontWeight: '600',
  },
});
