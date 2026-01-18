
import { Platform } from 'react-native';
import { Stack, useLocalSearchParams, usePathname } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { Dimensions } from 'react-native';
import { colors } from '@/styles/commonStyles';

const { width: screenWidth } = Dimensions.get('window');

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function HomeLayout() {
  console.log('HomeLayout rendered - initialRouteName: index');
  
  const params = useLocalSearchParams();
  const pathname = usePathname();
  const projectId = params.id as string;

  // Determine if we're in a project context
  const isInProject = pathname.includes('project-overview') || 
                      pathname.includes('framing') || 
                      pathname.includes('exploration') || 
                      pathname.includes('timeline');

  // Project-specific tabs
  const projectTabs: TabBarItem[] = [
    {
      name: 'framing',
      route: (id?: string) => `/(tabs)/(home)/framing?id=${id}` as any,
      icon: 'dashboard',
      label: 'Framing',
    },
    {
      name: 'exploration',
      route: (id?: string) => `/(tabs)/(home)/exploration-loops?id=${id}` as any,
      icon: 'refresh',
      label: 'Exploration',
    },
    {
      name: 'timeline',
      route: (id?: string) => `/(tabs)/(home)/timeline?id=${id}` as any,
      icon: 'calendar-today',
      label: 'Timeline',
    },
    {
      name: 'export',
      route: (id?: string) => `/(tabs)/(home)/project-overview?id=${id}` as any,
      icon: 'download',
      label: 'Export',
    },
  ];

  // UPDATED: Simplified header configuration for project-specific screens
  const projectScreenOptions = {
    headerShown: true,
    headerBackTitle: '', // Remove back button text, show only chevron
    headerStyle: {
      backgroundColor: 'transparent', // Transparent header background
    },
    headerTransparent: true, // Make header transparent
    headerBlurEffect: undefined, // No blur effect
    headerTitleStyle: {
      color: '#111111', // Black text for title
      fontSize: 17,
      fontWeight: '600' as const,
    },
    headerTintColor: '#111111', // Black color for back button chevron and icons
    headerShadowVisible: false, // No shadow
    headerTitleAlign: 'center' as const, // Center the title
  };

  return (
    <>
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
            title: 'Start a Project',
            presentation: 'modal',
            headerStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
        <Stack.Screen
          name="edit-project"
          options={{
            headerShown: true,
            title: 'Edit Project',
            presentation: 'modal',
            headerStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
        <Stack.Screen
          name="project-overview"
          options={{
            ...projectScreenOptions,
            title: 'Project Overview',
          }}
        />
        <Stack.Screen
          name="framing"
          options={{
            ...projectScreenOptions,
            title: 'Framing',
          }}
        />
        <Stack.Screen
          name="exploration-loops"
          options={{
            ...projectScreenOptions,
            title: 'Exploration Loops',
          }}
        />
        <Stack.Screen
          name="exploration-loop"
          options={{
            ...projectScreenOptions,
            title: 'Exploration Loop',
          }}
        />
        <Stack.Screen
          name="timeline"
          options={{
            ...projectScreenOptions,
            title: 'Timeline',
          }}
        />
        <Stack.Screen
          name="export"
          options={{
            ...projectScreenOptions,
            title: 'Export',
          }}
        />
      </Stack>
      
      {isInProject && projectId && (
        <FloatingTabBar 
          tabs={projectTabs} 
          projectId={projectId}
          containerWidth={screenWidth * 0.85}
          borderRadius={35}
          bottomMargin={20}
        />
      )}
    </>
  );
}
