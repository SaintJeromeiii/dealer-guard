import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';

type EmptyStateGuideProps = {
  title: string;
  detail: string;
  exampleTitle?: string;
  exampleLines?: string[];
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export default function EmptyStateGuide({
  title,
  detail,
  exampleTitle,
  exampleLines,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: EmptyStateGuideProps) {
  return (
    <Card>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
      {exampleTitle && exampleLines && exampleLines.length > 0 ? (
        <View style={styles.exampleBox}>
          <Text style={styles.exampleTitle}>{exampleTitle}</Text>
          {exampleLines.map((line) => (
            <Text key={line} style={styles.exampleLine}>
              • {line}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.actions}>
        <AppButton label={primaryLabel} onPress={onPrimary} />
        {secondaryLabel && onSecondary ? (
          <AppButton label={secondaryLabel} variant="secondary" onPress={onSecondary} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: SHIELD_THEME.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  detail: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  exampleBox: {
    ...SHIELD_SURFACE.inset,
    padding: 12,
    gap: 4,
    marginBottom: 12,
  },
  exampleTitle: {
    color: SHIELD_THEME.gold,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  exampleLine: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    gap: 10,
  },
});
