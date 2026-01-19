
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NavigationCard {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  iosIcon: string;
  androidIcon: string;
}

const navigationCards: NavigationCard[] = [
  {
    id: 'method',
    title: 'Method',
    subtitle: 'How Design in Motion works',
    route: '/(tabs)/(manual)/method',
    iosIcon: 'point.bottomleft.forward.to.arrow.triangle.uturn.scurvepath',
    androidIcon: 'timeline',
  },
  {
    id: 'phases',
    title: 'Phases',
    subtitle: 'What to focus on at each stage',
    route: '/(tabs)/(manual)/phases',
    iosIcon: 'circle.grid.cross.left.filled',
    androidIcon: 'grid-on',
  },
  {
    id: 'tools',
    title: 'Tools',
    subtitle: 'Practical supports inside the app',
    route: '/(tabs)/(manual)/tools',
    iosIcon: 'slider.horizontal.2.arrow.trianglehead.counterclockwise',
    androidIcon: 'tune',
  },
];

export default function ManualHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  console.log('Manual Home Screen rendered');

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top || (Platform.OS === 'ios' ? 44 : 24) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Conceptual Image Block - Scales with screen width, maintains aspect ratio */}
        <View style={styles.imageContainer}>
          <Image
            source={require('@/assets/images/0ee355f1-2e5d-4e05-a093-07a54e5a2e67.png')}
            style={styles.conceptImage}
            resizeMode="contain"
          />
        </View>

        {/* Intent Block */}
        <View style={styles.intentBlock}>
          <Text style={styles.headline}>Design in Motion</Text>
          <Text style={styles.intentText}>
            This app supports structured exploration, learning before decisions, and making thinking visible over time. 
            It helps you navigate the creative process with clarity, documenting your journey from initial framing through 
            exploration loops to final delivery.
          </Text>
        </View>

        {/* Primary Navigation Cards */}
        <View style={styles.cardsContainer}>
          {navigationCards.map((card, index) => (
            <React.Fragment key={card.id}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  console.log(`User tapped ${card.title} navigation card`);
                  router.push(card.route as any);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <IconSymbol
                      ios_icon_name={card.iosIcon}
                      android_material_icon_name={card.androidIcon}
                      size={28}
                      color={colors.text}
                    />
                    <Text style={styles.cardTitle}>{card.title}</Text>
                  </View>
                  <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                </View>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron-right"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {index < navigationCards.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  conceptImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1920 / 1080,
    marginBottom: 0,
  },
  intentBlock: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 32,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  intentText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  cardsContainer: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    flex: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: 40,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 60,
  },
  bottomSpacer: {
    height: 40,
  },
});
