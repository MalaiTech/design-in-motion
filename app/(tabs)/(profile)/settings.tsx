
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const CURRENCY_KEY = '@design_in_motion_currency';

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

const currencies: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
];

export default function SettingsScreen() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCurrency();
    }, [])
  );

  const loadCurrency = async () => {
    try {
      const saved = await AsyncStorage.getItem(CURRENCY_KEY);
      if (saved) {
        const currency = currencies.find(c => c.code === saved);
        if (currency) {
          setSelectedCurrency(currency);
        }
      }
    } catch (error) {
      console.error('Error loading currency:', error);
    }
  };

  const saveCurrency = async (currency: Currency) => {
    try {
      await AsyncStorage.setItem(CURRENCY_KEY, currency.code);
      setSelectedCurrency(currency);
      setShowCurrencyModal(false);
      console.log('Currency saved:', currency.code);
    } catch (error) {
      console.error('Error saving currency:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          {/* Currency Setting */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <IconSymbol
                ios_icon_name="dollarsign.circle.fill"
                android_material_icon_name="attach-money"
                size={24}
                color={colors.text}
              />
              <Text style={styles.settingTitle}>Default Currency</Text>
            </View>
            <Text style={styles.settingDescription}>
              This currency will be used throughout the app for cost tracking and exports.
            </Text>
            <TouchableOpacity
              style={styles.currencySelector}
              onPress={() => {
                console.log('User tapped currency selector');
                setShowCurrencyModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.currencyText}>
                {selectedCurrency.symbol} {selectedCurrency.code} - {selectedCurrency.name}
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Privacy & Legal Section */}
          <Text style={styles.sectionTitle}>Privacy & Legal</Text>

          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.privacyRow}
              onPress={() => {
                console.log('User tapped Privacy Policy');
                setShowPrivacyModal(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.settingHeader}>
                <IconSymbol
                  ios_icon_name="lock.shield.fill"
                  android_material_icon_name="privacy-tip"
                  size={24}
                  color={colors.text}
                />
                <Text style={styles.settingTitle}>Privacy Policy</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowCurrencyModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <View style={styles.modalCloseButton} />
          </View>
          <ScrollView style={styles.modalScroll}>
            {currencies.map((currency, index) => (
              <React.Fragment key={currency.code}>
                <TouchableOpacity
                  style={styles.currencyOption}
                  onPress={() => {
                    console.log('User selected currency:', currency.code);
                    saveCurrency(currency);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.currencyOptionContent}>
                    <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyCode}>{currency.code}</Text>
                      <Text style={styles.currencyName}>{currency.name}</Text>
                    </View>
                  </View>
                  {selectedCurrency.code === currency.code && (
                    <IconSymbol
                      ios_icon_name="checkmark"
                      android_material_icon_name="check"
                      size={24}
                      color="#1d6a89"
                    />
                  )}
                </TouchableOpacity>
                {index < currencies.length - 1 && <View style={styles.modalDivider} />}
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      </Modal>

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
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
    marginTop: 16,
    letterSpacing: -0.5,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  currencyText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  modalScroll: {
    flex: 1,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  currencyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    width: 40,
    textAlign: 'center',
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  currencyName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 76,
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
