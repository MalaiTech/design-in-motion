
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
});
