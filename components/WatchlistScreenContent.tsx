import React from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import EmptyStateGuide from '@/components/EmptyStateGuide';
import OcrConfirmChips from '@/components/OcrConfirmChips';
import StatusBadge from '@/components/StatusBadge';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';
import { currency } from '@/utils/finance';
import type { WatchedVehicle } from '@/utils/types';
import {
  MAX_WATCHED_VEHICLES,
  buildWatchlistAnalysis,
  displayWatchedVehicleLocation,
  displayWatchedVehicleTitle,
  parseWatchedPrice,
  type ListingImportResult,
} from '@/utils/watchlist';

type WatchlistScreenContentProps = {
  vehicles: WatchedVehicle[];
  budgetTarget: string;
  pendingImport: ListingImportResult | null;
  editableFields: Record<string, string>;
  confirmedFields: Record<string, boolean>;
  pendingPhotoUri: string;
  ocrBusy: boolean;
  onGoHome: () => void;
  onChangeEditableField: (field: string, value: string) => void;
  onToggleConfirm: (field: string) => void;
  onPickCamera: () => void;
  onPickLibrary: () => void;
  onStartManual: () => void;
  onRunOcr: () => void;
  onSavePending: () => void;
  onDismissPending: () => void;
  onDeleteVehicle: (id: string) => void;
  onUsePriceInDealReview: (vehicle: WatchedVehicle) => void;
};

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={SHIELD_THEME.textMuted}
      />
    </View>
  );
}

