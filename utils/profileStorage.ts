
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENCY_KEY = '@design_in_motion_currency';
const PERSONAL_INFO_KEY = '@design_in_motion_personal_info';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessAddress: string;
  website: string;
}

export const getDefaultCurrency = async (): Promise<Currency> => {
  try {
    const saved = await AsyncStorage.getItem(CURRENCY_KEY);
    if (saved) {
      // Return the full currency object based on the saved code
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
      const currency = currencies.find(c => c.code === saved);
      if (currency) {
        return currency;
      }
    }
    // Default to USD
    return { code: 'USD', symbol: '$', name: 'US Dollar' };
  } catch (error) {
    console.error('Error loading currency:', error);
    return { code: 'USD', symbol: '$', name: 'US Dollar' };
  }
};

export const getPersonalInfo = async (): Promise<PersonalInfo | null> => {
  try {
    const saved = await AsyncStorage.getItem(PERSONAL_INFO_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  } catch (error) {
    console.error('Error loading personal info:', error);
    return null;
  }
};
