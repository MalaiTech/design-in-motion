
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  // Single tab configuration - Home only
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Projects',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          headerBackButtonDisplayMode: "minimal",
          headerBackTitleVisible: false,
          headerBackTitle: "",
        }}
      >
        <Stack.Screen key="home" name="(home)" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