export default function WatchlistScreenContent({
  vehicles,
  budgetTarget,
  pendingImport,
  editableFields,
  confirmedFields,
  pendingPhotoUri,
  ocrBusy,
  onGoHome,
  onChangeEditableField,
  onToggleConfirm,
  onPickCamera,
  onPickLibrary,
  onStartManual,
  onRunOcr,
  onSavePending,
  onDismissPending,
  onDeleteVehicle,
  onUsePriceInDealReview,
}: WatchlistScreenContentProps) {
  const analysis = buildWatchlistAnalysis(vehicles, budgetTarget);
  const atCap = vehicles.length >= MAX_WATCHED_VEHICLES;
  const isManualDraft = pendingImport?.sourceLabel.toLowerCase().includes('manual') ?? false;

  return (
    <>
      <View style={styles.rowBetween}>
        <Text style={styles.screenTitle}>Vehicles I&apos;m watching</Text>
        <TouchableOpacity onPress={onGoHome}>
          <Text style={styles.linkText}>Back</Text>
        </TouchableOpacity>
      </View>

      <Card>
        <Text style={styles.menuTitle}>Save a listing</Text>
        <Text style={styles.detailText}>
          Snap or import an Autotrader-style ad for OCR, or enter the details yourself. You can always edit fields before saving.
        </Text>
        {atCap ? (
          <Text style={styles.warnText}>Watchlist is full ({MAX_WATCHED_VEHICLES}). Delete one to add another.</Text>
        ) : (
          <View style={styles.buttonRow}>
            <AppButton label="Take photo" onPress={onPickCamera} disabled={ocrBusy} />
            <AppButton label="Choose photo" variant="secondary" onPress={onPickLibrary} disabled={ocrBusy} />
            <AppButton label="Enter details manually" variant="secondary" onPress={onStartManual} disabled={ocrBusy} />
          </View>
        )}
        {pendingPhotoUri && !pendingImport ? (
          <View style={styles.stackGapSmall}>
            <Image source={{ uri: pendingPhotoUri }} style={styles.preview} resizeMode="cover" />
            <AppButton label={ocrBusy ? 'Reading listing...' : 'Run OCR from photo'} onPress={onRunOcr} disabled={ocrBusy} />
            <AppButton label="Enter details manually instead" variant="secondary" onPress={onStartManual} disabled={ocrBusy} />
          </View>
        ) : null}
      </Card>

      {pendingImport ? (
        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.menuTitle}>{isManualDraft ? 'Enter listing details' : 'Confirm listing details'}</Text>
            <StatusBadge label={isManualDraft ? 'Manual' : 'Review'} tone="warn" />
          </View>
          {pendingImport.photoUri ? (
            <Image source={{ uri: pendingImport.photoUri }} style={styles.preview} resizeMode="cover" />
          ) : null}
          {pendingImport.reviewNotes.map((note) => (
            <Text key={note} style={styles.infoBoxText}>
              • {note}
            </Text>
          ))}
          <OcrConfirmChips
            fields={pendingImport.fieldReviews.map((item) => ({
              field: item.field,
              value: item.value,
              confidence: item.confidence,
            }))}
            confirmedFields={confirmedFields}
            onToggleConfirm={onToggleConfirm}
          />
          <FieldInput
            label="Year"
            value={editableFields.Year ?? pendingImport.year}
            onChangeText={(text) => onChangeEditableField('Year', text)}
            placeholder="2021"
          />
          <FieldInput
            label="Make"
            value={editableFields.Make ?? pendingImport.make}
            onChangeText={(text) => onChangeEditableField('Make', text)}
            placeholder="Honda"
          />
          <FieldInput
            label="Model"
            value={editableFields.Model ?? pendingImport.model}
            onChangeText={(text) => onChangeEditableField('Model', text)}
            placeholder="Civic"
          />
          <FieldInput
            label="Trim"
            value={editableFields.Trim ?? pendingImport.trim}
            onChangeText={(text) => onChangeEditableField('Trim', text)}
            placeholder="EX"
          />
          <FieldInput
            label="Asking price"
            value={editableFields['Asking price'] ?? pendingImport.askingPrice}
            onChangeText={(text) => onChangeEditableField('Asking price', text)}
            placeholder="18995"
          />
          <FieldInput
            label="City / county"
            value={editableFields['City / county'] ?? pendingImport.cityOrCounty}
            onChangeText={(text) => onChangeEditableField('City / county', text)}
            placeholder="Wayne County"
          />
          <FieldInput
            label="State"
            value={editableFields.State ?? pendingImport.stateCode}
            onChangeText={(text) => onChangeEditableField('State', text)}
            placeholder="MI"
          />
          <FieldInput
            label="Miles away"
            value={editableFields['Miles away'] ?? pendingImport.milesAway}
            onChangeText={(text) => onChangeEditableField('Miles away', text)}
            placeholder="23"
          />
          <FieldInput
            label="Mileage"
            value={editableFields.Mileage ?? pendingImport.mileage}
            onChangeText={(text) => onChangeEditableField('Mileage', text)}
            placeholder="42150"
          />
          <FieldInput
            label="Dealer / seller"
            value={editableFields['Dealer / seller'] ?? pendingImport.dealerOrSeller}
            onChangeText={(text) => onChangeEditableField('Dealer / seller', text)}
            placeholder="Lakeside Honda"
          />
          <FieldInput
            label="Notes"
            value={editableFields.Notes ?? ''}
            onChangeText={(text) => onChangeEditableField('Notes', text)}
            placeholder="Clean title, one owner..."
          />
          <View style={styles.buttonRow}>
            <AppButton label="Save to watchlist" onPress={onSavePending} />
            <AppButton label="Dismiss" variant="secondary" onPress={onDismissPending} />
          </View>
        </Card>
      ) : null}

      {vehicles.length === 0 && !pendingImport ? (
        <EmptyStateGuide
          title="Build a short car shortlist"
          detail="Save a few listings you like, then compare asking prices and locations before you visit a dealership."
          exampleTitle="Example listing capture"
          exampleLines={['2021 Honda Civic EX · $18,995', 'Detroit, MI · 42,150 miles', 'Photo optional — you can type details manually']}
          primaryLabel="Take listing photo"
          onPrimary={onPickCamera}
          secondaryLabel="Enter details manually"
          onSecondary={onStartManual}
        />
      ) : null}

      {vehicles.length > 0 ? (
        <>
          <Card>
            <Text style={styles.menuTitle}>Price & location snapshot</Text>
            <Text style={styles.detailText}>
              {analysis.count} watched · {analysis.withPrice.length} with prices
              {analysis.averagePrice != null ? ` · avg ${currency(analysis.averagePrice)}` : ''}
            </Text>
            {analysis.cheapest ? (
              <Text style={styles.infoBoxText}>
                Lowest: {displayWatchedVehicleTitle(analysis.cheapest)} · {currency(analysis.cheapest.askingPrice)}
              </Text>
            ) : null}
            {analysis.mostExpensive && analysis.mostExpensive.id !== analysis.cheapest?.id ? (
              <Text style={styles.infoBoxText}>
                Highest: {displayWatchedVehicleTitle(analysis.mostExpensive)} · {currency(analysis.mostExpensive.askingPrice)}
              </Text>
            ) : null}
            {analysis.priceSpread != null ? (
              <Text style={styles.infoBoxText}>Spread between lowest and highest: {currency(analysis.priceSpread)}</Text>
            ) : null}
            {analysis.nearest ? (
              <Text style={styles.infoBoxText}>
                Nearest: {displayWatchedVehicleTitle(analysis.nearest)} · {displayWatchedVehicleLocation(analysis.nearest) || `${analysis.nearest.milesAway} mi away`}
              </Text>
            ) : null}
            {budgetTarget.trim() ? (
              <View style={styles.stackGapSmall}>
                <Text style={styles.bold}>Vs your target total ({currency(budgetTarget)})</Text>
                {analysis.vsBudget.map(({ vehicle, gap }) => (
                  <Text key={vehicle.id} style={styles.infoBoxText}>
                    {displayWatchedVehicleTitle(vehicle)}: {gap === 0 ? 'on target' : gap > 0 ? `${currency(gap)} over` : `${currency(Math.abs(gap))} under`}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.meta}>Set a target total paid in Budget to compare listings against your cap.</Text>
            )}
            {analysis.byLocation.length > 0 ? (
              <View style={styles.stackGapSmall}>
                <Text style={styles.bold}>By city / county &amp; state</Text>
                {analysis.byLocation.map((group) => (
                  <Text key={group.location} style={styles.infoBoxText}>
                    {group.location}: {group.count} listing{group.count === 1 ? '' : 's'}
                    {group.averagePrice != null ? ` · avg ${currency(group.averagePrice)}` : ''}
                    {group.nearestMiles != null ? ` · from ${group.nearestMiles} mi` : ''}
                  </Text>
                ))}
              </View>
            ) : null}
          </Card>

          {analysis.sortedByPrice.map((vehicle) => {
            const price = parseWatchedPrice(vehicle.askingPrice);
            return (
              <Card key={vehicle.id}>
                <View style={styles.rowBetween}>
                  <Text style={styles.menuTitle}>{displayWatchedVehicleTitle(vehicle)}</Text>
                  <StatusBadge label={price != null ? currency(price) : 'No price'} tone={price != null ? 'good' : 'warn'} />
                </View>
                {vehicle.photoUri ? <Image source={{ uri: vehicle.photoUri }} style={styles.preview} resizeMode="cover" /> : null}
                {displayWatchedVehicleLocation(vehicle) ? (
                  <Text style={styles.detailText}>{displayWatchedVehicleLocation(vehicle)}</Text>
                ) : null}
                {vehicle.mileage ? <Text style={styles.detailText}>{Number(vehicle.mileage).toLocaleString()} miles</Text> : null}
                {vehicle.dealerOrSeller ? <Text style={styles.detailText}>{vehicle.dealerOrSeller}</Text> : null}
                {vehicle.notes ? <Text style={styles.meta}>{vehicle.notes}</Text> : null}
                <View style={styles.buttonRow}>
                  <AppButton label="Use price in deal review" variant="secondary" onPress={() => onUsePriceInDealReview(vehicle)} />
                  <AppButton label="Remove" variant="danger" onPress={() => onDeleteVehicle(vehicle.id)} />
                </View>
              </Card>
            );
          })}

          {vehicles
            .filter((vehicle) => !analysis.sortedByPrice.some((priced) => priced.id === vehicle.id))
            .map((vehicle) => (
              <Card key={vehicle.id}>
                <View style={styles.rowBetween}>
                  <Text style={styles.menuTitle}>{displayWatchedVehicleTitle(vehicle)}</Text>
                  <StatusBadge label="No price" tone="warn" />
                </View>
                {vehicle.photoUri ? <Image source={{ uri: vehicle.photoUri }} style={styles.preview} resizeMode="cover" /> : null}
                {displayWatchedVehicleLocation(vehicle) ? (
                  <Text style={styles.detailText}>{displayWatchedVehicleLocation(vehicle)}</Text>
                ) : null}
                <View style={styles.buttonRow}>
                  <AppButton label="Remove" variant="danger" onPress={() => onDeleteVehicle(vehicle.id)} />
                </View>
              </Card>
            ))}
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  screenTitle: {
    color: SHIELD_THEME.text,
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
  },
  linkText: {
    color: SHIELD_THEME.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  menuTitle: {
    color: SHIELD_THEME.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  detailText: {
    color: SHIELD_THEME.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  meta: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  warnText: {
    color: SHIELD_THEME.warnText,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  infoBoxText: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  bold: {
    color: SHIELD_THEME.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },
  buttonRow: {
    gap: 10,
    marginTop: 10,
  },
  stackGapSmall: {
    gap: 8,
    marginTop: 10,
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: SHIELD_THEME.surfaceInset,
  },
  field: {
    marginTop: 8,
    gap: 6,
  },
  fieldLabel: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    ...SHIELD_SURFACE.inset,
    color: SHIELD_THEME.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
