import { Fragment } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/core/theme';

type ProgressRailProps = {
  steps: string[];
  current: number;
};

export function ProgressRail({ steps, current }: ProgressRailProps) {
  return (
    <View style={styles.container}>
      <View style={styles.trackArea}>
        <View style={styles.track} />
        <View style={styles.dots}>
          {steps.map((step, index) => {
            const done = index < current;
            const active = index === current;
            return (
              <Fragment key={step}>
                <View
                  style={[
                    styles.dot,
                    done && styles.dotDone,
                    active && styles.dotActive,
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={13} color={colors.tealDeep} />
                  ) : (
                    <Text
                      style={[
                        styles.dotNumber,
                        active && styles.dotNumberActive,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
              </Fragment>
            );
          })}
        </View>
      </View>
      <View style={styles.labels}>
        {steps.map((step, index) => (
          <Text
            key={step}
            style={[
              styles.label,
              index === current && styles.labelActive,
              index < current && styles.labelDone,
            ]}
            numberOfLines={2}
          >
            {step}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 7,
  },
  trackArea: {
    justifyContent: 'center',
    minHeight: 28,
  },
  track: {
    position: 'absolute',
    left: 15,
    right: 15,
    height: 1,
    backgroundColor: colors.line,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  dotDone: {
    backgroundColor: colors.tealSoft,
    borderColor: colors.tealSoft,
  },
  dotActive: {
    backgroundColor: colors.tealDeep,
    borderColor: colors.tealDeep,
  },
  dotNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.muted,
  },
  dotNumberActive: {
    color: colors.white,
  },
  labels: {
    flexDirection: 'row',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.mutedSoft,
  },
  labelActive: {
    color: colors.ink,
  },
  labelDone: {
    color: colors.tealDeep,
  },
});
