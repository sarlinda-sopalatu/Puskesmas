import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dockByRole } from '@/core/navigation';
import { colors, radius, shadow } from '@/core/theme';
import { useAuth } from '@/features/auth/auth-provider';

export function BottomDock() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  if (!user) return null;
  const items = dockByRole[user.role];
  const activeMatch = [...items]
    .sort((a, b) => b.match.length - a.match.length)
    .find(
      (item) => pathname === item.match || pathname.startsWith(`${item.match}/`),
    )?.match;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={styles.dock}>
        {items.map((item) => {
          const active = item.match === activeMatch;
          return (
            <Pressable
              key={item.match}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              onPress={() => {
                if (!active) router.replace(item.href);
              }}
              style={({ pressed }) => [styles.item, pressed && { opacity: 0.65 }]}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={active ? colors.tealDeep : colors.mutedSoft}
                />
              </View>
              <Text
                style={[styles.label, active && styles.labelActive]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  dock: {
    width: '100%',
    maxWidth: 560,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingHorizontal: 6,
    paddingVertical: 7,
    borderRadius: radius.xl + 2,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    ...shadow.dock,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 2,
    minWidth: 0,
  },
  iconWrap: {
    width: 38,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  iconWrapActive: {
    backgroundColor: colors.tealSoft,
  },
  label: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '600',
    letterSpacing: 0.15,
    color: colors.mutedSoft,
  },
  labelActive: {
    color: colors.ink,
    fontWeight: '800',
  },
});
