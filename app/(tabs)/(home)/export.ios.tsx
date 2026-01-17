
import React, { useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { exportProjectToPDF, ExportFormat } from '@/utils/pdfExport';
import { getProjects, Project } from '@/utils/storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { IconSymbol } from '@/components/IconSymbol';

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
    description: 'High-level summary with key decisions and totals',
    iosIcon: 'doc.text',
    androidIcon: 'description',
  },
  {
    id: 'process',
    title: 'Design Process Report',
    description: 'Complete design journey with framing and exploration loops',
    iosIcon: 'doc.richtext',
    androidIcon: 'article',
  },
  {
    id: 'timeline',
    title: 'Timeline',
    description: 'Chronological view of all project events',
    iosIcon: 'calendar',
    androidIcon: 'event',
  },
  {
    id: 'costs',
    title: 'Costs & Hours Report',
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

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

  const handleExportPDF = async (format: ExportFormat) => {
    if (!project) return;

    console.log('Export: Starting PDF export', format);
    setIsExporting(true);
    setExportingFormat(format);

    try {
      const pdfUri = await exportProjectToPDF(project, format);
      console.log('Export: PDF generated at', pdfUri);

      // Share the PDF
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Project',
          UTI: 'com.adobe.pdf',
        });
        console.log('Export: PDF shared successfully');
      } else {
        Alert.alert('Export Complete', 'PDF has been generated but sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Export: Error generating PDF:', error);
      Alert.alert('Export Failed', 'There was an error generating the PDF. Please try again.');
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  if (!project) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Export',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading project...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Export',
          headerBackTitle: 'Back',
        }}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Export Project</Text>
          <Text style={styles.subtitle}>{project.title}</Text>
          <Text style={styles.description}>
            Choose a format to export your project as a PDF document
          </Text>
        </View>

        <View style={styles.formatList}>
          {EXPORT_FORMATS.map((format) => (
            <TouchableOpacity
              key={format.id}
              style={[
                styles.formatCard,
                isExporting && exportingFormat === format.id && styles.formatCardExporting
              ]}
              onPress={() => handleExportPDF(format.id)}
              disabled={isExporting}
            >
              <View style={styles.formatIcon}>
                <IconSymbol 
                  ios_icon_name={format.iosIcon} 
                  android_material_icon_name={format.androidIcon} 
                  size={32} 
                  color={colors.primary} 
                />
              </View>
              
              <View style={styles.formatContent}>
                <Text style={styles.formatTitle}>{format.title}</Text>
                <Text style={styles.formatDescription}>{format.description}</Text>
              </View>

              {isExporting && exportingFormat === format.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <IconSymbol 
                  ios_icon_name="chevron.right" 
                  android_material_icon_name="chevron-right" 
                  size={24} 
                  color={colors.textSecondary} 
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {isExporting && (
          <View style={styles.exportingBanner}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.exportingText}>
              Generating PDF... This may take a moment for reports with many images.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  formatList: {
    gap: 12,
  },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  formatCardExporting: {
    opacity: 0.6,
  },
  formatIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceFraming,
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
  formatDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  exportingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceFraming,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  exportingText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
});
