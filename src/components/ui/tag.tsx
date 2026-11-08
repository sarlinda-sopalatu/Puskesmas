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

export type TagTone =
  | 'neutral'
  | 'teal'
  | 'amber'
  | 'rose'
  | 'blue'
  | 'violet'
  | 'green'
  | 'coral'
  | 'ink'
  | 'red';

const tones: Record<TagTone, { background: string; foreground: string }> = {
  neutral: { background: colors.canvasDeep, foreground: colors.inkMuted },
  teal: { background: colors.tealSoft, foreground: colors.tealDeep },
  amber: { background: colors.amberSoft, foreground: colors.amber },
  rose: { background: colors.roseSoft, foreground: colors.rose },
  blue: { background: colors.blueSoft, foreground: colors.blue },
  violet: { background: colors.violetSoft, foreground: colors.violet },
  green: { background: colors.greenSoft, foreground: colors.green },
  coral: { background: colors.coralSoft, foreground: colors.coralDeep },
  ink: { background: colors.ink, foreground: colors.white },
  red: { background: colors.redSoft, foreground: colors.red },
};

type TagProps = {
  label: string;
  tone?: TagTone;
  icon?: IconName;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Tag({ label, tone = 'neutral', icon, dot = false, style }: TagProps) {
  const palette = tones[tone];
  return (
    <View style={[styles.tag, { backgroundColor: palette.background }, style]}>
      {dot ? (
        <View style={[styles.dot, { backgroundColor: palette.foreground }]} />
      ) : null}
      {icon ? <Ionicons name={icon} size={10} color={palette.foreground} /> : null}
      <Text
        style={[styles.label, { color: palette.foreground }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: radius.xs,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 0.55,
    textTransform: 'uppercase',
  },
});
