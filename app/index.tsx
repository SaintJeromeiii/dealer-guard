import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OnboardingScreen from '@/components/OnboardingScreen';
import { getStoredUserRole, saveFirstRunProfile, saveUserRole } from '@/utils/onboarding';
import type { FirstRunProfile } from '@/utils/first-run';
import { getBottomTabPadding, getHeaderTopPadding } from '@/utils/safe-area';

export default function GateScreen() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const insets = useSafeAreaInsets();

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

  async function handleBuyer(profile: FirstRunProfile) {
    await saveFirstRunProfile(profile);
    await saveUserRole('buyer');
    router.replace('/(main)');
  }

  async function handleDealership() {
    await saveUserRole('dealership');
    router.replace('/access-denied');
  }

  if (loading || !showOnboarding) {
    return (
      <View
        style={[
          styles.loading,
          {
            paddingTop: getHeaderTopPadding(insets),
            paddingBottom: getBottomTabPadding(insets),
          },
        ]}
      >
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return <OnboardingScreen onComplete={(profile) => void handleBuyer(profile)} onSelectDealership={() => void handleDealership()} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0F19',
  },
});
