import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/core/theme';

export type UnderlineTab<T extends string> = {
  value: T;
  label: string;
  done?: boolean;
};

type UnderlineTabsProps<T extends string> = {
  tabs: readonly UnderlineTab<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  scroll?: boolean;
};

export function UnderlineTabs<T extends string>({
  tabs,
  value,
  onChange,
  style,
  scroll = true,
}: UnderlineTabsProps<T>) {
  const content = tabs.map((tab) => {
    const active = tab.value === value;
    return (
      <Pressable
        key={tab.value}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={() => onChange(tab.value)}
        style={({ pressed }) => [
          styles.tab,
          active && styles.tabActive,
          pressed && { opacity: 0.65 },
        ]}
      >
        <View style={styles.labelRow}>
          {tab.done ? <View style={styles.doneDot} /> : null}
          <Text style={[styles.label, active && styles.labelActive]}>
            {tab.label}
          </Text>
        </View>
      </Pressable>
    );
  });

  if (scroll) {
    return (
      <View style={[styles.wrap, style]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {content}
        </ScrollView>
      </View>
    );
  }

  return <View style={[styles.wrap, styles.row, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  row: {
    flexDirection: 'row',
    gap: 24,
  },
  tab: {
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: {
    borderBottomColor: colors.teal,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.muted,
  },
  labelActive: {
    color: colors.ink,
    fontWeight: '800',
  },
  doneDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.teal,
  },
});
