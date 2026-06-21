export const LOT_COACH_DEPLOYED_DEV_FALLBACK_URL =
  'https://dealshield-lot-coach.jleonanderson.workers.dev';

const WRANGLER_DEV_PORT = 8787;

export type LotCoachRuntimeConfig = {
  lotCoachApiUrl?: string;
  lotCoachDevApiUrl?: string;
  lotCoachApiSecret?: string;
  lotCoachUseMock?: boolean;
};

export function getLotCoachLocalDevApiUrl(platform = 'ios') {
  const host = platform === 'android' ? '10.0.2.2' : '127.0.0.1';
  return `http://${host}:${WRANGLER_DEV_PORT}`;
}

export function resolveLotCoachApiUrl(
  config: LotCoachRuntimeConfig,
  options: { devMode?: boolean; platform?: string } = {}
) {
  const configured = config.lotCoachApiUrl?.trim();
  if (configured) return configured;

  const devMode = options.devMode ?? false;
  if (!devMode) return '';

  const devOverride = config.lotCoachDevApiUrl?.trim();
  if (devOverride) return devOverride;

  const secret = config.lotCoachApiSecret?.trim();
  if (secret) return LOT_COACH_DEPLOYED_DEV_FALLBACK_URL;

  return getLotCoachLocalDevApiUrl(options.platform);
}
