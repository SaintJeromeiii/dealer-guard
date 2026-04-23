import React from 'react';
import { StyleSheet, View } from 'react-native';

const colors = {
  white: '#ffffff',
  border: '#d7e3f7',
  shadow: '#0b1f44',
};

export default function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 12,
  },
});
