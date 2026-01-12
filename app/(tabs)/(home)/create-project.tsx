
import React, { useState } from 'react';
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
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { saveProject, Artifact } from '@/utils/storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const BAUHAUS_COLORS = {
  background: '#FAFAF7',
  text: '#111111',
  textSecondary: '#555555',
  divider: '#DDDDDD',
  primary: '#1d6a89',
  cancelBackground: '#EEEEEE',
};

export default function CreateProjectScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [startDate] = useState(new Date().toISOString());
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');

  const handleAddVisuals = () => {
    const options = Platform.OS === 'web' 
      ? ['Cancel', 'Photos', 'Add URL']
      : ['Cancel', 'Camera', 'Photos', 'Documents', 'Add URL'];
    
    const cancelIndex = 0;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: cancelIndex,
        },
        async (buttonIndex) => {
          if (Platform.OS === 'web') {
            if (buttonIndex === 1) await openPhotos();
            else if (buttonIndex === 2) openURLInput();
          } else {
            if (buttonIndex === 1) await openCamera();
            else if (buttonIndex === 2) await openPhotos();
            else if (buttonIndex === 3) await openDocuments();
            else if (buttonIndex === 4) openURLInput();
          }
        }
      );
    } else {
      const alertOptions = Platform.OS === 'web'
        ? [
            { text: 'Photos', onPress: openPhotos },
            { text: 'Add URL', onPress: openURLInput },
            { text: 'Cancel', style: 'cancel' as const },
          ]
        : [
            { text: 'Camera', onPress: openCamera },
            { text: 'Photos', onPress: openPhotos },
            { text: 'Documents', onPress: openDocuments },
            { text: 'Add URL', onPress: openURLInput },
            { text: 'Cancel', style: 'cancel' as const },
          ];

      Alert.alert('Add Visuals', 'Choose source', alertOptions);
    }
  };

  const openCamera = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Camera is not available on web.');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      addArtifact('image', result.assets[0].uri);
    }
  };

  const openPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Photo library permission is needed to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log('Selected photos:', result.assets.length);
      // Add all selected photos
      result.assets.forEach(asset => {
        console.log('Adding photo:', asset.uri);
        addArtifact('image', asset.uri);
      });
    }
  };

  const openDocuments = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Document picker is not available on web.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
      });

      if (!result.canceled) {
        result.assets.forEach((asset: any) => addArtifact('document', asset.uri, asset.name));
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const openURLInput = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt('Add URL', 'Enter a URL', (url) => {
        if (url && url.trim()) {
          addArtifact('url', url.trim());
        }
      });
    } else {
      setShowUrlInput(true);
    }
  };

  const handleUrlSubmit = () => {
    if (urlValue.trim()) {
      addArtifact('url', urlValue.trim());
      setUrlValue('');
      setShowUrlInput(false);
    }
  };

  const addArtifact = (type: 'image' | 'document' | 'url', uri: string, name?: string) => {
    const newArtifact: Artifact = {
      id: Date.now().toString() + Math.random().toString(),
      type,
      uri,
      name,
    };
    console.log('Adding artifact:', newArtifact);
    setArtifacts(prev => [...prev, newArtifact]);
  };

  const removeArtifact = (id: string) => {
    setArtifacts(artifacts.filter(a => a.id !== id));
  };

  const handleSave = async () => {
    const projectTitle = title.trim() || 'Untitled Project';
    const now = new Date().toISOString();

    const newProject = {
      id: Date.now().toString(),
      title: projectTitle,
      phase: 'Framing' as const,
      costs: 0,
      hours: 0,
      updatedDate: now,
      startDate,
      artifacts,
    };

    try {
      await saveProject(newProject);
      console.log('Project saved successfully:', newProject);
      router.back();
    } catch (error) {
      console.error('Error saving project:', error);
      Alert.alert('Error', 'Failed to create project');
    }
  };

  const handleCancel = () => {
    router.back();
  };

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
              <Text style={styles.headerTitleText}>Start designing your new Project</Text>
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
        >
          {/* Project Title */}
          <View style={styles.section}>
            <Text style={styles.helper}>You can rename this later.</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter project title"
              placeholderTextColor="#999999"
              multiline
              numberOfLines={3}
              maxLength={150}
              textAlignVertical="top"
            />
          </View>

          {/* Visual Starting Points */}
          <View style={styles.section}>
            <Text style={styles.label}>Add Visuals (optional)</Text>
            <Text style={styles.helper}>
              Add photos, sketches, links, or documents to begin shaping the project.
            </Text>
            
            <TouchableOpacity style={styles.addButton} onPress={handleAddVisuals}>
              <IconSymbol 
                ios_icon_name="plus.circle" 
                android_material_icon_name="add-circle" 
                size={20} 
                color="#1d6a89" 
              />
              <Text style={styles.addButtonText}>Add Visuals</Text>
            </TouchableOpacity>

            {/* URL Input for Android/Web */}
            {showUrlInput && Platform.OS !== 'ios' && (
              <View style={styles.urlInputContainer}>
                <TextInput
                  style={styles.input}
                  value={urlValue}
                  onChangeText={setUrlValue}
                  placeholder="Enter URL"
                  placeholderTextColor="#999999"
                  autoFocus
                  keyboardType="url"
                  autoCapitalize="none"
                />
                <View style={styles.urlActions}>
                  <TouchableOpacity 
                    style={styles.urlButton} 
                    onPress={handleUrlSubmit}
                  >
                    <Text style={styles.urlButtonText}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.urlButton, styles.urlButtonCancel]} 
                    onPress={() => {
                      setShowUrlInput(false);
                      setUrlValue('');
                    }}
                  >
                    <Text style={styles.urlButtonTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Grid of Artifacts - 4 columns */}
            {artifacts.length > 0 && (
              <View style={styles.artifactsGrid}>
                {artifacts.map((artifact, index) => (
                  <View key={artifact.id} style={styles.gridItem}>
                    {artifact.type === 'image' && (
                      <Image source={{ uri: artifact.uri }} style={styles.gridThumbnail} />
                    )}
                    {artifact.type === 'document' && (
                      <View style={styles.gridThumbnail}>
                        <IconSymbol 
                          ios_icon_name="doc.fill" 
                          android_material_icon_name="description" 
                          size={24} 
                          color="#555555" 
                        />
                        <Text style={styles.documentLabel}>PDF</Text>
                      </View>
                    )}
                    {artifact.type === 'url' && (
                      <View style={styles.gridThumbnail}>
                        <IconSymbol 
                          ios_icon_name="link" 
                          android_material_icon_name="link" 
                          size={24} 
                          color="#555555" 
                        />
                        <Text style={styles.documentLabel}>URL</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeArtifact(artifact.id)}
                    >
                      <IconSymbol 
                        ios_icon_name="xmark.circle.fill" 
                        android_material_icon_name="cancel" 
                        size={20} 
                        color="#D32F2F" 
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Start Date */}
          <View style={styles.section}>
            <Text style={styles.labelSecondary}>
              Start date: {new Date(startDate).toLocaleDateString()}
            </Text>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>Start Project</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
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
    paddingBottom: 180,
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
    marginBottom: 28,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 4,
  },
  labelSecondary: {
    fontSize: 14,
    color: '#555555',
  },
  helper: {
    fontSize: 13,
    color: '#555555',
    marginBottom: 12,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111111',
    minHeight: 72,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#1d6a89',
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    color: '#1d6a89',
    fontWeight: '500',
  },
  urlInputContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1d6a89',
    borderRadius: 8,
  },
  urlActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  urlButton: {
    flex: 1,
    backgroundColor: '#1d6a89',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  urlButtonCancel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  urlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  urlButtonTextCancel: {
    color: '#555555',
    fontSize: 14,
    fontWeight: '500',
  },
  artifactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  gridItem: {
    position: 'relative',
    width: '23%',
    aspectRatio: 1,
  },
  gridThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentLabel: {
    fontSize: 10,
    color: '#555555',
    fontWeight: '500',
    marginTop: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
    gap: 12,
  },
  primaryButton: {
    backgroundColor: BAUHAUS_COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
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
  },
  secondaryButtonText: {
    color: BAUHAUS_COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
});
