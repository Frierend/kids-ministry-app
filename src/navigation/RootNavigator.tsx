import React, { useEffect, useState, useRef, useCallback } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { RootStackParamList } from '../types';
import { LockScreen } from '../screens/LockScreen';
import { SetupPinScreen } from '../screens/SetupPinScreen';
import { MainNavigator } from './MainNavigator';
import { securityService } from '../services/SecurityService';
import { runMigrations } from '../database/migrations';
import { Colors } from '../constants';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Lock');
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const appState = useRef(AppState.currentState);

  const checkLock = useCallback(async () => {
    try {
      const locked = await securityService.isLocked();
      if (locked && navigationRef.current) {
        const current = navigationRef.current.getCurrentRoute()?.name;
        if (current !== 'Lock' && current !== 'Setup') {
          navigationRef.current.navigate('Lock');
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Handle app foreground → check auto-lock
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        checkLock();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [checkLock]);

  useEffect(() => {
    (async () => {
      try {
        await runMigrations();
        const hasPin = await securityService.hasPin();
        if (!hasPin) {
          setInitialRoute('Setup');
        } else {
          const locked = await securityService.isLocked();
          setInitialRoute(locked ? 'Lock' : 'Main');
        }
      } catch (e) {
        console.error('Init error:', e);
        setInitialRoute('Setup');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator color={Colors.white} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Setup" component={SetupPinScreen} />
        <Stack.Screen name="Lock" component={LockScreen} />
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
