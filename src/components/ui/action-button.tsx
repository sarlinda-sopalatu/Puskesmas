import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { IconName } from '@/core/navigation';
import { colors, radius } from '@/core/theme';

type ButtonTone = 'ink' | 'teal' | 'outline' | 'quiet' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ActionButtonProps = {
  label: string;
  onPress?: () => void;
  tone?: ButtonTone;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

const toneStyles: Record<
  ButtonTone,
  { background: string; border: string; text: string; spinner: string }
> = {
  ink: {
    background: colors.ink,
    border: colors.ink,
    text: colors.white,
    spinner: colors.white,
  },
  teal: {
    background: colors.teal,
    border: colors.teal,
    text: colors.white,
    spinner: colors.white,
  },
  outline: {
    background: 'transparent',
    border: colors.lineStrong,
    text: colors.ink,
    spinner: colors.teal,
  },
  quiet: {
    background: colors.paperWarm,
    border: colors.line,
    text: colors.ink,
    spinner: colors.teal,
  },
  danger: {
    background: colors.redSoft,
    border: colors.redSoft,
    text: colors.red,
    spinner: colors.red,
  },
};

const sizeStyles: Record<
  ButtonSize,
  { height: number; padding: number; font: number; icon: number; gap: number }
> = {
  sm: { height: 36, padding: 12, font: 11, icon: 14, gap: 6 },
  md: { height: 46, padding: 16, font: 13, icon: 17, gap: 8 },
  lg: { height: 52, padding: 20, font: 14, icon: 18, gap: 9 },
};

export function ActionButton({
  label,
  onPress,
  tone = 'ink',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ActionButtonProps) {
  const palette = toneStyles[tone];
  const dimensions = sizeStyles[size];
  const blocked = disabled || loading;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={palette.spinner} />
      ) : icon && iconPosition === 'left' ? (
        <Ionicons name={icon} size={dimensions.icon} color={palette.text} />
      ) : null}
      <Text
        style={[
          styles.label,
          { color: palette.text, fontSize: dimensions.font },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {!loading && icon && iconPosition === 'right' ? (
        <Ionicons name={icon} size={dimensions.icon} color={palette.text} />
      ) : null}
    </>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          height: dimensions.height,
          paddingHorizontal: dimensions.padding,
          gap: dimensions.gap,
          opacity: blocked ? 0.5 : pressed ? 0.82 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.md,
  },
  label: {
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
