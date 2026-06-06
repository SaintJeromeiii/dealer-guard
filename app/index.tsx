import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import OnboardingScreen from '@/components/OnboardingScreen';
import { getStoredUserRole, saveUserRole } from '@/utils/onboarding';

export default function GateScreen() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let active = true;

    getStoredUserRole()
      .then((role) => {
        if (!active) return;

        if (role === 'buyer') {
          router.replace('/(main)');
          return;
        }

        if (role === 'dealership') {
          router.replace('/access-denied');
          return;
        }

        setShowOnboarding(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleBuyer() {
    await saveUserRole('buyer');
    router.replace('/(main)');
  }

  async function handleDealership() {
    await saveUserRole('dealership');
    router.replace('/access-denied');
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loading} edges={['top', 'bottom', 'left', 'right']}>
        <ActivityIndicator size="large" color="#34d399" />
      </SafeAreaView>
    );
  }

  if (!showOnboarding) {
    return (
      <SafeAreaView style={styles.loading} edges={['top', 'bottom', 'left', 'right']}>
        <ActivityIndicator size="large" color="#34d399" />
      </SafeAreaView>
    );
  }

  return <OnboardingScreen onSelectBuyer={() => void handleBuyer()} onSelectDealership={() => void handleDealership()} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
});
