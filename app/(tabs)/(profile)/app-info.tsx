
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export default function AppInfoScreen() {
  const [storageUsed, setStorageUsed] = useState<string>('Calculating...');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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
    setShowPrivacyModal(true);
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
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
              <Text style={styles.infoValue}>{appVersion}</Text>
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
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowPrivacyModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <View style={styles.modalCloseButton} />
          </View>
          <ScrollView style={styles.privacyScroll} contentContainerStyle={styles.privacyContent}>
            <Text style={styles.privacySection}>1. Introduction</Text>
            <Text style={styles.privacyText}>
              MalaiTech is committed to protecting your privacy. This Privacy Policy explains how DeVine "Design in Motion" handles your information when you use the App.
            </Text>
            <Text style={styles.privacyText}>
              DeVine is designed with privacy first:
            </Text>
            <Text style={styles.privacyBullet}>• We do not collect, store, or transfer your personal data.</Text>
            <Text style={styles.privacyBullet}>• All data remains on your device only.</Text>

            <Text style={styles.privacySection}>2. Information We Do NOT Collect</Text>
            <Text style={styles.privacyText}>MalaiTech does not:</Text>
            <Text style={styles.privacyBullet}>• Collect personal information</Text>
            <Text style={styles.privacyBullet}>• Store user data on servers</Text>
            <Text style={styles.privacyBullet}>• Transmit data outside your device</Text>
            <Text style={styles.privacyBullet}>• Use tracking technologies (cookies, analytics, advertising IDs)</Text>
            <Text style={styles.privacyBullet}>• Use third-party analytics</Text>
            <Text style={styles.privacyBullet}>• Sell or share data with any third party</Text>
            <Text style={styles.privacyText}>This means your data never leaves your phone.</Text>

            <Text style={styles.privacySection}>3. Information Stored on Your Device (Local Only)</Text>
            <Text style={styles.privacyText}>
              The following information may be stored locally on your device only, and only with your permission:
            </Text>
            <Text style={styles.privacySubsection}>Contact Information:</Text>
            <Text style={styles.privacyText}>We do not upload, store, or transmit contact information.</Text>
            <Text style={styles.privacySubsection}>Documents, Photos and Camera</Text>
            <Text style={styles.privacyText}>
              Used when you attach optional images or Documents to your Design Exploration. Images and Documents are stored on your device only.
            </Text>

            <Text style={styles.privacySection}>4. No Account, No Cloud Storage</Text>
            <Text style={styles.privacyText}>DeVine does not require you to create an account.</Text>
            <Text style={styles.privacyBullet}>• There is no login</Text>
            <Text style={styles.privacyBullet}>• There is no cloud sync</Text>
            <Text style={styles.privacyBullet}>• All information remains on the device unless you manually export it</Text>
            <Text style={styles.privacyText}>You have full control over your data at all times.</Text>

            <Text style={styles.privacySection}>5. Data Sharing</Text>
            <Text style={styles.privacyText}>
              Since the App does not collect or transmit data, we do not share information with:
            </Text>
            <Text style={styles.privacyBullet}>• Advertisers</Text>
            <Text style={styles.privacyBullet}>• Analytics providers</Text>
            <Text style={styles.privacyBullet}>• Third parties</Text>
            <Text style={styles.privacyBullet}>• Government agencies</Text>
            <Text style={styles.privacyText}>Your data is yours alone.</Text>

            <Text style={styles.privacySection}>6. GDPR Compliance</Text>
            <Text style={styles.privacyText}>
              If you are in the European Union, GDPR grants you the right to:
            </Text>
            <Text style={styles.privacyBullet}>• Access your data</Text>
            <Text style={styles.privacyBullet}>• Correct your data</Text>
            <Text style={styles.privacyBullet}>• Delete your data</Text>
            <Text style={styles.privacyBullet}>• Restrict processing</Text>
            <Text style={styles.privacyText}>
              Since all data stays on your device: You can exercise these rights simply by deleting or modifying the data within the App, or by deleting the App itself. MalaiTech holds no personal data, so GDPR does not require us to process or store any user requests.
            </Text>

            <Text style={styles.privacySection}>7. CCPA Compliance</Text>
            <Text style={styles.privacyText}>Under the California Consumer Privacy Act (CCPA):</Text>
            <Text style={styles.privacyBullet}>• We do not sell personal information</Text>
            <Text style={styles.privacyBullet}>• We do not collect personal information</Text>
            <Text style={styles.privacyBullet}>• No opt-out is required because no data is collected</Text>
            <Text style={styles.privacyText}>CCPA rights can be exercised by managing your data on your device.</Text>

            <Text style={styles.privacySection}>8. Children's Privacy</Text>
            <Text style={styles.privacyText}>
              DeVine is not intended for children under 13. We do not knowingly collect data from children.
            </Text>
            <Text style={styles.privacyText}>
              If a parent believes their child has entered personal data into the App, deleting the App removes all stored data.
            </Text>

            <Text style={styles.privacySection}>9. Data Security</Text>
            <Text style={styles.privacyText}>Your data is protected by:</Text>
            <Text style={styles.privacyBullet}>• Your device's operating system security</Text>
            <Text style={styles.privacyBullet}>• No external data transmission</Text>
            <Text style={styles.privacyText}>MalaiTech has no access to your information.</Text>

            <Text style={styles.privacySection}>10. Changes to This Policy</Text>
            <Text style={styles.privacyText}>
              We may update this Privacy Policy to reflect App improvements or legal requirements.
            </Text>
            <Text style={styles.privacyText}>
              Updates will be posted on our website. Continued use of the App after changes constitutes acceptance of the updated policy.
            </Text>

            <Text style={styles.privacySection}>11. Contact Information</Text>
            <Text style={styles.privacyText}>
              If you have questions about this Privacy Policy, please contact: info@malai.nl
            </Text>

            <View style={styles.privacyBottomSpacer} />
          </ScrollView>
        </View>
      </Modal>
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
  bottomSpacer: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalCloseButton: {
    width: 60,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#1d6a89',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  privacyScroll: {
    flex: 1,
  },
  privacyContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  privacySection: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  privacySubsection: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 12,
  },
  privacyBullet: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 6,
    paddingLeft: 8,
  },
  privacyBottomSpacer: {
    height: 60,
  },
});
