import Constants from 'expo-constants';

const DEFAULT_CLOSED_BETA_FEEDBACK_URL =
  'https://github.com/SaintJeromeiii/dealer-guard/issues/new?title=DealShield%20closed%20test%20feedback&body=What%20I%20tested%3A%0A-%20%0AWhat%20confused%20me%3A%0A-%20%0ABugs%20or%20ideas%3A%0A-%20';

type FeedbackExtra = {
  closedBetaFeedbackUrl?: string;
};

function getExtra(): FeedbackExtra {
  return (Constants.expoConfig?.extra ?? {}) as FeedbackExtra;
}

export function getClosedBetaFeedbackUrl() {
  const configured = getExtra().closedBetaFeedbackUrl?.trim();
  return configured || DEFAULT_CLOSED_BETA_FEEDBACK_URL;
}
