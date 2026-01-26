
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
      iosIcon: 'square.grid.2x2',
      androidIcon: 'dashboard',
      label: 'Framing',
    },
    {
      name: 'exploration',
      route: (id?: string) => `/(tabs)/(home)/exploration-loops?id=${id}` as any,
      iosIcon: 'arrow.triangle.2.circlepath',
      androidIcon: 'refresh',
      label: 'Exploration',
    },
    {
      name: 'timeline',
      route: (id?: string) => `/(tabs)/(home)/timeline?id=${id}` as any,
      iosIcon: 'calendar',
      androidIcon: 'calendar-today',
      label: 'Timeline',
    },
    {
      name: 'export',
      route: (id?: string) => `/(tabs)/(home)/project-overview?id=${id}` as any,
      iosIcon: 'arrow.down.circle',
      androidIcon: 'download',
      label: 'Export',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          // Default options for ALL project screens - force light mode on iOS
          headerShown: true,
          headerTitleAlign: 'center',
          headerTransparent: false,
          headerShadowVisible: false,
          headerBackTitleVisible: false,
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal', // Critical for iOS chevron-only
          headerTintColor: '#111111',
          headerStyle: { 
            backgroundColor: Platform.OS === 'ios' ? colors.background : 'transparent' 
          },
        }}
      >
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
            title: 'Start a Project',
            presentation: 'modal',
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="edit-project"
          options={{
            title: 'Edit Project',
            presentation: 'modal',
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="project-overview"
          options={{
            title: 'Project Overview',
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="framing"
          options={{
            title: 'Framing',
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="exploration-loops"
          options={{
            title: 'Exploration Loops',
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="exploration-loop"
          options={{
            title: 'Exploration Loop',
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="timeline"
          options={{
            title: 'Timeline',
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="export"
          options={{
            title: 'Export',
            headerStyle: { backgroundColor: colors.background },
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
