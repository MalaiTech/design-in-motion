
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export default function AppInfoScreen() {
  const [storageUsed, setStorageUsed] = useState<string>('Calculating...');

  useEffect(() => {
    calculateStorage();
  }, []);

  const calculateStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
      
      const sizeInKB = (totalSize / 1024).toFixed(2);
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      
      if (totalSize < 1024 * 1024) {
        setStorageUsed(`${sizeInKB} KB`);
      } else {
        setStorageUsed(`${sizeInMB} MB`);
      }
    } catch (error) {
      console.error('Error calculating storage:', error);
      setStorageUsed('Unable to calculate');
    }
  };

  const openPrivacyPolicy = () => {
    console.log('User tapped Privacy Policy');
    Alert.alert(
      'Privacy Policy',
      'Design in Motion is a local-first app. All your data is stored only on your device. We do not collect, transmit, or store any personal information on external servers.\n\n• No account required\n• No cloud sync\n• No analytics or tracking\n• No external API calls\n• Your data never leaves your device\n\nExports are only created when you explicitly choose to export a project to your device or iCloud Drive.',
      [{ text: 'OK' }]
    );
  };

  const clearAllData = () => {
    console.log('User tapped Clear All Data');
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all projects, settings, and personal information from this device. This action cannot be undone.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              setStorageUsed('0 KB');
              Alert.alert('Success', 'All data has been cleared.');
              console.log('All data cleared');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>App Information</Text>

          {/* Version Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoHeader}>
                <IconSymbol
                  ios_icon_name="app.badge.fill"
                  android_material_icon_name="info"
                  size={24}
                  color={colors.text}
                />
                <Text style={styles.infoTitle}>Version</Text>
              </View>
              <Text style={styles.infoValue}>{appVersion} ({buildNumber})</Text>
            </View>
          </View>

          {/* Storage Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoHeader}>
                <IconSymbol
                  ios_icon_name="internaldrive.fill"
                  android_material_icon_name="storage"
                  size={24}
                  color={colors.text}
                />
                <Text style={styles.infoTitle}>Storage Used</Text>
              </View>
              <Text style={styles.infoValue}>{storageUsed}</Text>
            </View>
            <Text style={styles.infoDescription}>
              All data is stored locally on your device. No cloud sync or external storage.
            </Text>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={clearAllData}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="trash.fill"
                android_material_icon_name="delete"
                size={18}
                color="#D32F2F"
              />
              <Text style={styles.dangerButtonText}>Clear All Data</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Policy */}
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={openPrivacyPolicy}
              activeOpacity={0.7}
            >
              <View style={styles.infoHeader}>
                <IconSymbol
                  ios_icon_name="hand.raised.fill"
                  android_material_icon_name="privacy-tip"
                  size={24}
                  color={colors.text}
                />
                <Text style={styles.infoTitle}>Privacy Policy</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <Text style={styles.infoDescription}>
              Design in Motion is a local-first app. Your data never leaves your device.
            </Text>
          </View>

          {/* About */}
          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>About Design in Motion</Text>
            <Text style={styles.aboutText}>
              A visual thinking and project management app for creative designers and developers using an explorative development process.
            </Text>
            <Text style={styles.aboutText}>
              Built with privacy and local-first principles. No accounts, no tracking, no cloud sync.
            </Text>
          </View>
        </View>

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
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  infoValue: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D32F2F',
    marginTop: 16,
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
  },
  aboutSection: {
    marginTop: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  bottomSpacer: {
    height: 40,
  },
});
