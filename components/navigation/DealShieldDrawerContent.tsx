import { Ionicons } from '@expo/vector-icons';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SHIELD_THEME } from '@/constants/shield-theme';
import { useDealShieldBridge } from '@/contexts/deal-shield-bridge';
import {
  DEALSHIELD_DRAWER_ITEMS,
  handleDrawerItemPress,
  type DealShieldDrawerItem,
} from '@/components/navigation/deal-shield-nav-config';

const SECTION_LABELS: Record<NonNullable<DealShieldDrawerItem['section']>, string> = {
  primary: 'Core tools',
  tools: 'Buyer defense',
  account: 'Account',
};

export default function DealShieldDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bridge = useDealShieldBridge();

  const sections: DealShieldDrawerItem['section'][] = ['primary', 'tools', 'account'];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.brandBlock}>
        <Text style={styles.brandEyebrow}>DEALSHIELD</Text>
        <Text style={styles.brandTitle}>Buyer defense on the lot</Text>
        <Text style={styles.brandSubtitle}>Fast tools for calculators, coaching, and pressure logs.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.menu} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section} style={styles.section}>
            <Text style={styles.sectionLabel}>{SECTION_LABELS[section]}</Text>
            {DEALSHIELD_DRAWER_ITEMS.filter((item) => item.section === section).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                activeOpacity={0.85}
                onPress={() =>
                  handleDrawerItemPress(item, props, {
                    setBottomTab: bridge.setBottomTab,
                    navigate: bridge.navigate,
                    onRoute: (href) => router.push(href),
                  })
                }
              >
                <Ionicons name={item.icon} size={22} color={SHIELD_THEME.gold} style={styles.menuIcon} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={SHIELD_THEME.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SHIELD_THEME.bg,
  },
  brandBlock: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: SHIELD_THEME.border,
    gap: 4,
  },
  brandEyebrow: {
    color: SHIELD_THEME.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  brandTitle: {
    color: SHIELD_THEME.text,
    fontSize: 22,
    fontWeight: '800',
  },
  brandSubtitle: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  menu: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 18,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    color: SHIELD_THEME.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: SHIELD_THEME.radius,
    backgroundColor: SHIELD_THEME.surface,
    borderWidth: 1,
    borderColor: SHIELD_THEME.border,
  },
  menuIcon: {
    width: 24,
  },
  menuLabel: {
    flex: 1,
    color: SHIELD_THEME.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
