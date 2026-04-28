import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MarketStackParamList } from './navigation.types';
import { MarketHomeScreen }    from '../screens/market/MarketHomeScreen';
import { RedeemConfirmScreen } from '../screens/market/RedeemConfirmScreen';
import { MarketHistoryScreen } from '../screens/market/MarketHistoryScreen';
import { ManageItemsScreen }   from '../screens/market/ManageItemsScreen';
import { AddEditItemScreen }   from '../screens/market/AddEditItemScreen';

const Stack = createNativeStackNavigator<MarketStackParamList>();

export function MarketStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MarketHome"    component={MarketHomeScreen} />
      <Stack.Screen name="RedeemConfirm" component={RedeemConfirmScreen} />
      <Stack.Screen name="MarketHistory" component={MarketHistoryScreen} />
      <Stack.Screen name="ManageItems"   component={ManageItemsScreen} />
      <Stack.Screen name="AddEditItem"   component={AddEditItemScreen} />
    </Stack.Navigator>
  );
}
