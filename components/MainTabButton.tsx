import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function MainTabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.tabButton, active ? styles.active : null]}>
      <Text style={active ? styles.activeText : styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: 14,
  },
  active: {
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  activeText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '800',
  },
});