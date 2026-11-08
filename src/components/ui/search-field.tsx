import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, type } from '@/core/theme';

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
};

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Cari…',
  style,
  autoFocus = false,
}: SearchFieldProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search-outline" size={17} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        selectionColor={colors.teal}
        autoFocus={autoFocus}
        autoCapitalize="none"
        returnKeyType="search"
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hapus pencarian"
          hitSlop={10}
          onPress={() => onChangeText('')}
        >
          <Ionicons name="close-circle" size={17} color={colors.mutedSoft} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    ...type.body,
    fontSize: 13,
    paddingVertical: 0,
  },
});
