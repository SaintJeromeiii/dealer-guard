import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import DealShieldDrawerContent from '@/components/navigation/DealShieldDrawerContent';
import { SHIELD_THEME } from '@/constants/shield-theme';
import { DealShieldBridgeProvider } from '@/contexts/deal-shield-bridge';

export default function MainLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DealShieldBridgeProvider>
        <Drawer
          drawerContent={(props) => <DealShieldDrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerStyle: {
              backgroundColor: SHIELD_THEME.bg,
              width: 300,
            },
            drawerActiveTintColor: SHIELD_THEME.gold,
            drawerInactiveTintColor: SHIELD_THEME.textMuted,
          }}
        >
          <Drawer.Screen name="index" options={{ drawerItemStyle: { display: 'none' }, title: 'DealShield' }} />
          <Drawer.Screen
            name="about-legal"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: true,
              title: 'About & Legal',
              headerStyle: { backgroundColor: SHIELD_THEME.bg },
              headerTintColor: SHIELD_THEME.text,
              headerTitleStyle: { fontWeight: '800' },
            }}
          />
          <Drawer.Screen name="analyzer" options={{ drawerItemStyle: { display: 'none' } }} />
        </Drawer>
      </DealShieldBridgeProvider>
    </GestureHandlerRootView>
  );
}
