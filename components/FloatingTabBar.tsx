
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import { colors } from '@/styles/commonStyles';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Href } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

export interface TabBarItem {
  name: string;
  route: Href | ((projectId?: string) => Href);
  iosIcon: string; // SF Symbol name for iOS
  androidIcon: keyof typeof MaterialIcons.glyphMap; // Material icon name for Android
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
  projectId?: string;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = screenWidth / 2.5,
  borderRadius = 35,
  bottomMargin,
  projectId
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const animatedValue = useSharedValue(0);

  console.log('FloatingTabBar: Current pathname:', pathname);

  // Get projectId from params if not provided
  const currentProjectId = projectId || (params.id as string);

  // Improved active tab detection - check if pathname contains the tab route segment
  const activeTabIndex = React.useMemo(() => {
    // Extract the main tab segment from pathname
    // e.g., "/(tabs)/(home)/..." -> "(home)"
    // e.g., "/(tabs)/(manual)/..." -> "(manual)"
    // e.g., "/(tabs)/(profile)/..." -> "(profile)"
    
    let detectedIndex = 0; // Default to first tab
    
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      // Check if pathname contains the tab name (e.g., "(home)", "(manual)", "(profile)")
      if (pathname.includes(`/(tabs)/${tab.name}/`) || pathname.includes(`/(tabs)/${tab.name}`)) {
        detectedIndex = i;
        console.log(`FloatingTabBar: Active tab detected - ${tab.name} (index ${i})`);
        break;
      }
    }
    
    return detectedIndex;
  }, [pathname, tabs]);

  // Update animation when active tab changes
  React.useEffect(() => {
    console.log('FloatingTabBar: Animating to tab index:', activeTabIndex);
    animatedValue.value = withSpring(activeTabIndex, {
      damping: 20,
      stiffness: 120,
      mass: 1,
    });
  }, [activeTabIndex, animatedValue]);

  const handleTabPress = (route: Href | ((projectId?: string) => Href), tabName: string) => {
    const targetRoute = typeof route === 'function' ? route(currentProjectId) : route;
    console.log(`FloatingTabBar: Tab ${tabName} pressed, navigating to:`, targetRoute);
    router.push(targetRoute);
  };

  const tabWidthPercent = ((100 / tabs.length) - 1).toFixed(2);

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = (containerWidth - 8) / tabs.length;
    return {
      transform: [
        {
          translateX: interpolate(
            animatedValue.value,
            [0, tabs.length - 1],
            [0, tabWidth * (tabs.length - 1)]
          ),
        },
      ],
    };
  });

  // Force light mode styling on iOS for readability
  // Use solid white background with slight transparency for glass effect
  const dynamicStyles = {
    blurContainer: {
      ...styles.blurContainer,
      borderWidth: 1.2,
      ...Platform.select({
        ios: {
          // Solid white background for iOS to ensure readability in dark mode
          backgroundColor: 'rgba(250, 250, 247, 0.95)', // Use app background color with high opacity
          borderColor: 'rgba(221, 221, 221, 0.8)', // Light border
        },
        android: {
          backgroundColor: 'rgba(250, 250, 247, 0.95)',
          borderColor: 'rgba(221, 221, 221, 0.8)',
        },
        web: {
          backgroundColor: 'rgba(250, 250, 247, 0.95)',
          borderColor: 'rgba(221, 221, 221, 0.8)',
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    background: {
      ...styles.background,
    },
    indicator: {
      ...styles.indicator,
      // Light gray indicator that's visible on light background
      backgroundColor: 'rgba(29, 106, 137, 0.08)', // Primary color with low opacity
      width: `${tabWidthPercent}%` as `${number}%`,
    },
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={[
        styles.container,
        {
          width: containerWidth,
          marginBottom: bottomMargin ?? 20
        }
      ]}>
        <BlurView
          intensity={80}
          style={[dynamicStyles.blurContainer, { borderRadius }]}
        >
          <View style={dynamicStyles.background} />
          <Animated.View style={[dynamicStyles.indicator, indicatorStyle]} />
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => {
              const isActive = activeTabIndex === index;

              return (
                <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.tab}
                  onPress={() => handleTabPress(tab.route, tab.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabContent}>
                    <IconSymbol
                      ios_icon_name={tab.iosIcon}
                      android_material_icon_name={tab.androidIcon}
                      size={24}
                      color={isActive ? colors.primary : colors.text}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: colors.textSecondary },
                        isActive && { color: colors.primary, fontWeight: '600' },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  container: {
    marginHorizontal: 20,
    alignSelf: 'center',
  },
  blurContainer: {
    overflow: 'hidden',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 2,
    bottom: 4,
    borderRadius: 27,
    width: `${(100 / 2) - 1}%`,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },
});
