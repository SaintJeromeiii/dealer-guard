import Constants from 'expo-constants';
import { Alert, Linking, Platform } from 'react-native';

type LegalExtra = {
  privacyPolicyUrl?: string;
  legalDisclaimerUrl?: string;
};

const LIVE_LEGAL_SITE_URL = 'https://saintjeromeiii.github.io/dealshield-legal/#disclaimer';
const LIVE_PRIVACY_POLICY_URL = 'https://saintjeromeiii.github.io/dealshield-legal/#privacy';

function getExtra(): LegalExtra {
  return (Constants.expoConfig?.extra ?? {}) as LegalExtra;
}

export function getPrivacyPolicyUrl() {
  const configured = getExtra().privacyPolicyUrl?.trim();
  return configured || LIVE_PRIVACY_POLICY_URL;
}

export function getLegalDisclaimerUrl() {
  const configured = getExtra().legalDisclaimerUrl?.trim();
  return configured || LIVE_LEGAL_SITE_URL;
}

export function getManageSubscriptionsUrl() {
  if (Platform.OS === 'ios') {
    return 'https://apps.apple.com/account/subscriptions';
  }

  if (Platform.OS === 'android') {
    return 'https://play.google.com/store/account/subscriptions';
  }

  return null;
}

export async function openExternalLink(url: string, label: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Link unavailable', `Could not open ${label} on this device.`);
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert('Link unavailable', `Could not open ${label} on this device.`);
  }
}
