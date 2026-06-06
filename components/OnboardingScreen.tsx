import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';

export default function OnboardingScreen({
  onSelectBuyer,
  onSelectDealership,
}: {
  onSelectBuyer: () => void;
  onSelectDealership: () => void;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>DEALSHIELD</Text>
          <Text style={styles.title}>Who is holding the phone?</Text>
          <Text style={styles.subtitle}>
            DealShield is built for car buyers. Tell us who you are before we open the protection tools.
          </Text>
          <StatusBadge label="Consumer protection zone" tone="good" />
        </View>

        <Card>
          <Text style={styles.cardTitle}>Are you a buyer or a dealership?</Text>
          <Text style={styles.cardText}>
            Your answer is saved on this device only. Buyers get full access to quote review, contract scanning, and tactic coaching.
          </Text>
          <View style={styles.stackGap}>
            <AppButton label="I am a buyer" onPress={onSelectBuyer} />
            <AppButton label="I work at a dealership" variant="secondary" onPress={onSelectDealership} />
          </View>
        </Card>

        <Text style={styles.footer}>No account required. No data leaves your phone.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 20,
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    lineHeight: 24,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardText: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  stackGap: {
    gap: 12,
  },
  footer: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
});
