
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Dimensions,
  Keyboard,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import {
  getProjects,
  updateProject,
  Project,
  Artifact,
  CertaintyItem,
  DesignSpaceItem,
  ExplorationQuestion,
  FramingDecision,
  ExplorationLoop,
} from '@/utils/storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import ZoomableImage from '@/components/ZoomableImage';
import * as MediaLibrary from 'expo-media-library';

type CertaintyCategory = 'known' | 'assumed' | 'unknown';

const THUMBNAIL_SIZE = (Dimensions.get('window').width - 48 - 36) / 4; // 4 columns with padding

export default function FramingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.id as string;

  // Single source of truth for project data
  const [project, setProject] = useState<Project | null>(null);
  
  // UI state only
  const [selectedCertaintyCategory, setSelectedCertaintyCategory] = useState<CertaintyCategory>('known');
  const [showArtifactOverlay, setShowArtifactOverlay] = useState(false);
  const [showDecisionOverlay, setShowDecisionOverlay] = useState(false);
  const [showArtifactViewer, setShowArtifactViewer] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  
  // Decision form state
  const [decisionSummary, setDecisionSummary] = useState('');
  const [editingDecisionId, setEditingDecisionId] = useState<string | null>(null);
  
  // Refs for temporary input values (prevents re-renders during typing)
  const opportunityOriginRef = useRef('');
  const purposeRef = useRef('');
  const newCertaintyTextRef = useRef('');
  const newDesignSpaceTextRef = useRef('');
  const newQuestionTextRef = useRef('');
  
  // FIXED: Add state to force re-render of input fields
  const [certaintyInputKey, setCertaintyInputKey] = useState(0);
  const [designSpaceInputKey, setDesignSpaceInputKey] = useState(0);
  const [questionInputKey, setQuestionInputKey] = useState(0);
  
  // Ref for ScrollView to enable programmatic scrolling
  const scrollViewRef = useRef<ScrollView>(null);

  const loadProject = useCallback(async () => {
    console.log('Framing: Loading project', projectId);
    const projects = await getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
      opportunityOriginRef.current = found.opportunityOrigin || '';
      purposeRef.current = found.purpose || '';
    } else {
      Alert.alert('Project Not Found', 'This project no longer exists.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [projectId, router]);

  // Save text fields immediately to AsyncStorage
  const saveTextField = useCallback(async (field: 'opportunityOrigin' | 'purpose', value: string) => {
    if (!project) return;
    
    console.log(`Framing: Saving ${field} to AsyncStorage`);
    const updatedProject: Project = {
      ...project,
      [field]: value,
      updatedDate: new Date().toISOString(),
    };
    
    // Update both state and AsyncStorage immediately
    setProject(updatedProject);
    await updateProject(updatedProject);
  }, [project]);

  useFocusEffect(
    useCallback(() => {
      loadProject();
    }, [loadProject])
  );

  // Helper to update project state and save to AsyncStorage
  const updateAndSaveProject = useCallback(async (updates: Partial<Project>) => {
    if (!project) return;
    
    const updatedProject = { 
      ...project, 
      ...updates,
      updatedDate: new Date().toISOString(),
    };
    
    setProject(updatedProject);
    await updateProject(updatedProject);
  }, [project]);

  // Artifact management - UPDATED to support multiple photo selection and PDF-only documents
  const handleAddArtifact = async (type: 'camera' | 'photo' | 'document' | 'url') => {
    if (!project) return;
    
    console.log('Framing: Adding artifact of type', type);
    try {
      if (type === 'url') {
        Alert.prompt(
          'Add URL',
          'Enter the URL of the artifact',
          async (url) => {
            if (url && url.trim()) {
              const newArtifact: Artifact = {
                id: Date.now().toString(),
                type: 'url',
                uri: url.trim(),
                name: 'URL Artifact',
              };
              
              // FIXED: Add to both project.artifacts AND framingArtifactIds
              const updatedArtifacts = [...project.artifacts, newArtifact];
              const updatedFramingIds = [...(project.framingArtifactIds || []), newArtifact.id];
              
              await updateAndSaveProject({ 
                artifacts: updatedArtifacts,
                framingArtifactIds: updatedFramingIds,
              });
              setShowArtifactOverlay(false);
            }
          }
        );
        return;
      }
      
      let result: any = null;
      
      if (type === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      } else if (type === 'photo') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Photo library permission is needed.');
          return;
        }
        // UPDATED: Enable multiple selection
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsMultipleSelection: true,
        });
      } else {
        // FIXED: Restrict to PDF documents only
        result = await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
          copyToCacheDirectory: true,
        });
      }
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // UPDATED: Handle multiple assets
        const newArtifacts: Artifact[] = result.assets.map((asset, index) => ({
          id: `${Date.now()}_${index}`,
          type: type === 'document' ? 'document' : 'image',
          uri: asset.uri,
          name: asset.name || 'Untitled',
        }));
        
        // FIXED: Add to both project.artifacts AND framingArtifactIds
        const updatedArtifacts = [...project.artifacts, ...newArtifacts];
        const newArtifactIds = newArtifacts.map(a => a.id);
        const updatedFramingIds = [...(project.framingArtifactIds || []), ...newArtifactIds];
        
        console.log('Framing: Adding', newArtifacts.length, 'artifacts. Total framing artifacts:', updatedFramingIds.length);
        
        await updateAndSaveProject({ 
          artifacts: updatedArtifacts,
          framingArtifactIds: updatedFramingIds,
        });
        setShowArtifactOverlay(false);
      }
    } catch (error) {
      console.error('Framing: Error adding artifact:', error);
      Alert.alert('Error', 'Failed to add artifact.');
    }
  };

  const handleDeleteArtifact = async (artifactId: string) => {
    if (!project) return;
    
    console.log('Framing: Deleting artifact', artifactId);
    Alert.alert(
      'Delete Artifact',
      'Are you sure you want to delete this artifact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // FIXED: Remove from both project.artifacts AND framingArtifactIds
            const updatedArtifacts = project.artifacts.filter(a => a.id !== artifactId);
            const updatedFramingIds = (project.framingArtifactIds || []).filter(id => id !== artifactId);
            
            await updateAndSaveProject({ 
              artifacts: updatedArtifacts,
              framingArtifactIds: updatedFramingIds,
            });
            setShowArtifactViewer(false);
          }
        }
      ]
    );
  };

  const handleToggleArtifactFavorite = async (artifactId: string) => {
    if (!project) return;
    
    console.log('Framing: Toggling artifact favorite', artifactId);
    const updatedArtifacts = project.artifacts.map(a => 
      a.id === artifactId ? { ...a, isFavorite: !a.isFavorite } : a
    );
    
    await updateAndSaveProject({ artifacts: updatedArtifacts });
  };

  // Download artifact to device photo library
  const handleDownloadArtifact = async (artifact: Artifact) => {
    if (artifact.type !== 'image') {
      Alert.alert('Not Supported', 'Only images can be downloaded to your photo library.');
      return;
    }
    
    console.log('Framing: Downloading artifact to photo library', artifact.uri);
    
    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library permission is needed to save images.');
        return;
      }
      
      // Save to library
      await MediaLibrary.saveToLibraryAsync(artifact.uri);
      Alert.alert('Success', 'Image saved to your photo library.');
      console.log('Framing: Image saved successfully');
    } catch (error) {
      console.error('Framing: Error downloading artifact:', error);
      Alert.alert('Error', 'Failed to save image to photo library.');
    }
  };

  // FIXED: Use same approach as Project Overview screen for opening documents
  const handleOpenArtifact = async (artifact: Artifact) => {
    console.log('Framing: Attempting to open artifact', artifact.type, artifact.uri);
    
    try {
      if (artifact.type === 'url') {
        // For web URLs, use Linking.openURL to open in browser
        let url = artifact.uri.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot open this URL. Please check the URL format.');
        }
      } else if (artifact.type === 'document') {
        // FIXED: For local documents, use Sharing to open with system apps (same as Project Overview)
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(artifact.uri, {
            dialogTitle: 'Open with...',
            UTI: 'public.item',
          });
        } else {
          Alert.alert('Not Available', 'File sharing is not available on this device');
        }
      } else {
        // For images, show in viewer
        setSelectedArtifact(artifact);
        setShowArtifactViewer(true);
      }
    } catch (error) {
      console.error('Framing: Error opening artifact:', error);
      Alert.alert('Error', 'Failed to open artifact. Please try again.');
    }
  };

  // FIXED: Clear input after adding certainty item
  const handleAddCertaintyItem = async () => {
    if (!project || !newCertaintyTextRef.current.trim()) return;
    
    console.log('Framing: Adding certainty item');
    const newItem: CertaintyItem = {
      id: Date.now().toString(),
      text: newCertaintyTextRef.current.trim(),
      category: selectedCertaintyCategory,
    };
    
    const updatedItems = [...(project.certaintyItems || []), newItem];
    await updateAndSaveProject({ certaintyItems: updatedItems });
    
    // FIXED: Clear ref and force input re-render
    newCertaintyTextRef.current = '';
    setCertaintyInputKey(prev => prev + 1);
    Keyboard.dismiss();
  };

  const handleDeleteCertaintyItem = async (id: string) => {
    if (!project) return;
    console.log('Framing: Deleting certainty item', id);
    const updatedItems = (project.certaintyItems || []).filter(item => item.id !== id);
    await updateAndSaveProject({ certaintyItems: updatedItems });
  };

  const handleEditCertaintyItem = async (id: string, newText: string) => {
    if (!project || !newText.trim()) return;
    console.log('Framing: Editing certainty item', id);
    const updatedItems = (project.certaintyItems || []).map(item => 
      item.id === id ? { ...item, text: newText.trim() } : item
    );
    await updateAndSaveProject({ certaintyItems: updatedItems });
  };

  // FIXED: Clear input after adding design space item
  const handleAddDesignSpaceItem = async () => {
    if (!project || !newDesignSpaceTextRef.current.trim()) return;
    
    console.log('Framing: Adding design space item');
    const newItem: DesignSpaceItem = {
      id: Date.now().toString(),
      text: newDesignSpaceTextRef.current.trim(),
    };
    
    const updatedItems = [...(project.designSpaceItems || []), newItem];
    await updateAndSaveProject({ designSpaceItems: updatedItems });
    
    // FIXED: Clear ref and force input re-render
    newDesignSpaceTextRef.current = '';
    setDesignSpaceInputKey(prev => prev + 1);
    Keyboard.dismiss();
  };

  const handleDeleteDesignSpaceItem = async (id: string) => {
    if (!project) return;
    console.log('Framing: Deleting design space item', id);
    const updatedItems = (project.designSpaceItems || []).filter(item => item.id !== id);
    await updateAndSaveProject({ designSpaceItems: updatedItems });
  };

  const handleEditDesignSpaceItem = async (id: string, newText: string) => {
    if (!project || !newText.trim()) return;
    console.log('Framing: Editing design space item', id);
    const updatedItems = (project.designSpaceItems || []).map(item => 
      item.id === id ? { ...item, text: newText.trim() } : item
    );
    await updateAndSaveProject({ designSpaceItems: updatedItems });
  };

  // FIXED: Clear input after adding exploration question
  const handleAddExplorationQuestion = async () => {
    if (!project || !newQuestionTextRef.current.trim()) return;
    
    console.log('Framing: Adding exploration question');
    const newQuestion: ExplorationQuestion = {
      id: Date.now().toString(),
      text: newQuestionTextRef.current.trim(),
      isFavorite: false,
    };
    
    const updatedQuestions = [...(project.explorationQuestions || []), newQuestion];
    await updateAndSaveProject({ explorationQuestions: updatedQuestions });
    
    // FIXED: Clear ref and force input re-render
    newQuestionTextRef.current = '';
    setQuestionInputKey(prev => prev + 1);
    Keyboard.dismiss();
  };

  const handleDeleteExplorationQuestion = async (id: string) => {
    if (!project) return;
    console.log('Framing: Deleting exploration question', id);
    const updatedQuestions = (project.explorationQuestions || []).filter(q => q.id !== id);
    await updateAndSaveProject({ explorationQuestions: updatedQuestions });
  };

  const handleEditExplorationQuestion = async (id: string, newText: string) => {
    if (!project || !newText.trim()) return;
    console.log('Framing: Editing exploration question', id);
    const updatedQuestions = (project.explorationQuestions || []).map(q => 
      q.id === id ? { ...q, text: newText.trim() } : q
    );
    await updateAndSaveProject({ explorationQuestions: updatedQuestions });
  };

  const handleToggleQuestionFavorite = async (id: string) => {
    if (!project) return;
    
    const question = (project.explorationQuestions || []).find(q => q.id === id);
    if (!question) return;
    
    console.log('Framing: Toggling question favorite', id);
    
    // If marking as favorite, create a new Draft Exploration Loop
    if (!question.isFavorite) {
      const currentDate = new Date().toISOString();
      
      const newLoop: ExplorationLoop = {
        id: Date.now().toString(),
        question: question.text,
        status: 'draft',
        startDate: currentDate, // FIXED: Add startDate when creating new loop
        updatedDate: currentDate,
        artifactIds: [],
        exploreItems: [],
        exploreArtifactIds: [],
        buildItems: [],
        buildArtifactIds: [],
        checkItems: [],
        checkArtifactIds: [],
        adaptItems: [],
        adaptArtifactIds: [],
        explorationDecisions: [],
        decisionsArtifactIds: [],
        nextExplorationQuestions: [],
        timeSpent: 0,
        costs: 0,
        invoicesArtifactIds: [],
      };
      
      const updatedLoops = [...(project.explorationLoops || []), newLoop];
      
      // Update question favorite status
      const updatedQuestions = (project.explorationQuestions || []).map(q => 
        q.id === id ? { ...q, isFavorite: true } : q
      );
      
      await updateAndSaveProject({ 
        explorationQuestions: updatedQuestions,
        explorationLoops: updatedLoops,
      });
      
      console.log('Framing: Created new exploration loop with startDate:', currentDate);
      
      // Show alert to inform user
      Alert.alert(
        'Exploration Loop Created',
        'A new Exploration Loop has been created in Draft status.',
        [{ text: 'OK' }]
      );
    } else {
      // Just toggle favorite off
      const updatedQuestions = (project.explorationQuestions || []).map(q => 
        q.id === id ? { ...q, isFavorite: false } : q
      );
      await updateAndSaveProject({ explorationQuestions: updatedQuestions });
    }
  };

  // Framing decisions
  const handleSaveDecision = async () => {
    if (!project || !decisionSummary.trim()) {
      Alert.alert('Required', 'Please enter a decision summary.');
      return;
    }
    
    console.log('Framing: Saving decision');
    
    let updatedDecisions: FramingDecision[];
    
    if (editingDecisionId) {
      // Edit existing decision
      updatedDecisions = (project.framingDecisions || []).map(d => 
        d.id === editingDecisionId 
          ? { ...d, summary: decisionSummary.trim() }
          : d
      );
    } else {
      // Add new decision
      const newDecision: FramingDecision = {
        id: Date.now().toString(),
        summary: decisionSummary.trim(),
        artifacts: [],
        timestamp: new Date().toISOString(),
      };
      updatedDecisions = [...(project.framingDecisions || []), newDecision];
    }
    
    await updateAndSaveProject({ framingDecisions: updatedDecisions });
    setDecisionSummary('');
    setEditingDecisionId(null);
    setShowDecisionOverlay(false);
  };

  const handleEditDecision = (decision: FramingDecision) => {
    console.log('Framing: Editing decision', decision.id);
    setDecisionSummary(decision.summary);
    setEditingDecisionId(decision.id);
    setShowDecisionOverlay(true);
  };

  const handleDeleteDecision = async (decisionId: string) => {
    if (!project) return;
    
    console.log('Framing: Deleting decision', decisionId);
    Alert.alert(
      'Delete Decision',
      'Are you sure you want to delete this decision?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedDecisions = (project.framingDecisions || []).filter(d => d.id !== decisionId);
            await updateAndSaveProject({ framingDecisions: updatedDecisions });
          }
        }
      ]
    );
  };

  if (!project) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{
            headerStyle: {
              backgroundColor: colors.surfaceFraming,
            },
          }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading project...</Text>
        </View>
      </View>
    );
  }

  const getCertaintyItemsByCategory = (category: CertaintyCategory) => {
    return (project.certaintyItems || []).filter(item => item.category === category);
  };

  // FIXED: Updated helper text for unknown section
  const getCertaintyHelperText = (category: CertaintyCategory) => {
    switch (category) {
      case 'known':
        return 'Facts or insights which you are confident';
      case 'assumed':
        return 'Things you believe are true, but are not confirmed';
      case 'unknown':
        return 'Things you do not understand or still need to learn.';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* 1. Opportunity Origin */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opportunity Origin</Text>
          <Text style={styles.helperText}>What triggered this project?</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the origin of this opportunity..."
            placeholderTextColor={colors.textSecondary}
            defaultValue={project.opportunityOrigin || ''}
            onChangeText={(text) => {
              opportunityOriginRef.current = text;
            }}
            onBlur={() => {
              console.log('Framing: Opportunity Origin blur, saving:', opportunityOriginRef.current);
              saveTextField('opportunityOrigin', opportunityOriginRef.current);
            }}
            multiline
            numberOfLines={4}
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>

        {/* 2. Purpose */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purpose</Text>
          <Text style={styles.helperText}>What are we trying to accomplish and who will benefit?</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the purpose of this project..."
            placeholderTextColor={colors.textSecondary}
            defaultValue={project.purpose || ''}
            onChangeText={(text) => {
              purposeRef.current = text;
            }}
            onBlur={() => {
              console.log('Framing: Purpose blur, saving:', purposeRef.current);
              saveTextField('purpose', purposeRef.current);
            }}
            multiline
            numberOfLines={4}
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>

        {/* 3. Artifacts (Visuals) - UPDATED with 4-column grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity 
              style={styles.addVisualsButton}
              onPress={() => setShowArtifactOverlay(true)}
            >
              <IconSymbol 
                ios_icon_name="plus.circle" 
                android_material_icon_name="add-circle" 
                size={20} 
                color={colors.phaseFraming} 
              />
              <Text style={styles.addVisualsText}>Visuals</Text>
            </TouchableOpacity>
          </View>
          
          {/* FIXED: Only show artifacts that belong to Framing */}
          {(() => {
            const framingArtifactIds = project.framingArtifactIds || [];
            const framingArtifacts = project.artifacts.filter(a => framingArtifactIds.includes(a.id));
            console.log('Framing: Displaying', framingArtifacts.length, 'artifacts out of', project.artifacts.length, 'total');
            return framingArtifacts.length > 0 && (
              <View style={styles.artifactGrid}>
                {framingArtifacts.map((artifact) => (
                <TouchableOpacity
                  key={artifact.id}
                  style={styles.artifactGridItem}
                  onPress={() => {
                    if (artifact.type === 'url' || artifact.type === 'document') {
                      handleOpenArtifact(artifact);
                    } else {
                      setSelectedArtifact(artifact);
                      setShowArtifactViewer(true);
                    }
                  }}
                >
                  {artifact.type === 'image' ? (
                    <Image source={{ uri: artifact.uri }} style={styles.artifactImage} />
                  ) : artifact.type === 'document' ? (
                    <View style={styles.artifactPlaceholder}>
                      <IconSymbol 
                        ios_icon_name="doc.fill" 
                        android_material_icon_name="description" 
                        size={32} 
                        color={colors.phaseFraming} 
                      />
                      <Text style={styles.artifactPlaceholderText}>PDF</Text>
                    </View>
                  ) : (
                    <View style={styles.artifactPlaceholder}>
                      <IconSymbol 
                        ios_icon_name="link" 
                        android_material_icon_name="link" 
                        size={32} 
                        color={colors.phaseFraming} 
                      />
                      <Text style={styles.artifactPlaceholderText}>URL</Text>
                    </View>
                  )}
                  
                  {/* Action icons in top right corner */}
                  <View style={styles.artifactActions}>
                    <TouchableOpacity 
                      style={styles.artifactActionButton}
                      onPress={() => handleToggleArtifactFavorite(artifact.id)}
                    >
                      <IconSymbol 
                        ios_icon_name={artifact.isFavorite ? "star.fill" : "star"} 
                        android_material_icon_name={artifact.isFavorite ? "star" : "star-border"} 
                        size={18} 
                        color={artifact.isFavorite ? "#FFD700" : "#FFFFFF"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.artifactActionButton}
                      onPress={() => handleDeleteArtifact(artifact.id)}
                    >
                      <IconSymbol 
                        ios_icon_name="trash" 
                        android_material_icon_name="delete" 
                        size={18} 
                        color="#FFFFFF" 
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            );
          })()}
        </View>

        {/* 4. Level of Certainty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Level of Certainty</Text>
          
          {/* Segmented Control */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                selectedCertaintyCategory === 'known' && styles.segmentButtonActive
              ]}
              onPress={() => setSelectedCertaintyCategory('known')}
            >
              <Text style={[
                styles.segmentButtonText,
                selectedCertaintyCategory === 'known' && styles.segmentButtonTextActive
              ]}>
                Known
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.segmentButton,
                selectedCertaintyCategory === 'assumed' && styles.segmentButtonActive
              ]}
              onPress={() => setSelectedCertaintyCategory('assumed')}
            >
              <Text style={[
                styles.segmentButtonText,
                selectedCertaintyCategory === 'assumed' && styles.segmentButtonTextActive
              ]}>
                Assumed
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.segmentButton,
                selectedCertaintyCategory === 'unknown' && styles.segmentButtonActive
              ]}
              onPress={() => setSelectedCertaintyCategory('unknown')}
            >
              <Text style={[
                styles.segmentButtonText,
                selectedCertaintyCategory === 'unknown' && styles.segmentButtonTextActive
              ]}>
                Unknown
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.helperText}>{getCertaintyHelperText(selectedCertaintyCategory)}</Text>
          
          {/* List for selected category */}
          <View style={styles.listContainer}>
            {getCertaintyItemsByCategory(selectedCertaintyCategory).map((item) => (
              <EditableListItem
                key={item.id}
                text={item.text}
                onEdit={(newText) => handleEditCertaintyItem(item.id, newText)}
                onDelete={() => handleDeleteCertaintyItem(item.id)}
              />
            ))}
            
            {/* FIXED: Add key prop to force re-render */}
            <View style={styles.addItemRow}>
              <TextInput
                key={certaintyInputKey}
                style={styles.addItemInput}
                placeholder={`Add ${selectedCertaintyCategory} item...`}
                placeholderTextColor={colors.textSecondary}
                defaultValue=""
                onChangeText={(text) => {
                  newCertaintyTextRef.current = text;
                }}
                onSubmitEditing={handleAddCertaintyItem}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              <TouchableOpacity onPress={handleAddCertaintyItem}>
                <IconSymbol 
                  ios_icon_name="plus.circle.fill" 
                  android_material_icon_name="add-circle" 
                  size={28} 
                  color={colors.phaseFraming} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 5. Design Space and Constraints */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Design Space and Constraints</Text>
          <Text style={styles.helperText}>What limits or boundaries must be respected? (e.g. time, budget, technology, ethics)</Text>
          
          <View style={styles.listContainer}>
            {(project.designSpaceItems || []).map((item) => (
              <EditableListItem
                key={item.id}
                text={item.text}
                onEdit={(newText) => handleEditDesignSpaceItem(item.id, newText)}
                onDelete={() => handleDeleteDesignSpaceItem(item.id)}
              />
            ))}
            
            {/* FIXED: Add key prop to force re-render */}
            <View style={styles.addItemRow}>
              <TextInput
                key={designSpaceInputKey}
                style={styles.addItemInput}
                placeholder="Add constraint or possibility..."
                placeholderTextColor={colors.textSecondary}
                defaultValue=""
                onChangeText={(text) => {
                  newDesignSpaceTextRef.current = text;
                }}
                onSubmitEditing={handleAddDesignSpaceItem}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              <TouchableOpacity onPress={handleAddDesignSpaceItem}>
                <IconSymbol 
                  ios_icon_name="plus.circle.fill" 
                  android_material_icon_name="add-circle" 
                  size={28} 
                  color={colors.phaseFraming} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 6. Exploration Questions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exploration Questions</Text>
          <Text style={styles.helperText}>What are the first things we need to learn?</Text>
          
          <View style={styles.listContainer}>
            {(project.explorationQuestions || []).map((question) => (
              <EditableListItem
                key={question.id}
                text={question.text}
                isFavorite={question.isFavorite}
                onEdit={(newText) => handleEditExplorationQuestion(question.id, newText)}
                onDelete={() => handleDeleteExplorationQuestion(question.id)}
                onToggleFavorite={() => handleToggleQuestionFavorite(question.id)}
              />
            ))}
            
            {/* FIXED: Add key prop to force re-render */}
            <View style={styles.addItemRow}>
              <TextInput
                key={questionInputKey}
                style={styles.addItemInput}
                placeholder="Add exploration question..."
                placeholderTextColor={colors.textSecondary}
                defaultValue=""
                onChangeText={(text) => {
                  newQuestionTextRef.current = text;
                }}
                onSubmitEditing={handleAddExplorationQuestion}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              <TouchableOpacity onPress={handleAddExplorationQuestion}>
                <IconSymbol 
                  ios_icon_name="plus.circle.fill" 
                  android_material_icon_name="add-circle" 
                  size={28} 
                  color={colors.phaseFraming} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 7. Framing Decisions & Changes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Framing Decisions & Changes</Text>
          <Text style={styles.helperText}>Note important changes and decisions</Text>
          
          <TouchableOpacity 
            style={styles.addDecisionButton}
            onPress={() => {
              console.log('Framing: Opening Add Decision overlay');
              setShowDecisionOverlay(true);
            }}
          >
            <IconSymbol 
              ios_icon_name="plus.circle" 
              android_material_icon_name="add-circle" 
              size={20} 
              color={colors.phaseFraming} 
            />
            <Text style={styles.addDecisionText}>Add Decision</Text>
          </TouchableOpacity>
          
          {(project.framingDecisions || []).length > 0 && (
            <View style={styles.decisionsTimeline}>
              {(project.framingDecisions || []).map((decision) => (
                <View key={decision.id} style={styles.decisionItem}>
                  <View style={styles.decisionDot} />
                  <View style={styles.decisionContent}>
                    <View style={styles.decisionHeader}>
                      <Text style={styles.decisionTimestamp}>
                        {new Date(decision.timestamp).toLocaleDateString()}
                      </Text>
                      <View style={styles.decisionActions}>
                        <TouchableOpacity onPress={() => handleEditDecision(decision)}>
                          <IconSymbol 
                            ios_icon_name="pencil" 
                            android_material_icon_name="edit" 
                            size={20} 
                            color={colors.textSecondary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteDecision(decision.id)}>
                          <IconSymbol 
                            ios_icon_name="trash" 
                            android_material_icon_name="delete" 
                            size={20} 
                            color={colors.phaseFinish} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.decisionSummary}>{decision.summary}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Artifact Overlay */}
      <Modal
        visible={showArtifactOverlay}
        transparent
        animationType="fade"
        onRequestClose={() => setShowArtifactOverlay(false)}
      >
        <TouchableOpacity 
          style={styles.overlayBackground}
          activeOpacity={1}
          onPress={() => setShowArtifactOverlay(false)}
        >
          <View style={styles.overlayContent}>
            <Text style={styles.overlayTitle}>Add Visual</Text>
            
            <TouchableOpacity 
              style={styles.overlayOption}
              onPress={() => handleAddArtifact('camera')}
            >
              <IconSymbol 
                ios_icon_name="camera" 
                android_material_icon_name="camera" 
                size={24} 
                color={colors.text} 
              />
              <Text style={styles.overlayOptionText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.overlayOption}
              onPress={() => handleAddArtifact('photo')}
            >
              <IconSymbol 
                ios_icon_name="photo" 
                android_material_icon_name="photo" 
                size={24} 
                color={colors.text} 
              />
              <Text style={styles.overlayOptionText}>Photos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.overlayOption}
              onPress={() => handleAddArtifact('document')}
            >
              <IconSymbol 
                ios_icon_name="doc" 
                android_material_icon_name="description" 
                size={24} 
                color={colors.text} 
              />
              <Text style={styles.overlayOptionText}>PDF Documents</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.overlayOption}
              onPress={() => handleAddArtifact('url')}
            >
              <IconSymbol 
                ios_icon_name="link" 
                android_material_icon_name="link" 
                size={24} 
                color={colors.text} 
              />
              <Text style={styles.overlayOptionText}>Add URL</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.overlayCancelButton}
              onPress={() => setShowArtifactOverlay(false)}
            >
              <Text style={styles.overlayCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Artifact Viewer with Zoom and Download */}
      <Modal
        visible={showArtifactViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowArtifactViewer(false)}
      >
        <View style={styles.artifactViewerBackground}>
          <View style={styles.artifactViewerHeader}>
            <TouchableOpacity onPress={() => setShowArtifactViewer(false)}>
              <IconSymbol 
                ios_icon_name="xmark" 
                android_material_icon_name="close" 
                size={28} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
            
            <View style={styles.artifactViewerActions}>
              <TouchableOpacity 
                onPress={() => selectedArtifact && handleDownloadArtifact(selectedArtifact)}
                style={styles.artifactViewerAction}
              >
                <IconSymbol 
                  ios_icon_name="arrow.down.circle" 
                  android_material_icon_name="download" 
                  size={28} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => selectedArtifact && handleToggleArtifactFavorite(selectedArtifact.id)}
                style={styles.artifactViewerAction}
              >
                <IconSymbol 
                  ios_icon_name={selectedArtifact?.isFavorite ? "star.fill" : "star"} 
                  android_material_icon_name={selectedArtifact?.isFavorite ? "star" : "star-border"} 
                  size={28} 
                  color={selectedArtifact?.isFavorite ? "#FFD700" : "#FFFFFF"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => selectedArtifact && handleDeleteArtifact(selectedArtifact.id)}
                style={styles.artifactViewerAction}
              >
                <IconSymbol 
                  ios_icon_name="trash" 
                  android_material_icon_name="delete" 
                  size={28} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.artifactViewerContent}>
            {selectedArtifact?.type === 'image' ? (
              <ZoomableImage uri={selectedArtifact.uri} />
            ) : (
              <View style={styles.artifactViewerDoc}>
                <IconSymbol 
                  ios_icon_name="doc" 
                  android_material_icon_name="description" 
                  size={64} 
                  color="#FFFFFF" 
                />
                <Text style={styles.artifactViewerDocName}>{selectedArtifact?.name}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Add/Edit Decision Overlay */}
      <Modal
        visible={showDecisionOverlay}
        transparent
        animationType="slide"
        onRequestClose={() => {
          console.log('Framing: Closing decision overlay');
          setShowDecisionOverlay(false);
          setEditingDecisionId(null);
          setDecisionSummary('');
        }}
      >
        <KeyboardAvoidingView 
          style={styles.overlayBackground}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity 
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => {
              console.log('Framing: Closing decision overlay via background tap');
              setShowDecisionOverlay(false);
              setEditingDecisionId(null);
              setDecisionSummary('');
            }}
          >
            <View style={styles.decisionOverlay}>
              <Text style={styles.overlayTitle}>
                {editingDecisionId ? 'Edit Decision' : 'Add Decision'}
              </Text>
              
              <Text style={styles.inputLabel}>Decision / Change Summary</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What was decided or changed?"
                placeholderTextColor={colors.textSecondary}
                value={decisionSummary}
                onChangeText={setDecisionSummary}
                multiline
                numberOfLines={4}
                returnKeyType="done"
                blurOnSubmit={true}
              />
              
              <View style={styles.decisionButtons}>
                <TouchableOpacity 
                  style={styles.decisionCancelButton}
                  onPress={() => {
                    console.log('Framing: Cancel button pressed');
                    setDecisionSummary('');
                    setEditingDecisionId(null);
                    setShowDecisionOverlay(false);
                    Keyboard.dismiss();
                  }}
                >
                  <Text style={styles.decisionCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.decisionSaveButton}
                  onPress={() => {
                    console.log('Framing: Save button pressed');
                    handleSaveDecision();
                    Keyboard.dismiss();
                  }}
                >
                  <Text style={styles.decisionSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// Reusable editable list item component
function EditableListItem({ 
  text, 
  isFavorite, 
  onEdit, 
  onDelete, 
  onToggleFavorite 
}: { 
  text: string; 
  isFavorite?: boolean; 
  onEdit: (newText: string) => void; 
  onDelete: () => void; 
  onToggleFavorite?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  const handleFinishEdit = () => {
    if (editText.trim() && editText !== text) {
      onEdit(editText.trim());
    } else {
      setEditText(text);
    }
    setIsEditing(false);
  };

  return (
    <View style={styles.listItem}>
      {isEditing ? (
        <TextInput
          style={styles.listItemInput}
          value={editText}
          onChangeText={setEditText}
          onBlur={handleFinishEdit}
          onSubmitEditing={handleFinishEdit}
          autoFocus
          returnKeyType="done"
        />
      ) : (
        <>
          <Text style={styles.listItemText}>{text}</Text>
          <View style={styles.listItemActions}>
            {onToggleFavorite && (
              <TouchableOpacity onPress={onToggleFavorite}>
                <IconSymbol 
                  ios_icon_name={isFavorite ? "star.fill" : "star"} 
                  android_material_icon_name={isFavorite ? "star" : "star-border"} 
                  size={20} 
                  color={isFavorite ? "#FFD700" : colors.textSecondary} 
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <IconSymbol 
                ios_icon_name="pencil" 
                android_material_icon_name="edit" 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete}>
              <IconSymbol 
                ios_icon_name="trash" 
                android_material_icon_name="delete" 
                size={20} 
                color={colors.phaseFinish} 
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceFraming,
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.phaseFraming,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.divider,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addVisualsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  addVisualsText: {
    fontSize: 16,
    color: colors.phaseFraming,
    fontWeight: '600',
  },
  // UPDATED: Grid layout for artifacts
  artifactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  artifactGridItem: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    backgroundColor: colors.divider,
    position: 'relative',
  },
  artifactImage: {
    width: '100%',
    height: '100%',
  },
  artifactPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  artifactPlaceholderText: {
    fontSize: 12,
    color: colors.phaseFraming,
    fontWeight: '600',
    marginTop: 4,
  },
  // UPDATED: Action buttons in top right corner
  artifactActions: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  artifactActionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  segmentButtonActive: {
    backgroundColor: colors.phaseFraming,
    borderColor: colors.phaseFraming,
  },
  segmentButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  listItemInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  addItemInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  addDecisionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  addDecisionText: {
    fontSize: 16,
    color: colors.phaseFraming,
    fontWeight: '600',
  },
  decisionsTimeline: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  decisionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  decisionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.phaseFraming,
    marginTop: 4,
    marginRight: 12,
  },
  decisionContent: {
    flex: 1,
  },
  decisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  decisionTimestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  decisionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  decisionSummary: {
    fontSize: 16,
    color: colors.text,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayContent: {
    backgroundColor: colors.background,
    padding: 24,
    paddingBottom: 40,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  overlayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  overlayOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  overlayCancelButton: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  overlayCancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  artifactViewerBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  artifactViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
  },
  artifactViewerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  artifactViewerAction: {
    padding: 8,
  },
  artifactViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artifactViewerImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 100,
  },
  artifactViewerDoc: {
    alignItems: 'center',
  },
  artifactViewerDocName: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 16,
  },
  decisionOverlay: {
    backgroundColor: colors.background,
    padding: 24,
    marginTop: 'auto',
    paddingBottom: 40,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  decisionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  decisionCancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.divider,
  },
  decisionCancelText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  decisionSaveButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.phaseFraming,
  },
  decisionSaveText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
