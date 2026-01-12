
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { ProjectPhase } from '@/utils/storage';

export type SortOption = 'startDate' | 'updatedDate' | 'status';

interface FilterSortModalProps {
  visible: boolean;
  onClose: () => void;
  selectedStatuses: ProjectPhase[];
  sortOption: SortOption;
  onApply: (statuses: ProjectPhase[], sort: SortOption) => void;
}

const statusOptions: ProjectPhase[] = ['Framing', 'Exploration', 'Pilot', 'Delivery', 'Finish'];

export default function FilterSortModal({
  visible,
  onClose,
  selectedStatuses,
  sortOption,
  onApply,
}: FilterSortModalProps) {
  const [tempStatuses, setTempStatuses] = useState<ProjectPhase[]>(selectedStatuses);
  const [tempSort, setTempSort] = useState<SortOption>(sortOption);

  const toggleStatus = (status: ProjectPhase) => {
    if (tempStatuses.includes(status)) {
      setTempStatuses(tempStatuses.filter(s => s !== status));
    } else {
      setTempStatuses([...tempStatuses, status]);
    }
  };

  const handleApply = () => {
    onApply(tempStatuses, tempSort);
    onClose();
  };

  const handleReset = () => {
    setTempStatuses([]);
    setTempSort('startDate');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Filter by Status</Text>
              <Text style={styles.sectionSubtitle}>Multiple selection possible</Text>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.checkboxRow}
                  onPress={() => toggleStatus(status)}
                >
                  <View style={styles.checkbox}>
                    {tempStatuses.includes(status) && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={18}
                        color={colors.text}
                      />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort by</Text>
              {[
                { value: 'startDate' as SortOption, label: 'Starting Date (Newest to Oldest)' },
                { value: 'updatedDate' as SortOption, label: 'Latest Update' },
                { value: 'status' as SortOption, label: 'Status' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.radioRow}
                  onPress={() => setTempSort(option.value)}
                >
                  <View style={styles.radio}>
                    {tempSort === option.value && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    width: '85%',
    maxHeight: '80%',
    borderRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  scrollContent: {
    maxHeight: 400,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.text,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.text,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.text,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
