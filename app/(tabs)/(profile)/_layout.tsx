
import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '@/styles/commonStyles';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
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
