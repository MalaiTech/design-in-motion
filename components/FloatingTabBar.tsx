
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname, useSegments } from 'expo-router';
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
  const segments = useSegments();
  const animatedValue = useSharedValue(0);

  console.log('FloatingTabBar: Current pathname:', pathname);
  console.log('FloatingTabBar: Current segments:', segments);

  // Improved active tab detection using segments
  // segments will be like: ['(tabs)', '(home)', 'index'] or ['(tabs)', '(manual)', 'index']
  const activeTabIndex = React.useMemo(() => {
    let detectedIndex = 0; // Default to first tab (home)
    
    // Check segments for tab group names
    if (segments && segments.length > 0) {
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        // Check if segments contain the tab name (e.g., "(home)", "(manual)", "(profile)")
        if (segments.includes(tab.name)) {
          detectedIndex = i;
          console.log(`FloatingTabBar: Active tab detected via segments - ${tab.name} (index ${i})`);
          break;
        }
      }
    }
    
    // Fallback: check pathname
    if (detectedIndex === 0 && pathname !== '/') {
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        if (pathname.includes(tab.name)) {
          detectedIndex = i;
          console.log(`FloatingTabBar: Active tab detected via pathname - ${tab.name} (index ${i})`);
          break;
        }
      }
    }
    
    console.log(`FloatingTabBar: Final active tab index: ${detectedIndex}`);
    return detectedIndex;
  }, [pathname, segments, tabs]);

  // Update animation when active tab changes
  React.useEffect(() => {
    console.log('FloatingTabBar: Animating to tab index:', activeTabIndex);
    animatedValue.value = withSpring(activeTabIndex, {
      damping: 20,
      stiffness: 120,
      mass: 1,
    });
  }, [activeTabIndex, animatedValue]);

  const handleTabPress = (route: Href | ((projectId?: string) => Href), tabName: string, index: number) => {
    const targetRoute = typeof route === 'function' ? route(projectId) : route;
    console.log(`FloatingTabBar: Tab ${tabName} (index ${index}) pressed, navigating to:`, targetRoute);
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

  // Force light mode styling - solid opaque background for maximum readability
  const dynamicStyles = {
    blurContainer: {
      ...styles.blurContainer,
      borderWidth: 1.5,
      // Solid light background - no transparency issues
      backgroundColor: colors.background, // #FAFAF7 - fully opaque
      borderColor: colors.divider, // #DDDDDD
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    background: {
      ...styles.background,
      backgroundColor: 'transparent', // Let the container background show through
    },
    indicator: {
      ...styles.indicator,
      // Visible indicator with primary color
      backgroundColor: colors.primary, // #1d6a89 with opacity
      opacity: 0.12,
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
                  onPress={() => handleTabPress(tab.route, tab.name, index)}
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
