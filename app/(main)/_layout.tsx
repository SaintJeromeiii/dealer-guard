import { Stack } from 'expo-router';
import { View } from 'react-native';

import DrawerMenuButton from '@/components/navigation/DrawerMenuButton';
import DealShieldDrawerOverlay from '@/components/navigation/DealShieldDrawerOverlay';
import { SHIELD_THEME } from '@/constants/shield-theme';
import { DealShieldBridgeProvider } from '@/contexts/deal-shield-bridge';

export default function MainLayout() {
  return (
    <DealShieldBridgeProvider>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: SHIELD_THEME.bg },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="about-legal"
            options={{
              headerShown: true,
              title: 'About & Legal',
              headerStyle: { backgroundColor: SHIELD_THEME.bg },
              headerTintColor: SHIELD_THEME.text,
              headerTitleStyle: { fontWeight: '800' },
              headerLeft: () => <DrawerMenuButton />,
            }}
          />
          <Stack.Screen name="analyzer" />
        </Stack>
        <DealShieldDrawerOverlay />
      </View>
    </DealShieldBridgeProvider>
  );
}
