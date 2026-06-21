import DealShieldApp from '@/screens/DealShieldApp';
import { setMockRevenueCatValidation } from '@/utils/billing-config';

/** Dev-only full billing bypass. Must stay false for Play store builds (`npm run check:release`). */
const MOCK_REVENUECAT_VALIDATION = false;

setMockRevenueCatValidation(MOCK_REVENUECAT_VALIDATION);

export { MOCK_REVENUECAT_VALIDATION };

export default function MainAppScreen() {
  return <DealShieldApp />;
}
