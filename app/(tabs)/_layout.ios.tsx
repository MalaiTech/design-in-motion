
import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export const unstable_settings = {
  initialRouteName: '(home)',
};

export default function TabLayout() {
  console.log('TabLayout iOS rendered - initialRouteName: (home)');
  
  // Check if device is iPad
  const isIPad = Platform.OS === 'ios' && Platform.isPad;

  // On iPad, use FloatingTabBar with proper iOS SF Symbol names
  if (isIPad) {
    const tabs: TabBarItem[] = [
      {
        name: '(home)',
        route: '/(tabs)/(home)/',
        iosIcon: 'house.fill', // SF Symbol for iOS
        androidIcon: 'home', // Material icon for Android (not used on iPad but required by type)
        label: 'Projects',
      },
      {
        name: '(manual)',
        route: '/(tabs)/(manual)/',
        iosIcon: 'books.vertical.fill', // SF Symbol for iOS
        androidIcon: 'menu-book', // Material icon for Android (not used on iPad but required by type)
        label: 'Manual',
      },
      {
        name: '(profile)',
        route: '/(tabs)/(profile)/',
        iosIcon: 'person.crop.circle.badge.ellipsis.fill', // SF Symbol for iOS
        androidIcon: 'account-circle', // Material icon for Android (not used on iPad but required by type)
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

  // On iPhone, use native tabs with SF Symbols
  return (
    <NativeTabs initialRouteName="(home)">
      {/* Projects tab with house.fill SF Symbol */}
      <NativeTabs.Trigger name="(home)">
        <Icon sf="house.fill" />
        <Label>Projects</Label>
      </NativeTabs.Trigger>
      {/* Manual tab with books.vertical.fill SF Symbol */}
      <NativeTabs.Trigger name="(manual)">
        <Icon sf="books.vertical.fill" />
        <Label>Manual</Label>
      </NativeTabs.Trigger>
      {/* Profile tab with person.crop.circle.badge.ellipsis.fill SF Symbol */}
      <NativeTabs.Trigger name="(profile)">
        <Icon sf="person.crop.circle.badge.ellipsis.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
