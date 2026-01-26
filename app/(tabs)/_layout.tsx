
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export const unstable_settings = {
  initialRouteName: '(home)',
};

export default function TabLayout() {
  console.log('TabLayout rendered - initialRouteName: (home)');
  
  // Three tabs configuration - Projects, Manual, and Profile
  // Using valid Material icon names for Android/Web/iPad
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home', // Valid Material icon
      label: 'Projects',
    },
    {
      name: '(manual)',
      route: '/(tabs)/(manual)/',
      icon: 'menu-book', // Valid Material icon
      label: 'Manual',
    },
    {
      name: '(profile)',
      route: '/(tabs)/(profile)/',
      icon: 'account-circle', // Valid Material icon (changed from 'person')
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
