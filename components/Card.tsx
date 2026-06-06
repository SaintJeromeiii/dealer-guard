import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SHIELD_SURFACE } from '@/constants/shield-theme';

export default function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    ...SHIELD_SURFACE.card,
    padding: 18,
    gap: 12,
  },
});
