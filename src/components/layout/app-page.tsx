import type { ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout } from '@/core/theme';
import { BottomDock } from './bottom-dock';
import { TopBar } from './top-bar';

type HeaderMode = 'brand' | 'back' | 'plain' | 'none';

type AppPageProps = {
  children: ReactNode;
  header?: HeaderMode;
  title?: string;
  eyebrow?: string;
  onBack?: () => void;
  headerRight?: ReactNode;
  dock?: boolean;
  footer?: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  background?: string;
  statusBar?: 'dark' | 'light';
};

export function AppPage({
  children,
  header = 'brand',
  title,
  eyebrow,
  onBack,
  headerRight,
  dock = false,
  footer,
  scroll = true,
  padded = true,
  contentStyle,
  background = colors.canvas,
  statusBar = 'dark',
}: AppPageProps) {
  const insets = useSafeAreaInsets();
  const bottomSpace = dock
    ? layout.dockSpace
    : footer
      ? 128
      : Math.max(insets.bottom, 20) + 16;

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: background }]}>
      <StatusBar style={statusBar} />
      {header !== 'none' ? (
        <TopBar
          variant={header}
          title={title}
          eyebrow={eyebrow}
          onBack={onBack}
          extra={header === 'brand' ? headerRight : undefined}
          right={header !== 'brand' ? headerRight : undefined}
        />
      ) : null}

      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            padded && styles.padded,
            { paddingBottom: bottomSpace },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.widthLimit}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.staticBody, padded && styles.padded, contentStyle]}>
          <View style={styles.widthLimit}>{children}</View>
        </View>
      )}

      {footer ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <View style={styles.widthLimit}>{footer}</View>
        </View>
      ) : null}

      {dock ? <BottomDock /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: layout.maxWidth + layout.pagePadding * 2,
    alignSelf: 'center',
  },
  padded: {
    paddingHorizontal: layout.pagePadding,
  },
  staticBody: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxWidth + layout.pagePadding * 2,
    alignSelf: 'center',
  },
  widthLimit: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.canvas,
    paddingHorizontal: layout.pagePadding,
    paddingTop: 12,
  },
});
