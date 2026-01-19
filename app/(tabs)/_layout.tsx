
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export const unstable_settings = {
  initialRouteName: '(home)',
};

export default function TabLayout() {
  console.log('TabLayout rendered - initialRouteName: (home)');
  
  // Three tabs configuration - Projects, Manual, and Profile
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Projects',
    },
    {
      name: '(manual)',
      route: '/(tabs)/(manual)/',
      icon: 'menu-book',
      label: 'Manual',
    },
    {
      name: '(profile)',
      route: '/(tabs)/(profile)/',
      icon: 'person',
      label: 'Profile',
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
          name="(manual)" 
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="(profile)" 
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
