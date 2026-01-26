
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export const unstable_settings = {
  initialRouteName: '(home)',
};

export default function TabLayout() {
  console.log('TabLayout iOS rendered - initialRouteName: (home)');
  
  // Use FloatingTabBar for both iPhone and iPad with proper iOS SF Symbol names
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      iosIcon: 'house.fill', // SF Symbol for iOS
      androidIcon: 'home', // Material icon for Android (not used on iOS but required by type)
      label: 'Projects',
    },
    {
      name: '(manual)',
      route: '/(tabs)/(manual)/',
      iosIcon: 'books.vertical.fill', // SF Symbol for iOS
      androidIcon: 'menu-book', // Material icon for Android (not used on iOS but required by type)
      label: 'Manual',
    },
    {
      name: '(profile)',
      route: '/(tabs)/(profile)/',
      iosIcon: 'person.crop.circle.badge.ellipsis.fill', // SF Symbol for iOS
      androidIcon: 'account-circle', // Material icon for Android (not used on iOS but required by type)
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
