import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

const NOTCH_CLEARANCE = 8;
const TAB_BAR_CONTENT_HEIGHT = 56;

/** Extra clearance below the status bar / camera notch. */
export function getHeaderTopPadding(insets: EdgeInsets) {
  return (insets.top > 0 ? insets.top : 16) + NOTCH_CLEARANCE;
}

/** Padding above the Android 3-button nav bar or iOS home indicator. */
export function getBottomTabPadding(insets: EdgeInsets) {
  const padding = insets.bottom > 0 ? insets.bottom + 8 : 16;

  // Samsung edge-to-edge often reports 0 bottom inset while the nav bar still overlays UI.
  if (Platform.OS === 'android' && insets.bottom === 0) {
    return Math.max(padding, 48);
  }

  return padding;
}

/** Total tab bar wrapper height including system overlay padding. */
export function getBottomTabBarHeight(insets: EdgeInsets) {
  return TAB_BAR_CONTENT_HEIGHT + getBottomTabPadding(insets);
}

export function getScreenPadding(insets: EdgeInsets) {
  return {
    paddingTop: getHeaderTopPadding(insets),
    paddingBottom: getBottomTabPadding(insets),
  };
}
