import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MarketStackParamList } from './navigation.types';
import { MarketHomeScreen }    from '../features/market/MarketHomeScreen';
import { RedeemConfirmScreen } from '../features/market/RedeemConfirmScreen';
import { MarketHistoryScreen } from '../features/market/MarketHistoryScreen';
import { ManageItemsScreen }   from '../features/market/ManageItemsScreen';
import { AddEditItemScreen }   from '../features/market/AddEditItemScreen';

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
