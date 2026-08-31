import AsyncStorage from '@react-native-async-storage/async-storage';

import { isBuyerSituation, type FirstRunProfile } from './first-run.ts';

export type UserRole = 'buyer' | 'dealership';

export const ONBOARDING_ROLE_KEY = 'dealshield_onboarding_role';
export const FIRST_RUN_PROFILE_KEY = 'dealshield_first_run_profile';

export async function getStoredUserRole(): Promise<UserRole | null> {
  const value = await AsyncStorage.getItem(ONBOARDING_ROLE_KEY);
  if (value === 'buyer' || value === 'dealership') {
    return value;
  }
  return null;
}

export async function saveUserRole(role: UserRole) {
  await AsyncStorage.setItem(ONBOARDING_ROLE_KEY, role);
}

export async function clearUserRole() {
  await AsyncStorage.removeItem(ONBOARDING_ROLE_KEY);
}

export async function getFirstRunProfile(): Promise<FirstRunProfile | null> {
  const raw = await AsyncStorage.getItem(FIRST_RUN_PROFILE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<FirstRunProfile>;
    if (!isBuyerSituation(parsed.situation)) return null;
    return {
      situation: parsed.situation,
      isFirstTimeBuyer: parsed.isFirstTimeBuyer !== false,
    };
  } catch {
    return null;
  }
}

export async function saveFirstRunProfile(profile: FirstRunProfile) {
  await AsyncStorage.setItem(FIRST_RUN_PROFILE_KEY, JSON.stringify(profile));
}

export async function clearFirstRunProfile() {
  await AsyncStorage.removeItem(FIRST_RUN_PROFILE_KEY);
}
