import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { SHIELD_THEME } from '@/constants/shield-theme';
import { MATH_DISCLAIMER } from '@/utils/product-content';

export default function MathDisclaimer() {
  return <Text style={styles.text}>{MATH_DISCLAIMER}</Text>;
}

const styles = StyleSheet.create({
  text: {
    color: SHIELD_THEME.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
