import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

const colors = {
  activeBg: '#e8f0ff',
  activeBorder: '#bfd3ff',
  activeText: '#123a84',
  text: '#526581',
};

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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  active: {
    backgroundColor: colors.activeBg,
    borderColor: colors.activeBorder,
  },
  text: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '700',
  },
  activeText: {
    fontSize: 12,
    color: colors.activeText,
    fontWeight: '800',
  },
});
