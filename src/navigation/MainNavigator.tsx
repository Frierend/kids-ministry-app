import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabParamList } from '../types';
import { AttendanceStack } from './AttendanceStack';
import { StudentsStack } from './StudentsStack';
import { MarketStack } from './MarketStack';
import { SettingsStack } from './SettingsStack';
import { HomeScreen } from '../screens/HomeScreen';
import { Colors, Typography, Layout } from '../constants';

const Tab = createBottomTabNavigator<TabParamList>();

const TABS = [
  { name: 'Home'       as const, icon: '🏠', label: 'Home'       },
  { name: 'Attendance' as const, icon: '📋', label: 'Attendance' },
  { name: 'Students'   as const, icon: '👥', label: 'Students'   },
  { name: 'Market'     as const, icon: '🛒', label: 'Market'     },
  { name: 'Settings'   as const, icon: '⚙️', label: 'Settings'   },
];

export function MainNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: Layout.tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 4,
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        },
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: { fontSize: Typography.xs, fontWeight: Typography.medium, marginTop: -2 },
        tabBarIcon: ({ focused }) => {
          const tab = TABS.find((t) => t.name === route.name);
          return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{tab?.icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home"       component={HomeScreen}       options={{ title: 'Home' }} />
      <Tab.Screen name="Attendance" component={AttendanceStack}  options={{ title: 'Attendance' }} />
      <Tab.Screen name="Students"   component={StudentsStack}    options={{ title: 'Students' }} />
      <Tab.Screen name="Market"     component={MarketStack}      options={{ title: 'Market' }} />
      <Tab.Screen name="Settings"   component={SettingsStack}    options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}
