import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';

export default function DealershipDeniedScreen({ onSwitchToBuyer }: { onSwitchToBuyer: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.errorCode}>404</Text>
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorSubtitle}>Error: Dealership personnel detected in a strict consumer-protection zone.</Text>

        <Card>
          <Text style={styles.cardTitle}>Nice try, finance manager.</Text>
          <Text style={styles.cardText}>
            DealShield is a buyer-only bunker. We reverse-engineer payment tricks, audit junk fees, and hand the buyer talking points
            before anyone signs.
          </Text>
          <Text style={styles.cardText}>
            This app does not negotiate on behalf of the desk. Please return the phone to the person buying the car.
          </Text>
          <View style={styles.stackGap}>
            <AppButton label="I am actually the buyer" onPress={onSwitchToBuyer} />
          </View>
        </Card>

        <Text style={styles.footer}>DealShield • Hand the phone back • #BuyerSideOnly</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  errorCode: {
    color: '#f87171',
    fontSize: 72,
    fontWeight: '900',
    lineHeight: 76,
  },
  errorTitle: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
  },
  errorSubtitle: {
    color: '#fca5a5',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
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
    marginBottom: 10,
  },
  stackGap: {
    gap: 12,
    marginTop: 8,
  },
  footer: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
});
