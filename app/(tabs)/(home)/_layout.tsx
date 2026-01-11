
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: Platform.OS === 'ios',
          title: 'Projects'
        }}
      />
      <Stack.Screen
        name="create-project"
        options={{
          headerShown: true,
          title: 'Start Project',
          presentation: 'modal'
        }}
      />
      <Stack.Screen
        name="edit-project"
        options={{
          headerShown: true,
          title: 'Edit Project'
        }}
      />
      <Stack.Screen
        name="project-overview"
        options={{
          headerShown: true,
          title: 'Project Overview'
        }}
      />
    </Stack>
  );
}
