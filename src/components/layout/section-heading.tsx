import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/core/theme';

type SectionHeadingProps = {
  label: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeading({ label, right, style }: SectionHeadingProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.rule} />
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  right: {
    flexShrink: 0,
  },
});
