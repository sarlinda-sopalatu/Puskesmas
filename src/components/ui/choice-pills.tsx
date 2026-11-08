import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { IconName } from '@/core/navigation';
import { colors, radius } from '@/core/theme';

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
  count?: number;
};

type ChoicePillsProps<T extends string> = {
  options: readonly ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ChoicePills<T extends string>({
  options,
  value,
  onChange,
  scroll = false,
  style,
}: ChoicePillsProps<T>) {
  const content = options.map((option) => {
    const selected = option.value === value;
    return (
      <Pressable
        key={option.value}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => onChange(option.value)}
        style={({ pressed }) => [
          styles.pill,
          selected ? styles.pillSelected : styles.pillIdle,
          pressed && styles.pressed,
        ]}
      >
        {option.icon ? (
          <Ionicons
            name={option.icon}
            size={13}
            color={selected ? colors.white : colors.muted}
          />
        ) : null}
        <Text style={[styles.label, selected && styles.labelSelected]}>
          {option.label}
        </Text>
        {typeof option.count === 'number' ? (
          <View style={[styles.count, selected && styles.countSelected]}>
            <Text
              style={[
                styles.countText,
                selected ? styles.countTextSelected : null,
              ]}
            >
              {option.count}
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  });

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollRow, style]}
      >
        {content}
      </ScrollView>
    );
  }

  return <View style={[styles.row, styles.wrap, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 7,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  scrollRow: {
    flexDirection: 'row',
    gap: 7,
    paddingRight: 20,
  },
  pill: {
    minHeight: 33,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillIdle: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
  },
  pillSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.muted,
  },
  labelSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  count: {
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: 5,
    backgroundColor: colors.canvasDeep,
  },
  countSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  countText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    color: colors.muted,
  },
  countTextSelected: {
    color: colors.white,
  },
});
