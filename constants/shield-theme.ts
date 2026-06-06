export const SHIELD_THEME = {
  bg: '#0B0F19',
  surface: '#161F30',
  surfaceInset: '#121A28',
  border: '#1E293B',
  text: '#FFFFFF',
  textMuted: '#94A3B8',
  gold: '#F59E0B',
  goldSoft: 'rgba(245, 158, 11, 0.12)',
  primary: '#3B82F6',
  primarySoft: 'rgba(59, 130, 246, 0.15)',
  successSoft: 'rgba(52, 211, 153, 0.15)',
  successText: '#34D399',
  warnSoft: 'rgba(245, 158, 11, 0.15)',
  warnText: '#F59E0B',
  dangerSoft: 'rgba(248, 113, 113, 0.15)',
  dangerText: '#F87171',
  shadow: '#000000',
  radius: 16,
  badgeLockedBg: '#1E293B',
  badgeLockedText: '#94A3B8',
} as const;

export const SHIELD_SURFACE = {
  card: {
    backgroundColor: SHIELD_THEME.surface,
    borderRadius: SHIELD_THEME.radius,
    borderWidth: 1,
    borderColor: SHIELD_THEME.border,
  },
  badgeCorner: {
    position: 'absolute' as const,
    top: 14,
    right: 14,
    zIndex: 1,
  },
  inset: {
    backgroundColor: SHIELD_THEME.surfaceInset,
    borderRadius: SHIELD_THEME.radius,
    borderWidth: 1,
    borderColor: SHIELD_THEME.border,
  },
} as const;
