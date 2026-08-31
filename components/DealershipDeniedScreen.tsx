import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import { SHIELD_THEME } from '@/constants/shield-theme';
import { getBottomTabPadding, getHeaderTopPadding } from '@/utils/safe-area';

export default function DealershipDeniedScreen({ onSwitchToBuyer }: { onSwitchToBuyer: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: getHeaderTopPadding(insets),
          paddingBottom: getBottomTabPadding(insets),
        },
      ]}
    >
      <View style={styles.container}>
        <Text style={styles.errorCode}>404</Text>
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorSubtitle}>Error: Dealership personnel detected in a strict consumer-protection zone.</Text>

        <Card>
          <Text style={styles.cardTitle}>Nice try, finance manager.</Text>
          <Text style={styles.cardText}>
            DealShield is only for the person buying the car. If you tapped this by mistake, switch back to buyer and we’ll open the protection tools.
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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SHIELD_THEME.bg,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  errorCode: {
    color: SHIELD_THEME.dangerText,
    fontSize: 72,
    fontWeight: '900',
    lineHeight: 76,
  },
  errorTitle: {
    color: SHIELD_THEME.text,
    fontSize: 30,
    fontWeight: '800',
  },
  errorSubtitle: {
    color: SHIELD_THEME.dangerText,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  cardTitle: {
    color: SHIELD_THEME.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardText: {
    color: SHIELD_THEME.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  stackGap: {
    gap: 12,
    marginTop: 8,
  },
  footer: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
