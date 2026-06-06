import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { SHIELD_THEME } from '@/constants/shield-theme';

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
      activeOpacity={0.88}
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
    borderRadius: SHIELD_THEME.radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: SHIELD_THEME.gold,
    shadowColor: SHIELD_THEME.gold,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  secondary: {
    backgroundColor: SHIELD_THEME.surface,
    borderWidth: 1,
    borderColor: SHIELD_THEME.border,
  },
  danger: {
    backgroundColor: SHIELD_THEME.dangerText,
  },
  disabled: {
    opacity: 0.45,
  },
  primaryText: {
    color: SHIELD_THEME.text,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  secondaryText: {
    color: SHIELD_THEME.text,
    fontWeight: '700',
    fontSize: 16,
  },
  dangerText: {
    color: SHIELD_THEME.text,
    fontWeight: '700',
    fontSize: 16,
  },
});
