
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { getProjects, Project } from '@/utils/storage';
import * as Sharing from 'expo-sharing';

type ExportFormat = 'executive' | 'process' | 'timeline' | 'costs';

interface FormatOption {
  id: ExportFormat;
  title: string;
  description: string;
  iosIcon: string;
  androidIcon: string;
}

const EXPORT_FORMATS: FormatOption[] = [
  {
    id: 'executive',
    title: 'Executive Overview',
    description: 'High-level summary with key decisions and outcomes',
    iosIcon: 'doc.text',
    androidIcon: 'description',
  },
  {
    id: 'process',
    title: 'Design Process',
    description: 'Complete framing and exploration documentation',
    iosIcon: 'arrow.triangle.2.circlepath',
    androidIcon: 'refresh',
  },
  {
    id: 'timeline',
    title: 'Timeline',
    description: 'Chronological view of project evolution',
    iosIcon: 'calendar',
    androidIcon: 'calendar-today',
  },
  {
    id: 'costs',
    title: 'Hours & Costs',
    description: 'Detailed breakdown of time and expenses',
    iosIcon: 'dollarsign.circle',
    androidIcon: 'attach-money',
  },
];

export default function ExportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('executive');

  const loadProject = useCallback(async () => {
    console.log('Export: Loading project', projectId);
    const projects = await getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
    } else {
      Alert.alert('Project Not Found', 'This project no longer exists.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [projectId, router]);

  useFocusEffect(
    useCallback(() => {
      loadProject();
    }, [loadProject])
  );

  const handleExportPDF = async () => {
    if (!project) return;

    console.log('Export: User tapped Export PDF button', {
      projectId: project.id,
      projectTitle: project.title,
      selectedFormat,
    });

    // TODO: Backend Integration - Generate PDF based on selected format
    // For now, show a placeholder alert
    Alert.alert(
      'Export PDF',
      `Exporting "${project.title}" as ${EXPORT_FORMATS.find(f => f.id === selectedFormat)?.title}.\n\nPDF generation will be implemented in the next phase.`,
      [{ text: 'OK' }]
    );

    // Future implementation will:
    // 1. Generate PDF based on selectedFormat
    // 2. Save to temporary location
    // 3. Open iOS Share Sheet with Sharing.shareAsync()
  };

  if (!project) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Export',
            headerShown: true,
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading project...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Export',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Project Context */}
        <View style={styles.headerSection}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <Text style={styles.projectContext}>
            {project.phase} • Started {new Date(project.startDate).toLocaleDateString()}
          </Text>
        </View>

        {/* Export Format Selector */}
        <View style={styles.formatsSection}>
          <Text style={styles.sectionTitle}>Select Export Format</Text>
          
          <View style={styles.formatsList}>
            {EXPORT_FORMATS.map((format) => (
              <TouchableOpacity
                key={format.id}
                style={[
                  styles.formatOption,
                  selectedFormat === format.id && styles.formatOptionSelected,
                ]}
                onPress={() => {
                  console.log('Export: User selected format', format.id);
                  setSelectedFormat(format.id);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.formatRadio}>
                  {selectedFormat === format.id ? (
                    <View style={styles.formatRadioSelected} />
                  ) : null}
                </View>
                
                <View style={styles.formatIcon}>
                  <IconSymbol
                    ios_icon_name={format.iosIcon}
                    android_material_icon_name={format.androidIcon}
                    size={24}
                    color={selectedFormat === format.id ? colors.primary : colors.textSecondary}
                  />
                </View>
                
                <View style={styles.formatContent}>
                  <Text style={[
                    styles.formatTitle,
                    selectedFormat === format.id && styles.formatTitleSelected,
                  ]}>
                    {format.title}
                  </Text>
                  <Text style={styles.formatDescription}>
                    {format.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Export Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportPDF}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="arrow.down.doc"
              android_material_icon_name="download"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  
  // Header Section
  headerSection: {
    marginBottom: 32,
  },
  projectTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  projectContext: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  
  // Formats Section
  formatsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  formatsList: {
    gap: 12,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 2,
    borderColor: colors.divider,
    gap: 16,
  },
  formatOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0F7FA',
  },
  formatRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  formatIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  formatContent: {
    flex: 1,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  formatTitleSelected: {
    color: colors.primary,
  },
  formatDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  
  // Action Section
  actionSection: {
    marginTop: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    gap: 8,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
