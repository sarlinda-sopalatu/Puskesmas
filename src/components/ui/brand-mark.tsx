import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/core/theme';

type BrandMarkProps = {
  size?: number;
  tone?: 'teal' | 'ink' | 'light';
  style?: StyleProp<ViewStyle>;
};

export function BrandMark({ size = 32, tone = 'teal', style }: BrandMarkProps) {
  const background =
    tone === 'ink' ? colors.ink : tone === 'light' ? colors.paper : colors.teal;
  const cross = tone === 'light' ? colors.teal : colors.white;
  const dot = tone === 'light' ? colors.coral : colors.coral;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: background,
        },
        style,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          width: size * 0.5,
          height: size * 0.145,
          borderRadius: size * 0.045,
          backgroundColor: cross,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.145,
          height: size * 0.5,
          borderRadius: size * 0.045,
          backgroundColor: cross,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.13,
          top: size * 0.13,
          width: size * 0.15,
          height: size * 0.15,
          borderRadius: size * 0.075,
          backgroundColor: dot,
          borderWidth: Math.max(1, size * 0.015),
          borderColor: background,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
