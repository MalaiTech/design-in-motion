
import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Linking,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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

type CertaintyCategory = 'known' | 'assumed' | 'unknown';

export default function FramingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  
  // Framing fields - LOCAL STATE (not saved on every keystroke)
  const [opportunityOrigin, setOpportunityOrigin] = useState('');
  const [purpose, setPurpose] = useState('');
  const [certaintyItems, setCertaintyItems] = useState<CertaintyItem[]>([]);
  const [designSpaceItems, setDesignSpaceItems] = useState<DesignSpaceItem[]>([]);
  const [explorationQuestions, setExplorationQuestions] = useState<ExplorationQuestion[]>([]);
  const [framingDecisions, setFramingDecisions] = useState<FramingDecision[]>([]);
  
  // UI state
  const [selectedCertaintyCategory, setSelectedCertaintyCategory] = useState<CertaintyCategory>('known');
  const [showArtifactOverlay, setShowArtifactOverlay] = useState(false);
  const [showDecisionOverlay, setShowDecisionOverlay] = useState(false);
  const [showArtifactViewer, setShowArtifactViewer] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  
  // Edit states
  const [editingCertaintyId, setEditingCertaintyId] = useState<string | null>(null);
  const [editingDesignSpaceId, setEditingDesignSpaceId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingDecisionId, setEditingDecisionId] = useState<string | null>(null);
  
  // New item inputs
  const [newCertaintyText, setNewCertaintyText] = useState('');
  const [newDesignSpaceText, setNewDesignSpaceText] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  
  // Decision overlay
  const [decisionSummary, setDecisionSummary] = useState('');
  const [decisionRationale, setDecisionRationale] = useState('');
  
  // Refs for debounced save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChanges = useRef(false);

  const loadProject = useCallback(async () => {
    console.log('Framing: Loading project', projectId);
    const projects = await getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
      setOpportunityOrigin(found.opportunityOrigin || '');
      setPurpose(found.purpose || '');
      setCertaintyItems(found.certaintyItems || []);
      setDesignSpaceItems(found.designSpaceItems || []);
      setExplorationQuestions(found.explorationQuestions || []);
      setFramingDecisions(found.framingDecisions || []);
    } else {
      Alert.alert('Project Not Found', 'This project no longer exists.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [projectId, router]);

  // DEBOUNCED SAVE - Only saves after 700ms of no changes
  const saveChanges = useCallback(async () => {
    if (!project) return;
    
    console.log('Framing: Saving changes to AsyncStorage');
    const updatedProject: Project = {
      ...project,
      opportunityOrigin,
      purpose,
      certaintyItems,
      designSpaceItems,
      explorationQuestions,
      framingDecisions,
      updatedDate: new Date().toISOString(),
    };
    
    await updateProject(updatedProject);
    setProject(updatedProject);
    hasUnsavedChanges.current = false;
  }, [project, opportunityOrigin, purpose, certaintyItems, designSpaceItems, explorationQuestions, framingDecisions]);

  // Mark as changed and schedule debounced save
  const markAsChanged = useCallback(() => {
    hasUnsavedChanges.current = true;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Schedule save after 700ms of no changes
    saveTimeoutRef.current = setTimeout(() => {
      saveChanges();
    }, 700);
  }, [saveChanges]);

  useFocusEffect(
    useCallback(() => {
      loadProject();
      return () => {
        // Clear timeout on unmount
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        // Save any pending changes
        if (hasUnsavedChanges.current) {
          saveChanges();
        }
      };
    }, [loadProject, saveChanges])
  );

  // Artifact management
  const handleAddArtifact = async (type: 'camera' | 'photo' | 'document' | 'url') => {
    if (!project) return;
    
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
                name: 'URL Link',
                isFavorite: false,
              };
              
              const updatedArtifacts = [...project.artifacts, newArtifact];
              const updatedProject = {
                ...project,
                artifacts: updatedArtifacts,
                updatedDate: new Date().toISOString(),
              };
              
              await updateProject(updatedProject);
              setProject(updatedProject);
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
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsMultipleSelection: true,
        });
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
      }
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newArtifacts: Artifact[] = result.assets.map((asset, index) => {
          const isPDF = asset.name?.toLowerCase().endsWith('.pdf') || asset.mimeType === 'application/pdf';
          
          return {
            id: `${Date.now()}-${index}`,
            type: isPDF ? 'document' : 'image',
            uri: asset.uri,
            name: asset.name || 'Untitled',
            isFavorite: false,
          };
        });
        
        const updatedArtifacts = [...project.artifacts, ...newArtifacts];
        const updatedProject = {
          ...project,
          artifacts: updatedArtifacts,
          updatedDate: new Date().toISOString(),
        };
        
        await updateProject(updatedProject);
        setProject(updatedProject);
        setShowArtifactOverlay(false);
      }
    } catch (error) {
      console.error('Error adding artifact:', error);
      Alert.alert('Error', 'Failed to add artifact.');
    }
  };

  const handleDeleteArtifact = async (artifactId: string) => {
    if (!project) return;
    
    Alert.alert(
      'Delete Artifact',
      'Are you sure you want to delete this artifact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedArtifacts = project.artifacts.filter(a => a.id !== artifactId);
            const updatedProject = {
              ...project,
              artifacts: updatedArtifacts,
              updatedDate: new Date().toISOString(),
            };
            
            await updateProject(updatedProject);
            setProject(updatedProject);
            setShowArtifactViewer(false);
          }
        }
      ]
    );
  };

  const handleToggleArtifactFavorite = async (artifactId: string) => {
    if (!project) return;
    
    const updatedArtifacts = project.artifacts.map(a => 
      a.id === artifactId ? { ...a, isFavorite: !a.isFavorite } : a
    );
    
    const updatedProject = {
      ...project,
      artifacts: updatedArtifacts,
      updatedDate: new Date().toISOString(),
    };
    
    await updateProject(updatedProject);
    setProject(updatedProject);
  };

  const handleOpenArtifact = async (artifact: Artifact) => {
    try {
      if (artifact.type === 'url') {
        const canOpen = await Linking.canOpenURL(artifact.uri);
        if (canOpen) {
          await Linking.openURL(artifact.uri);
        } else {
          Alert.alert('Error', 'Cannot open this URL');
        }
      } else if (artifact.type === 'document') {
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
        setSelectedArtifact(artifact);
        setShowArtifactViewer(true);
      }
    } catch (error) {
      console.error('Error opening artifact:', error);
      Alert.alert('Error', 'Could not open this file');
    }
  };

  // Certainty items
  const handleAddCertaintyItem = () => {
    if (!newCertaintyText.trim()) return;
    
    console.log('Adding certainty item:', newCertaintyText);
    const newItem: CertaintyItem = {
      id: Date.now().toString(),
      text: newCertaintyText.trim(),
      category: selectedCertaintyCategory,
    };
    
    setCertaintyItems([...certaintyItems, newItem]);
    setNewCertaintyText('');
    markAsChanged();
  };

  const handleDeleteCertaintyItem = (id: string) => {
    console.log('Deleting certainty item:', id);
    setCertaintyItems(certaintyItems.filter(item => item.id !== id));
    markAsChanged();
  };

  const handleEditCertaintyItem = (id: string, newText: string) => {
    console.log('Editing certainty item:', id, newText);
    setCertaintyItems(certaintyItems.map(item => 
      item.id === id ? { ...item, text: newText } : item
    ));
    setEditingCertaintyId(null);
    markAsChanged();
  };

  const handleStartEditCertainty = (id: string) => {
    console.log('Starting edit certainty:', id);
    setEditingCertaintyId(id);
  };

  // Design space items
  const handleAddDesignSpaceItem = () => {
    if (!newDesignSpaceText.trim()) return;
    
    console.log('Adding design space item:', newDesignSpaceText);
    const newItem: DesignSpaceItem = {
      id: Date.now().toString(),
      text: newDesignSpaceText.trim(),
    };
    
    setDesignSpaceItems([...designSpaceItems, newItem]);
    setNewDesignSpaceText('');
    markAsChanged();
  };

  const handleDeleteDesignSpaceItem = (id: string) => {
    console.log('Deleting design space item:', id);
    setDesignSpaceItems(designSpaceItems.filter(item => item.id !== id));
    markAsChanged();
  };

  const handleEditDesignSpaceItem = (id: string, newText: string) => {
    console.log('Editing design space item:', id, newText);
    setDesignSpaceItems(designSpaceItems.map(item => 
      item.id === id ? { ...item, text: newText } : item
    ));
    setEditingDesignSpaceId(null);
    markAsChanged();
  };

  const handleStartEditDesignSpace = (id: string) => {
    console.log('Starting edit design space:', id);
    setEditingDesignSpaceId(id);
  };

  // Exploration questions
  const handleAddExplorationQuestion = () => {
    if (!newQuestionText.trim()) return;
    
    console.log('Adding exploration question:', newQuestionText);
    const newQuestion: ExplorationQuestion = {
      id: Date.now().toString(),
      text: newQuestionText.trim(),
      isFavorite: false,
    };
    
    setExplorationQuestions([...explorationQuestions, newQuestion]);
    setNewQuestionText('');
    markAsChanged();
  };

  const handleDeleteExplorationQuestion = (id: string) => {
    console.log('Deleting exploration question:', id);
    setExplorationQuestions(explorationQuestions.filter(q => q.id !== id));
    markAsChanged();
  };

  const handleEditExplorationQuestion = (id: string, newText: string) => {
    console.log('Editing exploration question:', id, newText);
    setExplorationQuestions(explorationQuestions.map(q => 
      q.id === id ? { ...q, text: newText } : q
    ));
    setEditingQuestionId(null);
    markAsChanged();
  };

  const handleStartEditQuestion = (id: string) => {
    console.log('Starting edit question:', id);
    setEditingQuestionId(id);
  };

  // Toggle favorite - Save immediately
  const handleToggleQuestionFavorite = async (id: string) => {
    if (!project) return;
    
    console.log('Toggling question favorite:', id);
    const question = explorationQuestions.find(q => q.id === id);
    if (!question) return;
    
    const wasFavorite = question.isFavorite;
    const willBeFavorite = !wasFavorite;
    
    const updatedQuestions = explorationQuestions.map(q => 
      q.id === id ? { ...q, isFavorite: willBeFavorite } : q
    );
    
    setExplorationQuestions(updatedQuestions);
    
    let updatedLoops = project.explorationLoops || [];
    if (willBeFavorite && !wasFavorite) {
      console.log('Creating new Draft Exploration Loop for question:', question.text);
      
      const newLoop: ExplorationLoop = {
        id: Date.now().toString(),
        question: question.text,
        status: 'draft',
        updatedDate: new Date().toISOString(),
        artifactIds: [],
        exploreItems: [],
        exploreArtifactIds: [],
        buildItems: [],
        buildArtifactIds: [],
        checkItems: [],
        adaptItems: [],
        explorationDecisions: [],
        nextExplorationQuestions: [],
        timeSpent: 0,
        costs: 0,
        invoicesArtifactIds: [],
      };
      
      updatedLoops = [...updatedLoops, newLoop];
    }
    
    const updatedProject: Project = {
      ...project,
      explorationQuestions: updatedQuestions,
      explorationLoops: updatedLoops,
      updatedDate: new Date().toISOString(),
    };
    
    await updateProject(updatedProject);
    setProject(updatedProject);
    hasUnsavedChanges.current = false;
    
    if (willBeFavorite && !wasFavorite) {
      Alert.alert(
        'Exploration Loop Created',
        'A new Draft Exploration Loop has been created and is now visible in the Exploration Loops overview.',
        [{ text: 'OK' }]
      );
    }
  };

  // Framing decisions
  const handleSaveDecision = async () => {
    if (!decisionSummary.trim()) {
      Alert.alert('Required', 'Please enter a decision summary.');
      return;
    }
    
    if (!project) return;
    
    console.log('Saving decision:', decisionSummary);
    let updatedDecisions: FramingDecision[];
    
    if (editingDecisionId) {
      updatedDecisions = framingDecisions.map(d => 
        d.id === editingDecisionId 
          ? { ...d, summary: decisionSummary.trim(), rationale: decisionRationale.trim() } as any
          : d
      );
    } else {
      const newDecision: any = {
        id: Date.now().toString(),
        summary: decisionSummary.trim(),
        rationale: decisionRationale.trim(),
        artifacts: [],
        timestamp: new Date().toISOString(),
      };
      updatedDecisions = [...framingDecisions, newDecision];
    }
    
    setFramingDecisions(updatedDecisions);
    
    const updatedProject: Project = {
      ...project,
      framingDecisions: updatedDecisions,
      updatedDate: new Date().toISOString(),
    };
    
    await updateProject(updatedProject);
    setProject(updatedProject);
    
    setDecisionSummary('');
    setDecisionRationale('');
    setEditingDecisionId(null);
    setShowDecisionOverlay(false);
    hasUnsavedChanges.current = false;
  };

  const handleEditDecision = (decision: any) => {
    console.log('Editing decision:', decision.id);
    setDecisionSummary(decision.summary);
    setDecisionRationale(decision.rationale || '');
    setEditingDecisionId(decision.id);
    setShowDecisionOverlay(true);
  };

  const handleDeleteDecision = async (decisionId: string) => {
    Alert.alert(
      'Delete Decision',
      'Are you sure you want to delete this decision?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Deleting decision:', decisionId);
            setFramingDecisions(framingDecisions.filter(d => d.id !== decisionId));
            markAsChanged();
          }
        }
      ]
    );
  };

  if (!project) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading project...</Text>
        </View>
      </View>
    );
  }

  const getCertaintyItemsByCategory = (category: CertaintyCategory) => {
    return certaintyItems.filter(item => item.category === category);
  };

  const getCertaintyHelperText = (category: CertaintyCategory) => {
    switch (category) {
      case 'known':
        return 'Facts or insights which you are confident';
      case 'assumed':
        return 'Things you believe are true, but are not confirmed';
      case 'unknown':
        return 'Thinks you don&apos;t understand or still need to learn';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Opportunity Origin */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opportunity Origin</Text>
            <Text style={styles.helperText}>What triggered this project?</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the origin of this opportunity..."
              placeholderTextColor={colors.textSecondary}
              value={opportunityOrigin}
              onChangeText={setOpportunityOrigin}
              onBlur={() => {
                // Save on blur
                if (hasUnsavedChanges.current) {
                  saveChanges();
                }
              }}
              multiline
              numberOfLines={4}
              returnKeyType="default"
              blurOnSubmit={false}
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
            />
          </View>

          {/* 2. Purpose */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Purpose</Text>
            <Text style={styles.helperText}>What are we trying to acomplish and who will benefit?</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the purpose of this project..."
              placeholderTextColor={colors.textSecondary}
              value={purpose}
              onChangeText={setPurpose}
              onBlur={() => {
                // Save on blur
                if (hasUnsavedChanges.current) {
                  saveChanges();
                }
              }}
              multiline
              numberOfLines={4}
              returnKeyType="default"
              blurOnSubmit={false}
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
            />
          </View>

          {/* 3. Artifacts (Visuals) */}
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
            
            {project.artifacts.length > 0 && (
              <View style={styles.artifactGrid}>
                {project.artifacts.map((artifact) => (
                  <View key={artifact.id} style={styles.artifactGridItem}>
                    <TouchableOpacity
                      style={styles.artifactThumb}
                      onPress={() => handleOpenArtifact(artifact)}
                    >
                      {artifact.type === 'image' ? (
                        <Image source={{ uri: artifact.uri }} style={styles.artifactImage} />
                      ) : artifact.type === 'document' ? (
                        <View style={styles.artifactDoc}>
                          <IconSymbol 
                            ios_icon_name="doc" 
                            android_material_icon_name="description" 
                            size={32} 
                            color={colors.textSecondary} 
                          />
                          <Text style={styles.artifactLabel}>PDF</Text>
                        </View>
                      ) : artifact.type === 'url' ? (
                        <View style={styles.artifactDoc}>
                          <IconSymbol 
                            ios_icon_name="link" 
                            android_material_icon_name="link" 
                            size={32} 
                            color={colors.textSecondary} 
                          />
                          <Text style={styles.artifactLabel}>URL</Text>
                        </View>
                      ) : null}
                      
                      <View style={styles.artifactOverlayActions}>
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
                  </View>
                ))}
              </View>
            )}
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
            
            {/* Helper text - ALWAYS VISIBLE (fixed height) */}
            <View style={styles.helperTextContainer}>
              <Text style={styles.helperText}>{getCertaintyHelperText(selectedCertaintyCategory)}</Text>
            </View>
            
            {/* List for selected category */}
            <View style={styles.listContainer}>
              {getCertaintyItemsByCategory(selectedCertaintyCategory).map((item) => (
                <View key={item.id} style={styles.listItem}>
                  {editingCertaintyId === item.id ? (
                    <TextInput
                      style={styles.listItemInput}
                      value={item.text}
                      onChangeText={(text) => {
                        setCertaintyItems(certaintyItems.map(i => 
                          i.id === item.id ? { ...i, text } : i
                        ));
                      }}
                      onBlur={() => {
                        handleEditCertaintyItem(item.id, item.text);
                      }}
                      autoFocus
                      returnKeyType="done"
                      blurOnSubmit={true}
                      autoCorrect={false}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  ) : (
                    <React.Fragment>
                      <Text style={styles.listItemText}>{item.text}</Text>
                      <View style={styles.listItemActions}>
                        <TouchableOpacity onPress={() => handleStartEditCertainty(item.id)}>
                          <IconSymbol 
                            ios_icon_name="pencil" 
                            android_material_icon_name="edit" 
                            size={20} 
                            color={colors.textSecondary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteCertaintyItem(item.id)}>
                          <IconSymbol 
                            ios_icon_name="trash" 
                            android_material_icon_name="delete" 
                            size={20} 
                            color={colors.phaseFinish} 
                          />
                        </TouchableOpacity>
                      </View>
                    </React.Fragment>
                  )}
                </View>
              ))}
              
              {/* Add new item */}
              <View style={styles.addItemRow}>
                <TextInput
                  style={styles.addItemInput}
                  placeholder={`Add ${selectedCertaintyCategory} item...`}
                  placeholderTextColor={colors.textSecondary}
                  value={newCertaintyText}
                  onChangeText={setNewCertaintyText}
                  onSubmitEditing={handleAddCertaintyItem}
                  returnKeyType="done"
                  autoCorrect={false}
                  autoComplete="off"
                  spellCheck={false}
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
            <View style={styles.helperTextContainer}>
              <Text style={styles.helperText}>What limits or bounderies must be respected? (e.g. time, budget, technology, ethics)</Text>
            </View>
            
            <View style={styles.listContainer}>
              {designSpaceItems.map((item) => (
                <View key={item.id} style={styles.listItem}>
                  {editingDesignSpaceId === item.id ? (
                    <TextInput
                      style={styles.listItemInput}
                      value={item.text}
                      onChangeText={(text) => {
                        setDesignSpaceItems(designSpaceItems.map(i => 
                          i.id === item.id ? { ...i, text } : i
                        ));
                      }}
                      onBlur={() => {
                        handleEditDesignSpaceItem(item.id, item.text);
                      }}
                      autoFocus
                      returnKeyType="done"
                      blurOnSubmit={true}
                      autoCorrect={false}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  ) : (
                    <React.Fragment>
                      <Text style={styles.listItemText}>{item.text}</Text>
                      <View style={styles.listItemActions}>
                        <TouchableOpacity onPress={() => handleStartEditDesignSpace(item.id)}>
                          <IconSymbol 
                            ios_icon_name="pencil" 
                            android_material_icon_name="edit" 
                            size={20} 
                            color={colors.textSecondary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteDesignSpaceItem(item.id)}>
                          <IconSymbol 
                            ios_icon_name="trash" 
                            android_material_icon_name="delete" 
                            size={20} 
                            color={colors.phaseFinish} 
                          />
                        </TouchableOpacity>
                      </View>
                    </React.Fragment>
                  )}
                </View>
              ))}
              
              {/* Add new item */}
              <View style={styles.addItemRow}>
                <TextInput
                  style={styles.addItemInput}
                  placeholder="Add constraint or possibility..."
                  placeholderTextColor={colors.textSecondary}
                  value={newDesignSpaceText}
                  onChangeText={setNewDesignSpaceText}
                  onSubmitEditing={handleAddDesignSpaceItem}
                  returnKeyType="done"
                  autoCorrect={false}
                  autoComplete="off"
                  spellCheck={false}
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
            <View style={styles.helperTextContainer}>
              <Text style={styles.helperText}>What are the first things we need to learn?</Text>
            </View>
            
            <View style={styles.listContainer}>
              {explorationQuestions.map((question) => (
                <View key={question.id} style={styles.listItem}>
                  {editingQuestionId === question.id ? (
                    <TextInput
                      style={styles.listItemInput}
                      value={question.text}
                      onChangeText={(text) => {
                        setExplorationQuestions(explorationQuestions.map(q => 
                          q.id === question.id ? { ...q, text } : q
                        ));
                      }}
                      onBlur={() => {
                        handleEditExplorationQuestion(question.id, question.text);
                      }}
                      autoFocus
                      returnKeyType="done"
                      blurOnSubmit={true}
                      autoCorrect={false}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  ) : (
                    <React.Fragment>
                      <Text style={styles.listItemText}>{question.text}</Text>
                      <View style={styles.listItemActions}>
                        <TouchableOpacity onPress={() => handleToggleQuestionFavorite(question.id)}>
                          <IconSymbol 
                            ios_icon_name={question.isFavorite ? "star.fill" : "star"} 
                            android_material_icon_name={question.isFavorite ? "star" : "star-border"} 
                            size={20} 
                            color={question.isFavorite ? "#FFD700" : colors.textSecondary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleStartEditQuestion(question.id)}>
                          <IconSymbol 
                            ios_icon_name="pencil" 
                            android_material_icon_name="edit" 
                            size={20} 
                            color={colors.textSecondary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteExplorationQuestion(question.id)}>
                          <IconSymbol 
                            ios_icon_name="trash" 
                            android_material_icon_name="delete" 
                            size={20} 
                            color={colors.phaseFinish} 
                          />
                        </TouchableOpacity>
                      </View>
                    </React.Fragment>
                  )}
                </View>
              ))}
              
              {/* Add new question */}
              <View style={styles.addItemRow}>
                <TextInput
                  style={styles.addItemInput}
                  placeholder="Add exploration question..."
                  placeholderTextColor={colors.textSecondary}
                  value={newQuestionText}
                  onChangeText={setNewQuestionText}
                  onSubmitEditing={handleAddExplorationQuestion}
                  returnKeyType="done"
                  autoCorrect={false}
                  autoComplete="off"
                  spellCheck={false}
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Framing Decisions & Changes</Text>
              <TouchableOpacity onPress={() => setShowDecisionOverlay(true)}>
                <IconSymbol 
                  ios_icon_name="plus.circle" 
                  android_material_icon_name="add-circle" 
                  size={24} 
                  color={colors.phaseFraming} 
                />
              </TouchableOpacity>
            </View>
            <View style={styles.helperTextContainer}>
              <Text style={styles.helperText}>Note important changes and decisions</Text>
            </View>
            
            {framingDecisions.length === 0 ? (
              <View style={styles.emptyDecisions}>
                <Text style={styles.emptyDecisionsText}>No decisions recorded yet</Text>
              </View>
            ) : (
              <View style={styles.decisionsList}>
                {framingDecisions.map((decision: any) => (
                  <View key={decision.id} style={styles.decisionCard}>
                    <View style={styles.decisionHeader}>
                      <Text style={styles.decisionDate}>
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
                    {decision.rationale && (
                      <Text style={styles.decisionRationale}>{decision.rationale}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
              <Text style={styles.overlayOptionText}>Photos (Multiple)</Text>
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
              <Text style={styles.overlayOptionText}>Documents</Text>
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

      {/* Artifact Viewer */}
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
          </View>
          
          <View style={styles.artifactViewerContent}>
            {selectedArtifact?.type === 'image' ? (
              <Image 
                source={{ uri: selectedArtifact.uri }} 
                style={styles.artifactViewerImage}
                resizeMode="contain"
              />
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
          setShowDecisionOverlay(false);
          setEditingDecisionId(null);
          setDecisionSummary('');
          setDecisionRationale('');
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
              setShowDecisionOverlay(false);
              setEditingDecisionId(null);
              setDecisionSummary('');
              setDecisionRationale('');
            }}
          >
            <View style={styles.decisionOverlay}>
              <Text style={styles.overlayTitle}>
                {editingDecisionId ? 'Edit Decision' : 'Add Decision'}
              </Text>
              
              <Text style={styles.inputLabel}>Decision Summary</Text>
              <TextInput
                style={styles.input}
                placeholder="What was decided?"
                placeholderTextColor={colors.textSecondary}
                value={decisionSummary}
                onChangeText={setDecisionSummary}
                returnKeyType="next"
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
              />
              
              <Text style={styles.inputLabel}>Rationale</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Why was this decision made?"
                placeholderTextColor={colors.textSecondary}
                value={decisionRationale}
                onChangeText={setDecisionRationale}
                multiline
                numberOfLines={4}
                returnKeyType="default"
                blurOnSubmit={false}
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
              />
              
              <View style={styles.decisionButtons}>
                <TouchableOpacity 
                  style={styles.decisionCancelButton}
                  onPress={() => {
                    setDecisionSummary('');
                    setDecisionRationale('');
                    setEditingDecisionId(null);
                    setShowDecisionOverlay(false);
                  }}
                >
                  <Text style={styles.decisionCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.decisionSaveButton}
                  onPress={handleSaveDecision}
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
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.phaseFraming,
    marginBottom: 4,
  },
  helperTextContainer: {
    minHeight: 36,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
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
  artifactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  artifactGridItem: {
    width: '23%',
    aspectRatio: 1,
  },
  artifactThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.divider,
    position: 'relative',
  },
  artifactImage: {
    width: '100%',
    height: '100%',
  },
  artifactDoc: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  artifactLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  artifactOverlayActions: {
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
  emptyDecisions: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  emptyDecisionsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  decisionsList: {
    gap: 12,
  },
  decisionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  decisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  decisionDate: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  decisionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  decisionSummary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  decisionRationale: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
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
