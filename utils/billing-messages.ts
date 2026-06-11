const ANDROID_PACKAGE_NAME = 'com.jleonanderson.signshield';

type PurchasesErrorLike = {
  message?: string;
  code?: string | number;
  readableErrorCode?: string;
  underlyingErrorMessage?: string;
  userCancelled?: boolean;
};

export function formatBillingError(error: unknown): string {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;

  const candidate =
    error instanceof Error
      ? (error as Error & PurchasesErrorLike)
      : typeof error === 'object'
        ? (error as PurchasesErrorLike)
        : null;

  if (!candidate) return String(error);

  const parts = [
    candidate.message,
    candidate.code !== undefined && candidate.code !== candidate.message ? `Code: ${candidate.code}` : null,
    candidate.readableErrorCode ? `Type: ${candidate.readableErrorCode}` : null,
    candidate.underlyingErrorMessage ? `Underlying: ${candidate.underlyingErrorMessage}` : null,
  ].filter((part): part is string => Boolean(part && part.trim()));

  if (parts.length > 0) return parts.join('\n');
  if (error instanceof Error) return error.message;
  return 'Unknown billing error';
}

export function buildBillingSetupHints(options: {
  productId: string;
  entitlementId: string;
  packageName?: string;
  offeringsLoaded?: boolean;
  revenueCatConfigured?: boolean;
  errorText?: string;
}): string[] {
  const packageName = options.packageName ?? ANDROID_PACKAGE_NAME;
  const hints: string[] = [];

  if (!options.revenueCatConfigured) {
    hints.push('Set REVENUECAT_ANDROID_API_KEY in EAS production env, then rebuild and reinstall from Play testing.');
  }

  if (!options.offeringsLoaded) {
    hints.push(`Google Play Console → Monetize → In-app products → create/activate one-time product "${options.productId}".`);
    hints.push(`RevenueCat → Entitlements → attach "${options.productId}" to entitlement "${options.entitlementId}".`);
    hints.push('After creating the product, allow up to 24 hours for Google Play to propagate it to test purchases.');
  }

  hints.push(`Install from Play internal/closed testing (${packageName}), not a sideloaded debug APK.`);
  hints.push('Play Console → Setup → License testing → add the Google account on this device.');
  hints.push('RevenueCat → Project settings → confirm Android package name and Play service account are connected.');

  if (options.errorText?.toLowerCase().includes('configuration')) {
    hints.push('Configuration errors usually mean the Play product is missing, inactive, or not linked in RevenueCat yet.');
  }

  return hints;
}

export function buildBillingChecklistNote(title: string, detail: string, hints: string[]) {
  return [title, detail, '', 'Setup checklist:', ...hints.map((hint) => `• ${hint}`)].join('\n');
}

export function getDefaultAndroidPackageName() {
  return ANDROID_PACKAGE_NAME;
}
