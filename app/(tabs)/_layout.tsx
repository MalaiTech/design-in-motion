
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export const unstable_settings = {
  initialRouteName: '(home)',
};

export default function TabLayout() {
  console.log('TabLayout rendered - initialRouteName: (home)');
  
  // Three tabs configuration - Projects, Manual, and Profile
  // Using SF Symbols for iOS and Material icons for Android/Web
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      iosIcon: 'house.fill', // SF Symbol for iOS
      androidIcon: 'home', // Material icon for Android/Web
      label: 'Projects',
    },
    {
      name: '(manual)',
      route: '/(tabs)/(manual)/',
      iosIcon: 'books.vertical.fill', // SF Symbol for iOS
      androidIcon: 'menu-book', // Material icon for Android/Web
      label: 'Manual',
    },
    {
      name: '(profile)',
      route: '/(tabs)/(profile)/',
      iosIcon: 'person.crop.circle.badge.ellipsis.fill', // SF Symbol for iOS
      androidIcon: 'account-circle', // Material icon for Android/Web
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
