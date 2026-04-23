import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger';

const colors = {
  primary: '#155eef',
  primaryDark: '#0f4bd6',
  secondaryBg: '#eef4ff',
  secondaryBorder: '#bfd3ff',
  secondaryText: '#123a84',
  danger: '#b42318',
  white: '#ffffff',
};

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
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondaryBg,
    borderWidth: 1,
    borderColor: colors.secondaryBorder,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.45,
  },
  primaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryText: {
    color: colors.secondaryText,
    fontWeight: '700',
    fontSize: 16,
  },
  dangerText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
