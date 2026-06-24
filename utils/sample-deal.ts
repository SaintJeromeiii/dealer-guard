import { createInitialDeal } from './app-state.ts';
import { SAMPLE_QUOTE } from './product-content.ts';
import type { DealState, NegotiationFlag } from './types.ts';

export const SAMPLE_DEAL_BUYER_STATE = 'TX';

export const SAMPLE_DEAL_PRESSURE_FLAGS: NegotiationFlag[] = ['todayOnly', 'wontPrint'];

export const SAMPLE_DEAL_OFFER_NOTE =
  'Sample closed-test quote for Metro Auto Group. Use this to try Deal Calculator and Lot Coach without being at a dealership.';

export function buildSampleDealState(): DealState {
  return {
    ...createInitialDeal(),
    buyerStateCode: SAMPLE_DEAL_BUYER_STATE,
    dealershipName: SAMPLE_QUOTE.dealershipName,
    offerNotes: SAMPLE_DEAL_OFFER_NOTE,
    vehiclePrice: SAMPLE_QUOTE.vehiclePrice,
    salesTax: SAMPLE_QUOTE.salesTax,
    dealerFees: SAMPLE_QUOTE.dealerFees,
    addOns: SAMPLE_QUOTE.addOns,
    downPayment: SAMPLE_QUOTE.downPayment,
    tradeIn: SAMPLE_QUOTE.tradeIn,
    apr: SAMPLE_QUOTE.apr,
    months: SAMPLE_QUOTE.months,
    targetTotalPaid: '32000',
  };
}
