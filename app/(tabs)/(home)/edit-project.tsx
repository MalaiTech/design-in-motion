
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Keyboard,
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

  const loadProject = useCallback(async () => {
    const projects = await getProjects();
    const foundProject = projects.find(p => p.id === id);
    if (foundProject) {
      setProject(foundProject);
      setTitle(foundProject.title);
      setStartDate(new Date(foundProject.startDate));
    }
  }, [id]);

  useEffect(() => {
    console.log('EditProject: Loading project', id);
    loadProject();
  }, [loadProject]);

  const handleSave = async () => {
    if (!project) return;

    console.log('EditProject: Saving project changes');
    Keyboard.dismiss();

    const updatedProject: Project = {
      ...project,
      title: title.trim() || 'Untitled Project',
      startDate: startDate.toISOString(),
      updatedDate: new Date().toISOString(),
    };

    await updateProject(updatedProject);
    router.back();
  };

  const handleDelete = () => {
    console.log('EditProject: Delete button pressed');
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
              console.log('EditProject: Deleting project', project.id);
              await deleteProject(project.id);
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
        keyboardVerticalOffset={100}
      >
        <View style={styles.content}>
          {/* Project Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Project Name</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter project name"
              placeholderTextColor={BAUHAUS_COLORS.textSecondary}
              multiline
              numberOfLines={3}
              maxLength={150}
              textAlignVertical="top"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              blurOnSubmit={true}
            />
          </View>

          {/* Start Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
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
                  if (selectedDate) setStartDate(selectedDate);
                }}
              />
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              console.log('EditProject: Cancel button pressed');
              Keyboard.dismiss();
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
  content: {
    padding: 20,
    paddingTop: 12,
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
