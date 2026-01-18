
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export const unstable_settings = {
  initialRouteName: '(home)',
};

export default function TabLayout() {
  console.log('TabLayout rendered - initialRouteName: (home)');
  
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
        initialRouteName="(home)"
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        {/* Explicitly set (home) as first screen to ensure it loads first */}
        <Stack.Screen 
          name="(home)" 
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="(guide)" 
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
