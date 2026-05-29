# DealShield

DealShield is an Expo / React Native app for car buyers who want help preparing for dealership negotiations, reviewing financing offers, spotting pressure tactics, and comparing saved offers side by side.

## What the app does

- Runs a readiness check before the user visits a dealership
- Provides a dealership checklist and a trap library
- Analyzes vehicle price, fees, add-ons, APR, and term length
- Tracks live pressure tactics and converts them into a transparency score
- Saves multiple offers and compares them with a consistent scoring model
- Keeps state context attached to offers so fee reviews stay locally grounded

## Project structure

- [app/index.tsx](/Users/jeromeanderson/dealer-guard/app/index.tsx) contains the routed app shell and screen composition
- [data](/Users/jeromeanderson/dealer-guard/data) contains the static app content such as questions, traps, scripts, tactics, and state options
- [utils/deals.ts](/Users/jeromeanderson/dealer-guard/utils/deals.ts) contains the pure domain logic for scoring, fee detection, and offer comparisons
- [utils/app-state.ts](/Users/jeromeanderson/dealer-guard/utils/app-state.ts) defines the versioned persisted state shape and sanitizers
- [utils/storage.ts](/Users/jeromeanderson/dealer-guard/utils/storage.ts) handles AsyncStorage persistence and legacy migration
- [tests](/Users/jeromeanderson/dealer-guard/tests) contains pure Node-based tests for the finance, scoring, and persistence layers

## Commands

```bash
npm install
npm run start
npm run lint
npm run test
```

## Persistence model

The app stores a single versioned snapshot in AsyncStorage under `dealerGuard_state`. On first load it also reads the older per-key storage layout and migrates it forward into the sanitized snapshot shape.

## Design notes

- The deal-analysis logic is intentionally pure and testable so financial calculations and warning heuristics can be verified outside the UI.
- State context is used as a reminder to verify local fee expectations, not as a substitute for current legal advice or a state-specific compliance engine.
- Saved offers keep their own notes so shared summaries and later comparisons have more context.
