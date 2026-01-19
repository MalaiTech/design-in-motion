
import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '@/styles/commonStyles';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        // Same minimal navigation style as Manual and Project screens
        headerShown: true,
        headerTitleAlign: 'center',
        headerTransparent: false,
        headerShadowVisible: false,
        headerBackTitleVisible: false, // Hide "Back" text
        headerBackTitle: '', // No back title
        headerBackButtonDisplayMode: 'minimal', // Critical for iOS chevron-only
        headerTintColor: colors.text,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="personal-info"
        options={{
          title: 'Personal & Business Info',
        }}
      />
      <Stack.Screen
        name="app-info"
        options={{
          title: 'App Information',
        }}
      />
    </Stack>
  );
}
