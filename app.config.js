const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

function loadOptionalEnvFile(filename) {
  try {
    const fullPath = path.join(__dirname, filename);
    if (!fs.existsSync(fullPath)) return;

    const content = fs.readFileSync(fullPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key && process.env[key] == null) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing or unreadable local env files.
  }
}

loadOptionalEnvFile('.env.local');

/** @param {import('expo/config').ConfigContext} context */
module.exports = () => {
  const expo = appJson.expo;

  return {
    ...expo,
    slug: 'dealer-guard',
    extra: {
      ...expo.extra,
      revenueCatApiKeyAndroid:
        process.env.REVENUECAT_ANDROID_API_KEY ?? expo.extra.revenueCatApiKeyAndroid ?? '',
      revenueCatApiKeyIos: process.env.REVENUECAT_IOS_API_KEY ?? expo.extra.revenueCatApiKeyIos ?? '',
      revenueCatApiKey:
        process.env.REVENUECAT_ANDROID_API_KEY ??
        process.env.REVENUECAT_IOS_API_KEY ??
        expo.extra.revenueCatApiKey ??
        '',
      lotCoachApiUrl: process.env.LOT_COACH_API_URL ?? expo.extra.lotCoachApiUrl ?? '',
      lotCoachDevApiUrl: process.env.LOT_COACH_DEV_API_URL ?? expo.extra.lotCoachDevApiUrl ?? '',
      lotCoachApiSecret: process.env.LOT_COACH_API_SECRET ?? expo.extra.lotCoachApiSecret ?? '',
      lotCoachUseMock: process.env.LOT_COACH_USE_MOCK === 'true' || expo.extra.lotCoachUseMock === true,
    },
  };
};
