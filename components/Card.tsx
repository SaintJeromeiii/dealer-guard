import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SHIELD_THEME } from '@/constants/shield-theme';

export default function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SHIELD_THEME.surface,
    borderRadius: SHIELD_THEME.radius,
    padding: 18,
    borderWidth: 1,
    borderColor: SHIELD_THEME.border,
    gap: 12,
  },
});
