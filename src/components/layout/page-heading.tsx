import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/core/theme';

type PageHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PageHeading({
  eyebrow,
  title,
  description,
  right,
  style,
}: PageHeadingProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.tealDeep,
  },
  title: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '800',
    letterSpacing: -0.9,
    color: colors.ink,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    maxWidth: 520,
  },
  right: {
    paddingTop: 4,
    flexShrink: 0,
  },
});
