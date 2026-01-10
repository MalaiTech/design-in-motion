
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { getProjects, updateProject, deleteProject, ProjectPhase, Project } from '@/utils/storage';
import { IconSymbol } from '@/components/IconSymbol';

export default function EditProjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<ProjectPhase>('Framing');
  const [saving, setSaving] = useState(false);

  const phases: ProjectPhase[] = ['Framing', 'Exploration', 'Pilot', 'Delivery', 'Finish'];

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    if (!id) {
      console.error('No project ID provided');
      return;
    }
    const projects = await getProjects();
    const foundProject = projects.find(p => p.id === id);
    if (foundProject) {
      setProject(foundProject);
      setName(foundProject.name);
      setDescription(foundProject.description);
      setSelectedPhase(foundProject.phase);
    } else {
      console.error('Project not found');
      Alert.alert('Error', 'Project not found');
      router.back();
    }
  };

  const getPhaseColor = (phase: ProjectPhase): string => {
    switch (phase) {
      case 'Framing': return colors.framingPrimary;
      case 'Exploration': return colors.explorationPrimary;
      case 'Pilot': return colors.pilotPrimary;
      case 'Delivery': return colors.deliveryPrimary;
      case 'Finish': return colors.finishPrimary;
      default: return colors.text;
    }
  };

  const getPhaseSurface = (phase: ProjectPhase): string => {
    switch (phase) {
      case 'Framing': return colors.framingSurface;
      case 'Exploration': return colors.explorationSurface;
      case 'Pilot': return colors.pilotSurface;
      case 'Delivery': return colors.deliverySurface;
      case 'Finish': return colors.finishSurface;
      default: return colors.background;
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a project name');
      return;
    }

    if (!id) {
      console.error('No project ID');
      return;
    }

    setSaving(true);
    try {
      await updateProject(id, {
        name: name.trim(),
        description: description.trim(),
        phase: selectedPhase,
      });
      router.back();
    } catch (error) {
      console.error('Error updating project:', error);
      Alert.alert('Error', 'Failed to update project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) {
              console.error('No project ID');
              return;
            }
            try {
              await deleteProject(id);
              router.back();
            } catch (error) {
              console.error('Error deleting project:', error);
              Alert.alert('Error', 'Failed to delete project. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!project) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Loading...',
          }}
        />
        <View style={[commonStyles.container, styles.loadingContainer]}>
          <Text style={commonStyles.textSecondary}>Loading project...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Project',
          headerBackTitle: 'Back',
        }}
      />
      <KeyboardAvoidingView
        style={commonStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Helper Text */}
          <Text style={[commonStyles.textSecondary, styles.helperText]}>
            Update your project details or move it to a different phase
          </Text>

          {/* Project Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Project Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mobile App Redesign"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief overview of your project..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Phase Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Current Phase</Text>
            <View style={styles.phaseGrid}>
              {phases.map((phase) => (
                <TouchableOpacity
                  key={phase}
                  style={[
                    styles.phaseButton,
                    selectedPhase === phase && {
                      backgroundColor: getPhaseSurface(phase),
                      borderColor: getPhaseColor(phase),
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedPhase(phase)}
                >
                  <View
                    style={[
                      styles.phaseIndicator,
                      { backgroundColor: getPhaseColor(phase) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.phaseButtonText,
                      selectedPhase === phase && { color: getPhaseColor(phase), fontWeight: '600' },
                    ]}
                  >
                    {phase}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              commonStyles.button,
              styles.saveButton,
              saving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Text style={commonStyles.buttonText}>Saving...</Text>
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="checkmark"
                  android_material_icon_name="check"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={[commonStyles.buttonText, styles.saveButtonText]}>
                  Save Changes
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <IconSymbol
              ios_icon_name="trash"
              android_material_icon_name="delete"
              size={20}
              color={colors.finishPrimary}
            />
            <Text style={styles.deleteButtonText}>Delete Project</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  helperText: {
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 0,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  phaseGrid: {
    gap: 12,
  },
  phaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 0,
    backgroundColor: colors.background,
  },
  phaseIndicator: {
    width: 12,
    height: 12,
    borderRadius: 0,
    marginRight: 12,
  },
  phaseButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  saveButtonText: {
    marginLeft: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.finishPrimary,
    borderRadius: 0,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.finishPrimary,
  },
});
