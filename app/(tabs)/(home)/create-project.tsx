
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

// Conditionally import DocumentPicker only on native platforms
let DocumentPicker: any = null;
if (Platform.OS !== 'web') {
  DocumentPicker = require('expo-document-picker');
}

export default function CreateProjectScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [startDate] = useState(new Date().toISOString());
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');

  const handleAddArtifact = () => {
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

      Alert.alert('Add Artifact', 'Choose source', alertOptions);
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

    if (!result.canceled) {
      result.assets.forEach(asset => addArtifact('image', asset.uri));
    }
  };

  const openDocuments = async () => {
    if (Platform.OS === 'web' || !DocumentPicker) {
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
    setArtifacts([...artifacts, newArtifact]);
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
          title: 'Start Project',
          headerStyle: { backgroundColor: '#FAFAF7' },
          headerTintColor: '#111111',
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
            <Text style={styles.label}>Project title</Text>
            <Text style={styles.helper}>You can rename this later.</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter project title"
              placeholderTextColor="#999999"
            />
          </View>

          {/* Visual Starting Points */}
          <View style={styles.section}>
            <Text style={styles.label}>Visual Starting Points</Text>
            <Text style={styles.helper}>
              Add photos, sketches, links, or documents to begin shaping the project.
            </Text>
            
            <TouchableOpacity style={styles.addButton} onPress={handleAddArtifact}>
              <IconSymbol 
                ios_icon_name="plus.circle" 
                android_material_icon_name="add-circle" 
                size={20} 
                color="#1d6a89" 
              />
              <Text style={styles.addButtonText}>Add Artifact</Text>
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

            {artifacts.length > 0 && (
              <View style={styles.artifactsContainer}>
                {artifacts.map((artifact) => (
                  <View key={artifact.id} style={styles.artifactItem}>
                    {artifact.type === 'image' && (
                      <Image source={{ uri: artifact.uri }} style={styles.thumbnail} />
                    )}
                    {artifact.type === 'document' && (
                      <View style={styles.documentThumb}>
                        <IconSymbol 
                          ios_icon_name="doc" 
                          android_material_icon_name="description" 
                          size={24} 
                          color="#555555" 
                        />
                        {artifact.name && (
                          <Text style={styles.documentName} numberOfLines={1}>
                            {artifact.name}
                          </Text>
                        )}
                      </View>
                    )}
                    {artifact.type === 'url' && (
                      <View style={styles.documentThumb}>
                        <IconSymbol 
                          ios_icon_name="link" 
                          android_material_icon_name="link" 
                          size={24} 
                          color="#555555" 
                        />
                        <Text style={styles.documentName} numberOfLines={2}>
                          {artifact.uri}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.removeButton}
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
    backgroundColor: '#FAFAF7',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 140,
  },
  section: {
    marginBottom: 32,
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
  artifactsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  artifactItem: {
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#EEEEEE',
  },
  documentThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  documentName: {
    fontSize: 9,
    color: '#555555',
    textAlign: 'center',
    marginTop: 4,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FAFAF7',
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#1d6a89',
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
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#555555',
    fontSize: 16,
    fontWeight: '500',
  },
});
