import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StudentsStackParamList } from './navigation.types';
import { StudentListScreen }    from '../features/students/StudentListScreen';
import { StudentDetailScreen }  from '../features/students/StudentDetailScreen';
import { AddStudentScreen }     from '../features/students/AddStudentScreen';
import { EditStudentScreen }    from '../features/students/EditStudentScreen';
import { PointsLedgerScreen }   from '../features/students/PointsLedgerScreen';
import { AwardPointsScreen }    from '../features/students/AwardPointsScreen';
import { ArchiveStudentScreen } from '../features/students/ArchiveStudentScreen';

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
