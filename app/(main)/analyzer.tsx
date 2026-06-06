import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import DealShieldApp from '@/screens/DealShieldApp';

function normalizeModeParam(mode: string | string[] | undefined): 'manual' | 'ocr' | undefined {
  const value = Array.isArray(mode) ? mode[0] : mode;
  if (value === 'ocr') return 'ocr';
  if (value === 'manual') return 'manual';
  return undefined;
}

export default function AnalyzerScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string | string[] }>();

  return <DealShieldApp entryAnalyzerMode={normalizeModeParam(mode)} />;
}
