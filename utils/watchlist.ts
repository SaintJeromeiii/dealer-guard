import type { WatchedVehicle } from './types.ts';

export const MAX_WATCHED_VEHICLES = 8;

export type ListingFieldConfidence = 'high' | 'medium';

export type ListingFieldReview = {
  field: string;
  value: string;
  confidence: ListingFieldConfidence;
};

export type ListingImportResult = {
  rawText: string;
  photoUri: string;
  sourceLabel: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  title: string;
  askingPrice: string;
  cityOrCounty: string;
  stateCode: string;
  milesAway: string;
  mileage: string;
  dealerOrSeller: string;
  fieldReviews: ListingFieldReview[];
  reviewNotes: string[];
};

export type WatchlistLocationGroup = {
  location: string;
  count: number;
  averagePrice: number | null;
  nearestMiles: number | null;
  vehicles: WatchedVehicle[];
};

export type WatchlistAnalysis = {
  count: number;
  withPrice: WatchedVehicle[];
  sortedByPrice: WatchedVehicle[];
  sortedByDistance: WatchedVehicle[];
  cheapest: WatchedVehicle | null;
  mostExpensive: WatchedVehicle | null;
  nearest: WatchedVehicle | null;
  priceSpread: number | null;
  averagePrice: number | null;
  byLocation: WatchlistLocationGroup[];
  vsBudget: Array<{ vehicle: WatchedVehicle; gap: number }>;
};

function cleanMoney(raw: string) {
  const digits = raw.replace(/[^\d.]/g, '');
  if (!digits) return '';
  const num = Number(digits);
  if (!Number.isFinite(num) || num <= 0) return '';
  return String(Math.round(num));
}

function cleanMileage(raw: string) {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  const num = Number(digits);
  if (!Number.isFinite(num) || num < 0) return '';
  return String(num);
}

function cleanMilesAway(raw: string) {
  const digits = raw.replace(/[^\d.]/g, '');
  if (!digits) return '';
  const num = Number(digits);
  if (!Number.isFinite(num) || num < 0) return '';
  return String(Math.round(num));
}

