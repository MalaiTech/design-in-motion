
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: ''
        }}
      />
      <Stack.Screen
        name="create-project"
        options={{
          headerShown: true,
          title: '',
          presentation: 'modal'
        }}
      />
      <Stack.Screen
        name="edit-project"
        options={{
          headerShown: true,
          title: ''
        }}
      />
      <Stack.Screen
        name="project-overview"
        options={{
          headerShown: true,
          title: ''
        }}
      />
      <Stack.Screen
        name="framing"
        options={{
          headerShown: true,
          title: ''
        }}
      />
      <Stack.Screen
        name="exploration-loops"
        options={{
          headerShown: true,
          title: ''
        }}
      />
      <Stack.Screen
        name="exploration-loop"
        options={{
          headerShown: true,
          title: ''
        }}
      />
      <Stack.Screen
        name="timeline"
        options={{
          headerShown: true,
          title: ''
        }}
      />
    </Stack>
  );
}
