
import { Stack } from 'expo-router';
import React from 'react';

export default function GuideLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="method" />
      <Stack.Screen name="phases" />
      <Stack.Screen name="tools" />
    </Stack>
  );
}
