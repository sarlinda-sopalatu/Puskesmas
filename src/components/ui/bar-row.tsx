import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { percent } from '@/core/format';
import { colors, radius } from '@/core/theme';

type BarRowProps = {
  label: string;
  value: number;
  max: number;
  color?: string;
  suffix?: string;
  caption?: string;
  style?: StyleProp<ViewStyle>;
};

export function BarRow({
  label,
  value,
  max,
  color = colors.teal,
  suffix,
  caption,
  style,
}: BarRowProps) {
  const ratio = percent(value, max);
  return (
    <View style={[styles.container, style]}>
      <View style={styles.labels}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.value}>
          {value}
          {suffix ? <Text style={styles.suffix}> {suffix}</Text> : null}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.max(ratio * 100, value > 0 ? 4 : 0)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 5,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  label: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  value: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  suffix: {
    fontWeight: '500',
    color: colors.muted,
  },
  track: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasDeep,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  caption: {
    fontSize: 9,
    lineHeight: 13,
    color: colors.mutedSoft,
  },
});
