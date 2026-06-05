const appJson = require('./app.json');

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
    },
  };
};
