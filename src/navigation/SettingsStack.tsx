import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from './navigation.types';
import { SettingsHomeScreen }  from '../features/settings/SettingsHomeScreen';
import { MinistriesScreen }    from '../features/ministries/MinistriesScreen';
import { MinistryDetailScreen } from '../features/ministries/MinistryDetailScreen';
import { SecurityScreen }      from '../features/settings/SecurityScreen';
import { BackupScreen }        from '../features/settings/BackupScreen';
import { AboutScreen }         from '../features/settings/AboutScreen';

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
