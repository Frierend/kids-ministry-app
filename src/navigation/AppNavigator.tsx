// src/navigation/AppNavigator.tsx
// Full navigation tree: RootStack → AuthGate → BottomTabNavigator → Stacks

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { Colors, Typography, Spacing, Layout } from '../theme';
import { securityService } from '../services/SecurityService';

// Screens
import LockScreen from '../screens/auth/LockScreen';
import HomeScreen from '../screens/home/HomeScreen';
import AttendanceHomeScreen from '../screens/attendance/AttendanceHomeScreen';
import SessionDetailScreen from '../screens/attendance/SessionDetailScreen';
import StudentListScreen from '../screens/students/StudentListScreen';
import StudentDetailScreen from '../screens/students/StudentDetailScreen';
import StudentAddScreen from '../screens/students/StudentAddScreen';
import PointsLedgerScreen, { AwardPointsScreen } from '../screens/students/PointsLedgerScreen';
import MarketHomeScreen from '../screens/market/MarketHomeScreen';
import SettingsHomeScreen from '../screens/settings/SettingsHomeScreen';
import MinistriesScreen from '../screens/settings/MinistriesScreen';
import MinistryAddScreen from '../screens/settings/MinistryAddScreen';
import SecuritySettingsScreen from '../screens/settings/SecuritySettingsScreen';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AttendanceStack = createNativeStackNavigator();
const StudentsStack = createNativeStackNavigator();
const MarketStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

// ── Stack Navigators ─────────────────────────────────────

function AttendanceNavigator() {
  return (
    <AttendanceStack.Navigator screenOptions={{ headerShown: false }}>
      <AttendanceStack.Screen name="AttendanceHome" component={AttendanceHomeScreen} />
      <AttendanceStack.Screen name="SessionDetail" component={SessionDetailScreen} />
    </AttendanceStack.Navigator>
  );
}

function StudentsNavigator() {
  return (
    <StudentsStack.Navigator screenOptions={{ headerShown: false }}>
      <StudentsStack.Screen name="StudentList" component={StudentListScreen} />
      <StudentsStack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <StudentsStack.Screen name="StudentAdd" component={StudentAddScreen} />
      <StudentsStack.Screen name="StudentEdit" component={StudentAddScreen} />
      <StudentsStack.Screen name="PointsLedger" component={PointsLedgerScreen} />
      <StudentsStack.Screen name="AwardPoints" component={AwardPointsScreen} />
      <StudentsStack.Screen name="EnrollStudent" component={StudentDetailScreen} />
    </StudentsStack.Navigator>
  );
}

function MarketNavigator() {
  return (
    <MarketStack.Navigator screenOptions={{ headerShown: false }}>
      <MarketStack.Screen name="MarketHome" component={MarketHomeScreen} />
      <MarketStack.Screen name="ItemAdd" component={MinistryAddScreen} />
    </MarketStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsHome" component={SettingsHomeScreen} />
      <SettingsStack.Screen name="Ministries" component={MinistriesScreen} />
      <SettingsStack.Screen name="MinistryDetail" component={MinistryAddScreen} />
      <SettingsStack.Screen name="MinistryAdd" component={MinistryAddScreen} />
      <SettingsStack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <SettingsStack.Screen name="PinChange" component={SecuritySettingsScreen} />
      <SettingsStack.Screen name="BackupRestore" component={SettingsHomeScreen} />
      <SettingsStack.Screen name="About" component={SettingsHomeScreen} />
    </SettingsStack.Navigator>
  );
}

// ── Custom Tab Bar ────────────────────────────────────────

const TAB_ITEMS = [
  { name: 'Home', icon: '🏠', label: 'Home' },
  { name: 'Attendance', icon: '📋', label: 'Attendance' },
  { name: 'Students', icon: '👦', label: 'Students' },
  { name: 'Market', icon: '🛒', label: 'Market' },
  { name: 'Settings', icon: '⚙️', label: 'Settings' },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <BlurView
      intensity={80}
      tint="light"
      style={[
        styles.tabBar,
        { paddingBottom: insets.bottom, height: Layout.tabBarHeight + insets.bottom },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = TAB_ITEMS[index];

        return (
          <View
            key={route.key}
            style={styles.tabItem}
            onTouchEnd={() => {
              if (!isFocused) {
                navigation.navigate(route.name);
              }
            }}
          >
            <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[Typography.label, styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {isFocused && <View style={styles.tabIndicator} />}
          </View>
        );
      })}
    </BlurView>
  );
}

// ── Main Tab Navigator ────────────────────────────────────

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Attendance" component={AttendanceNavigator} />
      <Tab.Screen name="Students" component={StudentsNavigator} />
      <Tab.Screen name="Market" component={MarketNavigator} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  );
}

// ── Auth Gate + Root ──────────────────────────────────────

export default function AppNavigator() {
  const [isLocked, setIsLocked] = useState<boolean | null>(null);

  useEffect(() => {
    checkLock();

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  const checkLock = async () => {
    const locked = await securityService.isLocked();
    setIsLocked(locked);
  };

  const handleAppState = async (state: AppStateStatus) => {
    if (state === 'background') {
      await securityService.lock();
    } else if (state === 'active') {
      await checkLock();
    }
  };

  if (isLocked === null) return null; // Splash

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {isLocked ? (
          <RootStack.Screen name="Lock">
            {() => <LockScreen onUnlock={async () => {
              setIsLocked(false);
            }} />}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.frostedTabBg,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 8, position: 'relative',
  },
  tabIcon: { fontSize: 20, opacity: 0.5 },
  tabIconActive: { opacity: 1 },
  tabLabel: {
    fontSize: 10, color: Colors.textTertiary,
    marginTop: 2,
  },
  tabLabelActive: { color: Colors.primary },
  tabIndicator: {
    position: 'absolute', top: 0,
    width: 24, height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});
