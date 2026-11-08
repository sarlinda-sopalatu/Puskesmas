import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { initials } from '@/core/format';
import { colors } from '@/core/theme';

type AvatarProps = {
  name: string;
  size?: number;
  color?: string;
  tint?: string;
  style?: StyleProp<ViewStyle>;
};

export function Avatar({
  name,
  size = 42,
  color = colors.tealDeep,
  tint = colors.tealSoft,
  style,
}: AvatarProps) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: tint,
        },
        style,
      ]}
    >
      <Text
        style={{
          color,
          fontSize: size * 0.32,
          lineHeight: size * 0.4,
          fontWeight: '800',
          letterSpacing: -0.5,
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(11, 31, 42, 0.06)',
  },
});
