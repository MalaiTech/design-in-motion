
import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '@/styles/commonStyles';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function ManualLayout() {
  console.log('ManualLayout rendered - initialRouteName: index');
  
  return (
    <Stack
      screenOptions={{
        // Same minimal navigation style as project screens
        headerShown: true,
        headerTitleAlign: 'center',
        headerTransparent: false,
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal', // Critical for iOS chevron-only
        headerTintColor: '#111111',
        headerStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Manual',
        }}
      />
      <Stack.Screen
        name="method"
        options={{
          title: 'Method',
        }}
      />
      <Stack.Screen
        name="phases"
        options={{
          title: 'Phases',
        }}
      />
      <Stack.Screen
        name="tools"
        options={{
          title: 'Tools',
        }}
      />
    </Stack>
  );
}
