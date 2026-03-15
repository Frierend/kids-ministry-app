import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../types';
import { SettingsHomeScreen }  from '../screens/settings/SettingsHomeScreen';
import { MinistriesScreen }    from '../screens/settings/MinistriesScreen';
import { MinistryDetailScreen } from '../screens/settings/MinistryDetailScreen';
import { SecurityScreen }      from '../screens/settings/SecurityScreen';
import { BackupScreen }        from '../screens/settings/BackupScreen';
import { AboutScreen }         from '../screens/settings/AboutScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome"   component={SettingsHomeScreen} />
      <Stack.Screen name="Ministries"     component={MinistriesScreen} />
      <Stack.Screen name="MinistryDetail" component={MinistryDetailScreen} />
      <Stack.Screen name="Security"       component={SecurityScreen} />
      <Stack.Screen name="Backup"         component={BackupScreen} />
      <Stack.Screen name="About"          component={AboutScreen} />
    </Stack.Navigator>
  );
}
