import { router } from 'expo-router';
import React from 'react';

import DealershipDeniedScreen from '@/components/DealershipDeniedScreen';
import { clearUserRole, saveUserRole } from '@/utils/onboarding';

export default function AccessDeniedScreen() {
  async function handleSwitchToBuyer() {
    await clearUserRole();
    await saveUserRole('buyer');
    router.replace('/(main)');
  }

  return <DealershipDeniedScreen onSwitchToBuyer={() => void handleSwitchToBuyer()} />;
}
