
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getProjects, updateProject, deleteProject, Project } from '@/utils/storage';

const BAUHAUS_COLORS = {
  background: '#FAFAF7',
  text: '#111111',
  textSecondary: '#555555',
  divider: '#DDDDDD',
  primary: '#1d6a89',
  destructive: '#D32F2F',
  cancelBackground: '#EEEEEE',
};

export default function EditProjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Refs for debounced save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    loadProject();
    
    return () => {
      // Clear timeout on unmount
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save any pending changes
      if (hasUnsavedChanges.current && project) {
        handleSaveImmediate();
      }
    };
  }, [id]);

  const loadProject = async () => {
    console.log('Loading project with id:', id);
    const projects = await getProjects();
    const foundProject = projects.find(p => p.id === id);
    if (foundProject) {
      console.log('Project loaded:', foundProject.title);
      setProject(foundProject);
      setTitle(foundProject.title);
      setStartDate(new Date(foundProject.startDate));
    }
  };

  // Debounced save
  const markAsChanged = useCallback(() => {
    hasUnsavedChanges.current = true;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Schedule save after 700ms of no changes
    saveTimeoutRef.current = setTimeout(() => {
      handleSaveImmediate();
    }, 700);
  }, [project, title, startDate]);

  const handleSaveImmediate = async () => {
    if (!project) return;

    console.log('Saving project changes:', title);
    const updatedProject: Project = {
      ...project,
      title: title.trim() || 'Untitled Project',
      startDate: startDate.toISOString(),
      updatedDate: new Date().toISOString(),
    };

    await updateProject(updatedProject);
    setProject(updatedProject);
    hasUnsavedChanges.current = false;
    console.log('Project updated successfully');
  };

  const handleSave = async () => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    await handleSaveImmediate();
    router.back();
  };

  const handleDelete = () => {
    console.log('User tapped Delete Project button');
    Alert.alert(
      'Delete Project',
      'This will permanently delete the project and all its data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (project) {
              console.log('Deleting project:', project.title);
              await deleteProject(project.id);
              console.log('Project deleted successfully');
              router.back();
            }
          },
        },
      ]
    );
  };

  if (!project) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: '',
            headerStyle: { backgroundColor: '#FAFAF7' },
            headerTintColor: '#111111',
          }}
        />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: '#FAFAF7' },
          headerTintColor: '#111111',
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <Image 
                source={require('@/assets/images/a01ea08f-54b3-4fdb-aa75-b084bc2b1f09.png')} 
                style={styles.headerIcon}
                resizeMode="contain"
              />
              <Text style={styles.headerTitleText}>Edit Project</Text>
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Project Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Project Name</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                markAsChanged();
              }}
              onBlur={() => {
                // Save on blur
                if (hasUnsavedChanges.current) {
                  handleSaveImmediate();
                }
              }}
              placeholder="Enter project name"
              placeholderTextColor={BAUHAUS_COLORS.textSecondary}
              multiline
              numberOfLines={3}
              maxLength={150}
              textAlignVertical="top"
              returnKeyType="default"
              blurOnSubmit={false}
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
            />
          </View>

          {/* Start Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => {
                console.log('User tapped date picker');
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    console.log('Date changed to:', selectedDate.toLocaleDateString());
                    setStartDate(selectedDate);
                    markAsChanged();
                  }
                }}
              />
            )}
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleSave}
          >
            <Text style={styles.primaryButtonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              console.log('User tapped Cancel button');
              router.back();
            }}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.deleteSection}>
            <TouchableOpacity
              style={styles.destructiveButton}
              onPress={handleDelete}
            >
              <Text style={styles.destructiveButtonText}>Delete Project</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BAUHAUS_COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 280,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 60,
  },
  headerIcon: {
    width: 32,
    height: 32,
  },
  headerTitleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: BAUHAUS_COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BAUHAUS_COLORS.divider,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: BAUHAUS_COLORS.text,
    minHeight: 72,
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BAUHAUS_COLORS.divider,
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: BAUHAUS_COLORS.text,
  },
  actions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: BAUHAUS_COLORS.background,
    borderTopWidth: 1,
    borderTopColor: BAUHAUS_COLORS.divider,
  },
  primaryButton: {
    backgroundColor: BAUHAUS_COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: BAUHAUS_COLORS.cancelBackground,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: BAUHAUS_COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  deleteSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: BAUHAUS_COLORS.divider,
  },
  destructiveButton: {
    backgroundColor: BAUHAUS_COLORS.destructive,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    fontSize: 16,
    color: BAUHAUS_COLORS.text,
    padding: 20,
  },
});