function cleanStateCode(raw: string) {
  const code = raw.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : '';
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function buildTitle(parts: { year: string; make: string; model: string; trim: string }) {
  return [parts.year, parts.make, parts.model, parts.trim].filter(Boolean).join(' ').trim();
}

export function displayWatchedVehicleTitle(vehicle: WatchedVehicle) {
  const composed = buildTitle(vehicle);
  return composed || vehicle.title.trim() || 'Untitled vehicle';
}

export function displayWatchedVehicleLocation(vehicle: Pick<WatchedVehicle, 'cityOrCounty' | 'stateCode' | 'milesAway'>) {
  const place = [vehicle.cityOrCounty.trim(), vehicle.stateCode.trim()].filter(Boolean).join(', ');
  const miles = vehicle.milesAway.trim();
  if (place && miles) return `${place} · ${miles} mi away`;
  if (place) return place;
  if (miles) return `${miles} mi away`;
  return '';
}

export function parseWatchedPrice(value: string) {
  const cleaned = cleanMoney(value);
  return cleaned ? Number(cleaned) : null;
}

export function parseMilesAway(value: string) {
  const cleaned = cleanMilesAway(value);
  return cleaned ? Number(cleaned) : null;
}

export function importListingText(rawText: string, photoUri = '', sourceLabel = 'listing OCR'): ListingImportResult {
  const text = rawText.replace(/\r/g, '\n');
  const compact = text.replace(/[ \t]+/g, ' ');
  const reviewNotes: string[] = [];
  const fieldReviews: ListingFieldReview[] = [];

  const yearMakeModel =
    compact.match(/\b((?:19|20)\d{2})\s+([A-Za-z][A-Za-z0-9\-]+)\s+([A-Za-z0-9][A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+){0,2})/i) ||
    null;

  const year = yearMakeModel?.[1] ?? firstMatch(compact, [/\b((?:19|20)\d{2})\b/]);
  const make = yearMakeModel?.[2] ?? '';
  let model = '';
  let trim = '';
  if (yearMakeModel?.[3]) {
    const pieces = yearMakeModel[3].split(/\s+/).filter(Boolean);
    model = pieces[0] ?? '';
    trim = pieces.slice(1).join(' ');
  }

  const priceRaw = firstMatch(compact, [
    /(?:price|asking|listed|sale\s*price|internet\s*price)[:\s]*\$?\s*([\d,]{3,7})/i,
    /\$\s*([\d,]{4,7})(?!\s*(?:mi|miles|\/mo|month))/i,
  ]);
  const askingPrice = cleanMoney(priceRaw);
  if (priceRaw && askingPrice && priceRaw.replace(/[^\d]/g, '') !== askingPrice) {
    reviewNotes.push(`Cleaned listing price "${priceRaw}" into ${askingPrice}.`);
  }

  const milesAwayRaw = firstMatch(compact, [
    /\(?\s*~?\s*([\d,]{1,4})\s*(?:mi|miles)\s*away\s*\)?/i,
    /(?:distance|away)[:\s]*~?\s*([\d,]{1,4})\s*(?:mi|miles)?/i,
  ]);
  const milesAway = cleanMilesAway(milesAwayRaw);

  const mileageRaw = firstMatch(compact, [
    /([\d,]{1,7})\s*(?:mi|miles)\b(?!\s*away)/i,
    /(?:mileage|odometer)[:\s]*([\d,]{1,7})/i,
  ]);
  let mileage = cleanMileage(mileageRaw);
  if (mileage && milesAway && mileage === milesAway) {
    // Prefer treating a single small "mi away" value as distance, not odometer.
    if (Number(mileage) < 500) mileage = '';
  }

  const countyMatch = compact.match(/\b([A-Z][a-zA-Z .'-]+)\s+County\b/i);
  const cityStateMatch =
    compact.match(/\b([A-Z][a-zA-Z .'-]+),\s*([A-Z]{2})(?:\s+\d{5})?\b/) ||
    compact.match(/(?:location|located\s+in|dealer\s+in)[:\s]*([A-Za-z .'-]+),\s*([A-Z]{2})/i);

  let cityOrCounty = '';
  let stateCode = '';
  if (countyMatch?.[1]) {
    cityOrCounty = `${countyMatch[1].trim()} County`;
  } else if (cityStateMatch?.[1]) {
    cityOrCounty = cityStateMatch[1].trim();
  }
  if (cityStateMatch?.[2]) {
    stateCode = cleanStateCode(cityStateMatch[2]);
  }
  if (!stateCode) {
    stateCode = cleanStateCode(firstMatch(compact, [/\b([A-Z]{2})\b(?=\s*(?:\(|$|\d{5}|·))/]));
  }

  const dealerOrSeller =
    firstMatch(compact, [
      /(?:dealer|dealership|seller|sold\s+by)[:\s]*([A-Za-z0-9 &.'-]{3,60})/i,
      /\b([A-Z][A-Za-z0-9 &.']{2,40}(?:\s+(?:Motors|Auto|Automotive|Cars|Chevrolet|Ford|Honda|Toyota|Group|Center))?)\b/,
    ]) || '';

  const title = buildTitle({ year, make, model, trim }) || firstMatch(compact, [/^([^\n]{8,80})/m]) || 'Watched vehicle';

  const pushReview = (field: string, value: string, confidence: ListingFieldConfidence) => {
    if (!value) return;
    fieldReviews.push({ field, value, confidence });
  };

  pushReview('Year', year, year ? 'high' : 'medium');
  pushReview('Make', make, make ? 'high' : 'medium');
  pushReview('Model', model, model ? 'medium' : 'medium');
  if (trim) pushReview('Trim', trim, 'medium');
  pushReview('Asking price', askingPrice, askingPrice ? (priceRaw.toLowerCase().includes('price') ? 'high' : 'medium') : 'medium');
  if (cityOrCounty) pushReview('City / county', cityOrCounty, /county$/i.test(cityOrCounty) ? 'high' : 'medium');
  if (stateCode) pushReview('State', stateCode, 'high');
  if (milesAway) pushReview('Miles away', milesAway, 'high');
  if (mileage) pushReview('Mileage', mileage, 'medium');
  if (dealerOrSeller) pushReview('Dealer / seller', dealerOrSeller, 'medium');

  if (!askingPrice) reviewNotes.push('Asking price was not clearly detected. Confirm or type it before saving.');
  if (!make || !model) reviewNotes.push('Make/model may need a quick confirmation from the listing photo.');
  if (!cityOrCounty && !stateCode) {
    reviewNotes.push('Location was not detected. Add city/county and state if you want location compare.');
  }
  if (!milesAway) reviewNotes.push('Distance (~miles away) was not detected. Add it if you want nearest-listing compare.');

  return {
    rawText: text.trim(),
    photoUri,
    sourceLabel,
    year,
    make,
    model,
    trim,
    title,
    askingPrice,
    cityOrCounty,
    stateCode,
    milesAway,
    mileage,
    dealerOrSeller,
    fieldReviews,
    reviewNotes,
  };
}

export function createBlankListingImport(photoUri = '', sourceLabel = 'manual entry'): ListingImportResult {
  return {
    rawText: '',
    photoUri,
    sourceLabel,
    year: '',
    make: '',
    model: '',
    trim: '',
    title: '',
    askingPrice: '',
    cityOrCounty: '',
    stateCode: '',
    milesAway: '',
    mileage: '',
    dealerOrSeller: '',
    fieldReviews: [],
    reviewNotes: [
      photoUri
        ? 'Enter the listing details manually. The photo will still be saved with this vehicle.'
        : 'Enter the listing details manually. You can add a photo later by saving another listing from a photo.',
    ],
  };
}

export function createWatchedVehicleFromImport(
  draft: ListingImportResult,
  overrides: Partial<WatchedVehicle> = {},
  idFactory: () => string = () => `watch-${Date.now()}`
): WatchedVehicle {
  const year = overrides.year ?? draft.year;
  const make = overrides.make ?? draft.make;
  const model = overrides.model ?? draft.model;
  const trim = overrides.trim ?? draft.trim;
  const composedTitle = buildTitle({ year, make, model, trim });
  const title = overrides.title ?? (composedTitle || draft.title);

  return {
    id: overrides.id ?? idFactory(),
    savedAt: overrides.savedAt ?? new Date().toISOString(),
    photoUri: overrides.photoUri ?? draft.photoUri,
    rawOcrText: overrides.rawOcrText ?? draft.rawText,
    year,
    make,
    model,
    trim,
    title,
    askingPrice: overrides.askingPrice ?? draft.askingPrice,
    cityOrCounty: overrides.cityOrCounty ?? draft.cityOrCounty,
    stateCode: cleanStateCode(overrides.stateCode ?? draft.stateCode),
    milesAway: overrides.milesAway ?? draft.milesAway,
    mileage: overrides.mileage ?? draft.mileage,
    dealerOrSeller: overrides.dealerOrSeller ?? draft.dealerOrSeller,
    listingUrl: overrides.listingUrl ?? '',
    notes: overrides.notes ?? '',
  };
}

export function buildWatchlistAnalysis(vehicles: WatchedVehicle[], budgetTarget = ''): WatchlistAnalysis {
  const withPrice = vehicles
    .map((vehicle) => ({ vehicle, price: parseWatchedPrice(vehicle.askingPrice) }))
    .filter((item): item is { vehicle: WatchedVehicle; price: number } => item.price != null)
    .sort((a, b) => a.price - b.price);

  const sortedByPrice = withPrice.map((item) => item.vehicle);
  const cheapest = sortedByPrice[0] ?? null;
  const mostExpensive = sortedByPrice[sortedByPrice.length - 1] ?? null;
  const prices = withPrice.map((item) => item.price);
  const averagePrice = prices.length ? Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length) : null;
  const priceSpread = prices.length >= 2 ? prices[prices.length - 1]! - prices[0]! : null;

  const withDistance = vehicles
    .map((vehicle) => ({ vehicle, miles: parseMilesAway(vehicle.milesAway) }))
    .filter((item): item is { vehicle: WatchedVehicle; miles: number } => item.miles != null)
    .sort((a, b) => a.miles - b.miles);
  const sortedByDistance = withDistance.map((item) => item.vehicle);
  const nearest = sortedByDistance[0] ?? null;

  const locationMap = new Map<string, WatchedVehicle[]>();
  vehicles.forEach((vehicle) => {
    const region = [vehicle.cityOrCounty.trim(), vehicle.stateCode.trim()].filter(Boolean).join(', ') || 'Unknown location';
    const list = locationMap.get(region) ?? [];
    list.push(vehicle);
    locationMap.set(region, list);
  });

  const byLocation: WatchlistLocationGroup[] = Array.from(locationMap.entries())
    .map(([location, group]) => {
      const groupPrices = group.map((item) => parseWatchedPrice(item.askingPrice)).filter((value): value is number => value != null);
      const groupMiles = group.map((item) => parseMilesAway(item.milesAway)).filter((value): value is number => value != null);
      return {
        location,
        count: group.length,
        averagePrice: groupPrices.length
          ? Math.round(groupPrices.reduce((sum, value) => sum + value, 0) / groupPrices.length)
          : null,
        nearestMiles: groupMiles.length ? Math.min(...groupMiles) : null,
        vehicles: group,
      };
    })
    .sort((a, b) => {
      if (a.nearestMiles != null && b.nearestMiles != null && a.nearestMiles !== b.nearestMiles) {
        return a.nearestMiles - b.nearestMiles;
      }
      return b.count - a.count || a.location.localeCompare(b.location);
    });

  const budget = parseWatchedPrice(budgetTarget);
  const vsBudget =
    budget == null
      ? []
      : withPrice.map(({ vehicle, price }) => ({
          vehicle,
          gap: price - budget,
        }));

  return {
    count: vehicles.length,
    withPrice: sortedByPrice,
    sortedByPrice,
    sortedByDistance,
    cheapest,
    mostExpensive,
    nearest,
    priceSpread,
    averagePrice,
    byLocation,
    vsBudget,
  };
}
