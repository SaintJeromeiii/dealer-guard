import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import DealShieldDrawerContent from '@/components/navigation/DealShieldDrawerContent';
import { SHIELD_THEME } from '@/constants/shield-theme';
import { useDealShieldBridge } from '@/contexts/deal-shield-bridge';

const DRAWER_WIDTH = 300;

export default function DealShieldDrawerOverlay() {
  const { drawerOpen, closeDrawer } = useDealShieldBridge();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: drawerOpen ? 0 : -DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: drawerOpen ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdrop, drawerOpen, translateX]);

  return (
    <View pointerEvents={drawerOpen ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdrop,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} accessibilityLabel="Close menu" />
      </Animated.View>
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <DealShieldDrawerContent />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: SHIELD_THEME.bg,
    borderRightWidth: 1,
    borderRightColor: SHIELD_THEME.border,
  },
});
