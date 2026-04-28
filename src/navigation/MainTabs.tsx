import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabParamList } from './navigation.types';
import { AttendanceStack } from './AttendanceStack';
import { StudentsStack } from './StudentsStack';
import { MarketStack } from './MarketStack';
import { SettingsStack } from './SettingsStack';
import { HomeScreen } from '../features/home/HomeScreen';
import { Colors, Typography, Layout } from '../constants';

const Tab = createBottomTabNavigator<TabParamList>();

const TABS = [
  { name: 'Home'       as const, icon: '🏠', label: 'Home'       },
  { name: 'Attendance' as const, icon: '📋', label: 'Attendance' },
  { name: 'Students'   as const, icon: '👥', label: 'Students'   },
  { name: 'Market'     as const, icon: '🛒', label: 'Market'     },
  { name: 'Settings'   as const, icon: '⚙️', label: 'Settings'  },
];

export function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: Layout.tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarIcon: ({ focused, color }) => {
          const tab = TABS.find((t) => t.name === route.name);
          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>
                {tab?.icon}
              </Text>
            </View>
          );
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

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: Colors.primaryLight,
  },
});
