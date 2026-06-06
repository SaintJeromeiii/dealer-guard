import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SHIELD_THEME } from '@/constants/shield-theme';

export default function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, value))}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    backgroundColor: SHIELD_THEME.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: SHIELD_THEME.gold,
    borderRadius: 999,
  },
});
