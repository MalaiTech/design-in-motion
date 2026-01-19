
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
    id: 'settings',
    title: 'Settings',
    subtitle: 'Default currency and app preferences',
    route: '/(tabs)/(profile)/settings',
    iosIcon: 'gearshape.fill',
    androidIcon: 'settings',
  },
  {
    id: 'personal-info',
    title: 'Personal & Business Info',
    subtitle: 'Information for export cover pages',
    route: '/(tabs)/(profile)/personal-info',
    iosIcon: 'person.text.rectangle.fill',
    androidIcon: 'badge',
  },
  {
    id: 'app-info',
    title: 'App Information',
    subtitle: 'Privacy policy, version, and storage',
    route: '/(tabs)/(profile)/app-info',
    iosIcon: 'info.circle.fill',
    androidIcon: 'info',
  },
];

export default function ProfileHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  console.log('Profile Home Screen rendered');

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
        {/* Header Block */}
        <View style={styles.headerBlock}>
          <Text style={styles.headline}>Profile</Text>
          <Text style={styles.headerText}>
            Manage your app settings, personal and business information for exports, and view app details.
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
  headerBlock: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  headerText: {
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
