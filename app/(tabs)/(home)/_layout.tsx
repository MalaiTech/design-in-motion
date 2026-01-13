
import { Platform } from 'react-native';
import { Stack, useLocalSearchParams, usePathname } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { Dimensions } from 'react-native';
import { colors } from '@/styles/commonStyles';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeLayout() {
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

  // Common header style for all screens
  const headerStyle = {
    backgroundColor: colors.background, // #FAFAF7
  };

  const headerTitleStyle = {
    color: '#111111', // Black text for title
    fontSize: 17,
    fontWeight: '600' as const,
  };

  // CRITICAL: Common options for all screens to hide back button text on iOS
  const commonScreenOptions = {
    headerBackTitleVisible: false,
    headerBackTitle: '',
    headerTintColor: '#111111',
    headerStyle,
    headerTitleStyle,
  };

  return (
    <>
      <Stack
        screenOptions={{
          // CRITICAL: Set global defaults for ALL screens in this stack
          headerBackTitleVisible: false,
          headerBackTitle: '',
          headerTintColor: '#111111',
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            title: '',
            headerBackTitleVisible: false,
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="create-project"
          options={{
            headerShown: true,
            title: 'Start a Project',
            presentation: 'modal',
            headerBackTitleVisible: false,
            headerBackTitle: '',
            headerTintColor: '#111111',
            headerStyle,
          }}
        />
        <Stack.Screen
          name="edit-project"
          options={{
            headerShown: true,
            title: 'Edit Project',
            presentation: 'modal',
            headerBackTitleVisible: false,
            headerBackTitle: '',
            headerTintColor: '#111111',
            headerStyle,
          }}
        />
        <Stack.Screen
          name="project-overview"
          options={{
            headerShown: true,
            title: 'Project Overview',
            headerBackTitleVisible: false,
            headerBackTitle: '',
            headerTintColor: '#111111',
            headerStyle,
            headerTitleStyle,
          }}
        />
        <Stack.Screen
          name="framing"
          options={{
            headerShown: true,
            title: 'Framing',
            headerBackTitleVisible: false,
            headerBackTitle: '',
            headerTintColor: '#111111',
            headerStyle,
            headerTitleStyle,
          }}
        />
        <Stack.Screen
          name="exploration-loops"
          options={{
            headerShown: true,
            title: 'Exploration Loops',
            headerBackTitleVisible: false,
            headerBackTitle: '',
            headerTintColor: '#111111',
            headerStyle,
            headerTitleStyle,
          }}
        />
        <Stack.Screen
          name="exploration-loop"
          options={{
            headerShown: true,
            title: 'Exploration Loop',
            headerBackTitleVisible: false,
            headerBackTitle: '',
            headerTintColor: '#111111',
            headerStyle,
            headerTitleStyle,
          }}
        />
        <Stack.Screen
          name="timeline"
          options={{
            headerShown: true,
            title: 'Timeline',
            headerBackTitleVisible: false,
            headerBackTitle: '',
            headerTintColor: '#111111',
            headerStyle,
            headerTitleStyle,
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
