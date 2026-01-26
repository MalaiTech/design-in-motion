
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const PERSONAL_INFO_KEY = '@design_in_motion_personal_info';

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessAddress: string;
  website: string;
}

export default function PersonalInfoScreen() {
  const [info, setInfo] = useState<PersonalInfo>({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    businessAddress: '',
    website: '',
  });
  const [hasChanges, setHasChanges] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadInfo();
    }, [])
  );

  const loadInfo = async () => {
    try {
      const saved = await AsyncStorage.getItem(PERSONAL_INFO_KEY);
      if (saved) {
        setInfo(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading personal info:', error);
    }
  };

  const saveInfo = async () => {
    try {
      await AsyncStorage.setItem(PERSONAL_INFO_KEY, JSON.stringify(info));
      setHasChanges(false);
      console.log('Personal info saved');
      Alert.alert('Saved', 'Your information has been saved successfully.');
    } catch (error) {
      console.error('Error saving personal info:', error);
      Alert.alert('Error', 'Failed to save information. Please try again.');
    }
  };

  const updateField = (field: keyof PersonalInfo, value: string) => {
    setInfo(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Text style={styles.sectionDescription}>
            This information will be used in export cover pages and project documentation.
          </Text>

          {/* Personal Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Personal Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={info.name}
                onChangeText={(text) => updateField('name', text)}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textSecondary}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={info.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="your@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={info.phone}
                onChangeText={(text) => updateField('phone', text)}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Business Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Business Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Name</Text>
              <TextInput
                style={styles.input}
                value={info.businessName}
                onChangeText={(text) => updateField('businessName', text)}
                placeholder="Your company or studio name"
                placeholderTextColor={colors.textSecondary}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={info.businessAddress}
                onChangeText={(text) => updateField('businessAddress', text)}
                placeholder="Street address, city, state, postal code"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Website</Text>
              <TextInput
                style={styles.input}
                value={info.website}
                onChangeText={(text) => updateField('website', text)}
                placeholder="https://yourwebsite.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="url"
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Save Button */}
          {hasChanges && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                console.log('User tapped Save button');
                saveInfo();
              }}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          )}
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
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d6a89',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 40,
  },
});
