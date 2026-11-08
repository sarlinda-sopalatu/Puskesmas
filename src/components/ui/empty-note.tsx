import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/core/navigation';
import { colors, radius, type } from '@/core/theme';

type EmptyNoteProps = {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyNote({
  icon = 'file-tray-outline',
  title,
  description,
  action,
}: EmptyNoteProps) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={21} color={colors.tealDeep} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 26,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
    backgroundColor: 'rgba(255, 253, 248, 0.5)',
    gap: 6,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
    marginBottom: 3,
  },
  title: {
    ...type.bodyStrong,
    textAlign: 'center',
  },
  description: {
    ...type.small,
    textAlign: 'center',
    maxWidth: 320,
  },
  action: {
    marginTop: 8,
    alignSelf: 'stretch',
  },
});
