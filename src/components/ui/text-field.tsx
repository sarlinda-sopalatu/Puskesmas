import { useState, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, radius, type } from '@/core/theme';

type TextFieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  suffix?: string;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  right?: ReactNode;
};

export function TextField({
  label,
  hint,
  error,
  suffix,
  required = false,
  containerStyle,
  inputStyle,
  right,
  multiline,
  editable = true,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {label}
            {required ? <Text style={styles.required}> *</Text> : null}
          </Text>
        </View>
      ) : null}
      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
          error ? styles.fieldError : null,
          !editable && styles.fieldDisabled,
        ]}
      >
        <TextInput
          {...rest}
          multiline={multiline}
          editable={editable}
          placeholderTextColor={colors.muted}
          selectionColor={colors.teal}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            inputStyle,
            !editable && styles.inputDisabled,
          ]}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        {right}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...type.eyebrow,
    fontSize: 9,
    letterSpacing: 1.1,
    color: colors.inkMuted,
  },
  required: {
    color: colors.coralDeep,
  },
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.paperWarm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 13,
  },
  fieldMultiline: {
    minHeight: 98,
    alignItems: 'flex-start',
    paddingVertical: 11,
  },
  fieldFocused: {
    borderColor: colors.teal,
    backgroundColor: colors.tealTint,
  },
  fieldError: {
    borderColor: colors.red,
    backgroundColor: colors.redSoft,
  },
  fieldDisabled: {
    backgroundColor: colors.canvasDeep,
  },
  input: {
    flex: 1,
    ...type.body,
    fontSize: 14,
    paddingVertical: 0,
    minHeight: 44,
  },
  inputMultiline: {
    minHeight: 74,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  inputDisabled: {
    color: colors.muted,
  },
  suffix: {
    ...type.small,
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  hint: {
    ...type.small,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.muted,
  },
  error: {
    ...type.small,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.red,
  },
});
