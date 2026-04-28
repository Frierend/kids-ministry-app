import React from 'react';
import { RootNavigator } from '../navigation/RootNavigator';
import { AppProviders } from './providers/AppProviders';

export default function AppBootstrap() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
