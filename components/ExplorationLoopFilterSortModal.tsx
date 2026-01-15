
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

export type LoopStatus = 'draft' | 'active' | 'paused' | 'completed';
export type LoopSortOption = 'startDate' | 'updatedDate' | 'status';
export type SortDirection = 'asc' | 'desc';

interface ExplorationLoopFilterSortModalProps {
  visible: boolean;
  onClose: () => void;
  selectedStatuses: LoopStatus[];
  sortOption: LoopSortOption;
  sortDirection: SortDirection;
  onApply: (statuses: LoopStatus[], sort: LoopSortOption, direction: SortDirection) => void;
}

const statusOptions: LoopStatus[] = ['draft', 'active', 'paused', 'completed'];

const getStatusLabel = (status: LoopStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function ExplorationLoopFilterSortModal({
  visible,
  onClose,
  selectedStatuses,
  sortOption,
  sortDirection,
  onApply,
}: ExplorationLoopFilterSortModalProps) {
  const [tempStatuses, setTempStatuses] = useState<LoopStatus[]>(selectedStatuses);
  const [tempSort, setTempSort] = useState<LoopSortOption>(sortOption);
  const [tempDirection, setTempDirection] = useState<SortDirection>(sortDirection);

  const toggleStatus = (status: LoopStatus) => {
    if (tempStatuses.includes(status)) {
      setTempStatuses(tempStatuses.filter(s => s !== status));
    } else {
      setTempStatuses([...tempStatuses, status]);
    }
  };

  const handleSortSelect = (option: LoopSortOption) => {
    if (tempSort === option) {
      // Toggle direction if same option selected
      setTempDirection(tempDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new option with default direction
      setTempSort(option);
      setTempDirection(option === 'startDate' || option === 'updatedDate' ? 'desc' : 'asc');
    }
  };

  const handleApply = () => {
    onApply(tempStatuses, tempSort, tempDirection);
    onClose();
  };

  const handleReset = () => {
    setTempStatuses([]);
    setTempSort('startDate');
    setTempDirection('desc');
  };

  const getSortLabel = (option: LoopSortOption): string => {
    switch (option) {
      case 'startDate':
        return 'Starting Date';
      case 'updatedDate':
        return 'Latest Update';
      case 'status':
        return 'Status';
      default:
        return '';
    }
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
                  <Text style={styles.checkboxLabel}>{getStatusLabel(status)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort by</Text>
              <Text style={styles.sectionSubtitle}>Tap to toggle ascending/descending</Text>
              {[
                { value: 'startDate' as LoopSortOption },
                { value: 'updatedDate' as LoopSortOption },
                { value: 'status' as LoopSortOption },
              ].map((option) => {
                const isSelected = tempSort === option.value;
                const showAsc = isSelected && tempDirection === 'asc';
                const showDesc = isSelected && tempDirection === 'desc';
                
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.sortRow}
                    onPress={() => handleSortSelect(option.value)}
                  >
                    <View style={styles.sortLeft}>
                      <View style={styles.radio}>
                        {isSelected && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>{getSortLabel(option.value)}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.directionIndicator}>
                        {showDesc && (
                          <IconSymbol
                            ios_icon_name="arrow.down"
                            android_material_icon_name="arrow-downward"
                            size={20}
                            color={colors.text}
                          />
                        )}
                        {showAsc && (
                          <IconSymbol
                            ios_icon_name="arrow.up"
                            android_material_icon_name="arrow-upward"
                            size={20}
                            color={colors.text}
                          />
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
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
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  sortLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  directionIndicator: {
    marginLeft: 8,
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
