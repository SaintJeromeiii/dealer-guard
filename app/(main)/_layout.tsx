import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';

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
            options={({ navigation }) => ({
              headerShown: true,
              title: 'About & Legal',
              headerStyle: { backgroundColor: SHIELD_THEME.bg },
              headerTintColor: SHIELD_THEME.text,
              headerTitleStyle: { fontWeight: '800' },
              headerLeft: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {navigation.canGoBack() ? (
                    <TouchableOpacity
                      onPress={() => navigation.goBack()}
                      accessibilityLabel="Go back"
                      accessibilityRole="button"
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="chevron-back" size={26} color={SHIELD_THEME.text} />
                    </TouchableOpacity>
                  ) : null}
                  <DrawerMenuButton />
                </View>
              ),
            })}
          />
          <Stack.Screen name="analyzer" />
        </Stack>
        <DealShieldDrawerOverlay />
      </View>
    </DealShieldBridgeProvider>
  );
}
