
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
  ActionSheetIOS,
  Image,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { IconSymbol } from '@/components/IconSymbol';
import { getProjects, updateProject, deleteProject, Project, ProjectPhase, Artifact } from '@/utils/storage';

const BAUHAUS_COLORS = {
  background: '#FAFAF7',
  text: '#111111',
  textSecondary: '#555555',
  divider: '#DDDDDD',
  primary: '#1d6a89',
  destructive: '#D32F2F',
};

const phases: ProjectPhase[] = ['Framing', 'Exploration', 'Pilot', 'Delivery', 'Finish'];

export default function EditProjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<ProjectPhase>('Framing');
  const [startDate, setStartDate] = useState(new Date());
  const [costs, setCosts] = useState('0');
  const [hours, setHours] = useState('0');
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    const projects = await getProjects();
    const foundProject = projects.find(p => p.id === id);
    if (foundProject) {
      setProject(foundProject);
      setTitle(foundProject.title);
      setPhase(foundProject.phase);
      setStartDate(new Date(foundProject.startDate));
      setCosts(foundProject.costs?.toString() || '0');
      setHours(foundProject.hours?.toString() || '0');
      setArtifacts(foundProject.artifacts || []);
    }
  };

  const handleSave = async () => {
    if (!project) return;

    const updatedProject: Project = {
      ...project,
      title: title.trim() || 'Untitled Project',
      phase,
      startDate: startDate.toISOString(),
      costs: parseFloat(costs) || 0,
      hours: parseFloat(hours) || 0,
      artifacts,
      updatedDate: new Date().toISOString(),
    };

    await updateProject(updatedProject);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete project?',
      'This will remove the project and its data from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (project) {
              await deleteProject(project.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleAddArtifact = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Camera', 'Photos', 'Documents', 'Add URL'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) openCamera();
          else if (buttonIndex === 2) openPhotos();
          else if (buttonIndex === 3) openDocuments();
          else if (buttonIndex === 4) setShowUrlInput(true);
        }
      );
    } else {
      Alert.alert('Add Artifact', 'Choose source', [
        { text: 'Camera', onPress: openCamera },
        { text: 'Photos', onPress: openPhotos },
        { text: 'Documents', onPress: openDocuments },
        { text: 'Add URL', onPress: () => setShowUrlInput(true) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      addArtifact('image', result.assets[0].uri);
    }
  };

  const openPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      addArtifact('image', result.assets[0].uri);
    }
  };

  const openDocuments = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      addArtifact('document', result.assets[0].uri);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      addArtifact('url', urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const addArtifact = (type: 'image' | 'document' | 'url', uri: string) => {
    const newArtifact: Artifact = {
      id: Date.now().toString(),
      type,
      uri,
      caption: '',
    };
    setArtifacts([...artifacts, newArtifact]);
  };

  const removeArtifact = (artifactId: string) => {
    Alert.alert(
      'Remove artifact?',
      'Are you sure you want to remove this artifact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setArtifacts(artifacts.filter(a => a.id !== artifactId));
          },
        },
      ]
    );
  };

  const updateArtifactCaption = (artifactId: string, caption: string) => {
    setArtifacts(artifacts.map(a => 
      a.id === artifactId ? { ...a, caption } : a
    ));
  };

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Project', headerBackTitle: 'Back' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.label}>Project title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Project title"
            placeholderTextColor={BAUHAUS_COLORS.textSecondary}
          />

          <Text style={styles.label}>Phase</Text>
          <View style={styles.phaseContainer}>
            {phases.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.phaseButton,
                  phase === p && styles.phaseButtonActive,
                ]}
                onPress={() => setPhase(p)}
              >
                <Text style={[
                  styles.phaseButtonText,
                  phase === p && styles.phaseButtonTextActive,
                ]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Start Date</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
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

          <Text style={styles.label}>Costs</Text>
          <TextInput
            style={styles.input}
            value={costs}
            onChangeText={setCosts}
            placeholder="0"
            keyboardType="decimal-pad"
            placeholderTextColor={BAUHAUS_COLORS.textSecondary}
          />

          <Text style={styles.label}>Hours</Text>
          <TextInput
            style={styles.input}
            value={hours}
            onChangeText={setHours}
            placeholder="0"
            keyboardType="decimal-pad"
            placeholderTextColor={BAUHAUS_COLORS.textSecondary}
          />

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Artifacts</Text>
          
          {artifacts.length > 0 && (
            <View style={styles.artifactGrid}>
              {artifacts.map((artifact) => (
                <View key={artifact.id} style={styles.artifactItem}>
                  {artifact.type === 'image' ? (
                    <Image source={{ uri: artifact.uri }} style={styles.artifactImage} />
                  ) : (
                    <View style={styles.artifactPlaceholder}>
                      <IconSymbol
                        ios_icon_name={artifact.type === 'document' ? 'doc.text' : 'link'}
                        android_material_icon_name={artifact.type === 'document' ? 'description' : 'link'}
                        size={24}
                        color={BAUHAUS_COLORS.textSecondary}
                      />
                    </View>
                  )}
                  <TextInput
                    style={styles.captionInput}
                    value={artifact.caption}
                    onChangeText={(text) => updateArtifactCaption(artifact.id, text)}
                    placeholder="Caption"
                    placeholderTextColor={BAUHAUS_COLORS.textSecondary}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeArtifact(artifact.id)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.addArtifactButton} onPress={handleAddArtifact}>
            <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={20} color={BAUHAUS_COLORS.primary} />
            <Text style={styles.addArtifactText}>Add artifact</Text>
          </TouchableOpacity>

          {showUrlInput && (
            <View style={styles.urlInputContainer}>
              <TextInput
                style={styles.input}
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="Enter URL"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={BAUHAUS_COLORS.textSecondary}
              />
              <View style={styles.urlButtonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => {
                    setUrlInput('');
                    setShowUrlInput(false);
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleUrlSubmit}
                >
                  <Text style={styles.primaryButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.deleteSection}>
            <TouchableOpacity
              style={[styles.button, styles.destructiveButton]}
              onPress={handleDelete}
            >
              <Text style={styles.destructiveButtonText}>Delete Project</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: BAUHAUS_COLORS.text,
    marginTop: 16,
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
  },
  phaseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  phaseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BAUHAUS_COLORS.divider,
    backgroundColor: '#FFFFFF',
  },
  phaseButtonActive: {
    backgroundColor: BAUHAUS_COLORS.primary,
    borderColor: BAUHAUS_COLORS.primary,
  },
  phaseButtonText: {
    fontSize: 14,
    color: BAUHAUS_COLORS.text,
  },
  phaseButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 16,
    color: BAUHAUS_COLORS.textSecondary,
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: BAUHAUS_COLORS.divider,
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BAUHAUS_COLORS.text,
    marginBottom: 16,
  },
  artifactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  artifactItem: {
    width: 100,
  },
  artifactImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  artifactPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionInput: {
    marginTop: 4,
    fontSize: 12,
    color: BAUHAUS_COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: BAUHAUS_COLORS.divider,
    paddingVertical: 4,
  },
  removeButton: {
    marginTop: 4,
    paddingVertical: 4,
  },
  removeButtonText: {
    fontSize: 12,
    color: BAUHAUS_COLORS.destructive,
  },
  addArtifactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: BAUHAUS_COLORS.divider,
    borderRadius: 8,
    borderStyle: 'dashed',
    gap: 8,
  },
  addArtifactText: {
    fontSize: 16,
    color: BAUHAUS_COLORS.primary,
  },
  urlInputContainer: {
    marginTop: 16,
    gap: 12,
  },
  urlButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: BAUHAUS_COLORS.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BAUHAUS_COLORS.divider,
    flex: 1,
  },
  secondaryButtonText: {
    color: BAUHAUS_COLORS.text,
    fontSize: 16,
  },
  deleteSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: BAUHAUS_COLORS.divider,
  },
  destructiveButton: {
    backgroundColor: BAUHAUS_COLORS.destructive,
  },
  destructiveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    fontSize: 16,
    color: BAUHAUS_COLORS.text,
  },
});
