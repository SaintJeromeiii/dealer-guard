import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';

type FirstRunWalkthroughProps = {
  onSetNumber: () => void;
  onSkip: () => void;
};

export default function FirstRunWalkthrough({ onSetNumber, onSkip }: FirstRunWalkthroughProps) {
  return (
    <View style={styles.stack}>
      <Card>
        <Text style={styles.eyebrow}>BEFORE YOU START</Text>
        <Text style={styles.title}>They will try to sell you the monthly payment.</Text>
        <Text style={styles.detail}>
          Stretch the loan, bury the fees, and the payment still “fits.” You don’t find out you overpaid until you’re
          stuck with the car.
        </Text>
        <Text style={styles.detail}>
          A walk-away number is the most you’ll pay, all-in — car, tax, fees, and interest. Pick it before anyone is
          watching. If their written total is over that number, you leave or they cut it.
        </Text>
        <Text style={styles.punch}>You are not negotiating the payment. You are protecting that ceiling.</Text>
      </Card>

      <Card>
        <Text style={styles.exampleLabel}>Example</Text>
        <View style={styles.exampleBox}>
          <Text style={styles.exampleBody}>
            They say $389 a month. That’s about $34,200 all-in. If your max is $32,000, that’s $2,200 too high. We’d give
            you the line: “Print the out-the-door number. I’m not buying the payment.”
          </Text>
        </View>
      </Card>

      <View style={styles.stackGap}>
        <AppButton label="Set my number" onPress={onSetNumber} />
        <AppButton label="Skip for now" variant="secondary" onPress={onSkip} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  stackGap: {
    gap: 10,
    marginTop: 4,
  },
  eyebrow: {
    color: SHIELD_THEME.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    color: SHIELD_THEME.text,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 12,
  },
  detail: {
    color: SHIELD_THEME.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  punch: {
    color: SHIELD_THEME.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  exampleLabel: {
    color: SHIELD_THEME.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  exampleBox: {
    ...SHIELD_SURFACE.inset,
    padding: 14,
  },
  exampleBody: {
    color: SHIELD_THEME.text,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
  },
});
