import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AttendanceStackParamList } from '../types';
import { AttendanceHomeScreen }    from '../screens/attendance/AttendanceHomeScreen';
import { SessionDetailScreen }     from '../screens/attendance/SessionDetailScreen';
import { AttendanceHistoryScreen } from '../screens/attendance/AttendanceHistoryScreen';
import { SessionSummaryScreen }    from '../screens/attendance/SessionSummaryScreen';

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
