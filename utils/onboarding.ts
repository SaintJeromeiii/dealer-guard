import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'buyer' | 'dealership';

const ONBOARDING_ROLE_KEY = 'dealshield_onboarding_role';

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
