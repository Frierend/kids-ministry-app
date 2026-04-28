import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StudentsStackParamList } from './navigation.types';
import { StudentListScreen }    from '../screens/students/StudentListScreen';
import { StudentDetailScreen }  from '../screens/students/StudentDetailScreen';
import { AddStudentScreen }     from '../screens/students/AddStudentScreen';
import { EditStudentScreen }    from '../screens/students/EditStudentScreen';
import { PointsLedgerScreen }   from '../screens/students/PointsLedgerScreen';
import { AwardPointsScreen }    from '../screens/students/AwardPointsScreen';
import { ArchiveStudentScreen } from '../screens/students/ArchiveStudentScreen';

const Stack = createNativeStackNavigator<StudentsStackParamList>();

export function StudentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentList"    component={StudentListScreen} />
      <Stack.Screen name="StudentDetail"  component={StudentDetailScreen} />
      <Stack.Screen name="AddStudent"     component={AddStudentScreen} />
      <Stack.Screen name="EditStudent"    component={EditStudentScreen} />
      <Stack.Screen name="PointsLedger"   component={PointsLedgerScreen} />
      <Stack.Screen name="AwardPoints"    component={AwardPointsScreen} />
      <Stack.Screen name="ArchiveStudent" component={ArchiveStudentScreen} />
    </Stack.Navigator>
  );
}
