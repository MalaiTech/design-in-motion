
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export const unstable_settings = {
  initialRouteName: '(home)',
};

export default function TabLayout() {
  // Two tabs configuration - Projects and Guide
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Projects',
    },
    {
      name: '(guide)',
      route: '/(tabs)/(guide)/',
      icon: 'menu-book',
      label: 'Guide',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
        initialRouteName="(home)"
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="guide" name="(guide)" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
