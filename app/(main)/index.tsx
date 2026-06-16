import DealShieldApp from '@/screens/DealShieldApp';
import { setMockRevenueCatValidation } from '@/utils/billing-config';

/**
 * TEMPORARY: set to `false` before a production Play release once the Google Play
 * service account is linked in RevenueCat and lifetime purchases validate live.
 */
const MOCK_REVENUECAT_VALIDATION = false;

setMockRevenueCatValidation(MOCK_REVENUECAT_VALIDATION);

export { MOCK_REVENUECAT_VALIDATION };

export default function MainAppScreen() {
  return <DealShieldApp />;
}
