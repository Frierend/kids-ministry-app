import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AttendanceStackParamList } from './navigation.types';
import { AttendanceHomeScreen }    from '../features/attendance/AttendanceHomeScreen';
import { SessionDetailScreen }     from '../features/attendance/SessionDetailScreen';
import { AttendanceHistoryScreen } from '../features/attendance/AttendanceHistoryScreen';
import { SessionSummaryScreen }    from '../features/attendance/SessionSummaryScreen';

const Stack = createNativeStackNavigator<AttendanceStackParamList>();

export function AttendanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttendanceHome"    component={AttendanceHomeScreen} />
      <Stack.Screen name="SessionDetail"     component={SessionDetailScreen} />
      <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
      <Stack.Screen name="SessionSummary"    component={SessionSummaryScreen} />
    </Stack.Navigator>
  );
}
