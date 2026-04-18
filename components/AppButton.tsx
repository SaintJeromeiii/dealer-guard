import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger';

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'primary' ? styles.primary : null,
        variant === 'secondary' ? styles.secondary : null,
        variant === 'danger' ? styles.danger : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text
        style={
          variant === 'primary'
            ? styles.primaryText
            : variant === 'danger'
              ? styles.dangerText
              : styles.secondaryText
        }
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: '#0f172a',
  },
  secondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  danger: {
    backgroundColor: '#7f1d1d',
  },
  disabled: {
    opacity: 0.45,
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
  dangerText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});