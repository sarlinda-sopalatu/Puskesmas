import type { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadow } from '@/core/theme';

type SurfaceVariant = 'outline' | 'flat' | 'dark' | 'teal' | 'paper';

type SurfaceProps = {
  children: ReactNode;
  variant?: SurfaceVariant;
  padding?: number;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
};

const variants: Record<SurfaceVariant, ViewStyle> = {
  outline: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  flat: {
    backgroundColor: colors.canvasDeep,
    borderWidth: 0,
  },
  dark: {
    backgroundColor: colors.ink,
    borderWidth: 0,
  },
  teal: {
    backgroundColor: colors.tealTint,
    borderWidth: 1,
    borderColor: colors.tealSoft,
  },
  paper: {
    backgroundColor: colors.paperWarm,
    borderWidth: 1,
    borderColor: colors.line,
  },
};

export function Surface({
  children,
  variant = 'outline',
  padding = 16,
  elevated = false,
  style,
}: SurfaceProps) {
  return (
    <View
      style={[
        styles.base,
        variants[variant],
        { padding },
        elevated && variant === 'outline' ? shadow.card : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
  },
});
