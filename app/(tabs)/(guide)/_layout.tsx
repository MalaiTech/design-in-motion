
import { Stack } from 'expo-router';
import React from 'react';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function GuideLayout() {
  console.log('GuideLayout rendered - initialRouteName: index');
  
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
