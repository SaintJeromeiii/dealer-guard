import Constants from 'expo-constants';
import { Alert, Linking, Platform } from 'react-native';

type LegalExtra = {
  privacyPolicyUrl?: string;
  legalDisclaimerUrl?: string;
};

function getExtra(): LegalExtra {
  return (Constants.expoConfig?.extra ?? {}) as LegalExtra;
}

const DEFAULT_PRIVACY_POLICY_URL = 'https://github.com/SaintJeromeiii/dealer-guard/blob/main/docs/privacy-policy.md';
const DEFAULT_LEGAL_DISCLAIMER_URL = 'https://github.com/SaintJeromeiii/dealer-guard/blob/main/docs/legal-disclaimer.md';

export function getPrivacyPolicyUrl() {
  const configured = getExtra().privacyPolicyUrl?.trim();
  return configured || DEFAULT_PRIVACY_POLICY_URL;
}

export function getLegalDisclaimerUrl() {
  const configured = getExtra().legalDisclaimerUrl?.trim();
  return configured || DEFAULT_LEGAL_DISCLAIMER_URL;
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
