
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

  // On iPad, use FloatingTabBar (same as Android/Web)
  if (isIPad) {
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

  // On iPhone, use native tabs with explicit initialRouteName
  return (
    <NativeTabs initialRouteName="(home)">
      {/* Explicitly set (home) as first tab to ensure it loads first */}
      <NativeTabs.Trigger name="(home)">
        <Icon sf="house.fill" />
        <Label>Projects</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(manual)">
        <Icon sf="book.closed.fill" />
        <Label>Manual</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(profile)">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
