import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { IconName } from '@/core/navigation';
import { colors } from '@/core/theme';

type IconButtonVariant = 'outline' | 'quiet' | 'ink' | 'plain';

type IconButtonProps = {
  icon: IconName;
  label: string;
  onPress?: () => void;
  variant?: IconButtonVariant;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

const variants: Record<
  IconButtonVariant,
  { background: string; border: string; icon: string }
> = {
  outline: {
    background: colors.paper,
    border: colors.line,
    icon: colors.ink,
  },
  quiet: {
    background: colors.canvasDeep,
    border: 'transparent',
    icon: colors.ink,
  },
  ink: {
    background: colors.ink,
    border: colors.ink,
    icon: colors.white,
  },
  plain: {
    background: 'transparent',
    border: 'transparent',
    icon: colors.ink,
  },
};

export function IconButton({
  icon,
  label,
  onPress,
  variant = 'outline',
  size = 40,
  color,
  style,
  disabled = false,
}: IconButtonProps) {
  const palette = variants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size * 0.34,
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={size * 0.45}
        color={color ?? palette.icon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
