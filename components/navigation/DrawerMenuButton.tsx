import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { SHIELD_THEME } from '@/constants/shield-theme';
import { useDealShieldBridge } from '@/contexts/deal-shield-bridge';

export default function DrawerMenuButton() {
  const { openDrawer } = useDealShieldBridge();

  return (
    <TouchableOpacity onPress={openDrawer} style={styles.button} activeOpacity={0.85} accessibilityLabel="Open menu">
      <Ionicons name="menu" size={24} color={SHIELD_THEME.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
