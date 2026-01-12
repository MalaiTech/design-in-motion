
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
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
      <Stack.Screen
        name="framing"
        options={{
          headerShown: true,
          title: 'Framing'
        }}
      />
      <Stack.Screen
        name="exploration-loops"
        options={{
          headerShown: true,
          title: 'Exploration Loops'
        }}
      />
      <Stack.Screen
        name="exploration-loop"
        options={{
          headerShown: true,
          title: 'Exploration Loop'
        }}
      />
      <Stack.Screen
        name="timeline"
        options={{
          headerShown: true,
          title: 'Timeline'
        }}
      />
    </Stack>
  );
}
