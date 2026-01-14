
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

type CertaintyCategory = 'known' | 'assumed' | 'unknown';

// Reusable editable list item component
function EditableListItem({ 
  text, 
  onEdit, 
  onDelete, 
}: { 
  text: string; 
  onEdit: (newText: string) => void; 
  onDelete: () => void; 
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
  const [showQuestionOverlay, setShowQuestionOverlay] = useState(false);
  
  // Decision form state
  const [decisionSummary, setDecisionSummary] = useState('');
  const [decisionRationale, setDecisionRationale] = useState('');
  const [editingDecisionId, setEditingDecisionId] = useState<string | null>(null);
  
  // Question form state
  const [questionText, setQuestionText] = useState('');
  const [questionRationale, setQuestionRationale] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  // Refs for temporary input values (prevents re-renders during typing)
  const opportunityOriginRef = useRef('');
  const purposeRef = useRef('');
  const newCertaintyTextRef = useRef('');
  const newDesignSpaceTextRef = useRef('');
  
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

  // Artifact management - UPDATED for multiple photo selection
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
                name: 'URL',
                isFavorite: false,
              };
              
              const updatedArtifacts = [...project.artifacts, newArtifact];
              await updateAndSaveProject({ artifacts: updatedArtifacts });
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
        result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
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
          isFavorite: false,
        }));
        
        const updatedArtifacts = [...project.artifacts, ...newArtifacts];
        await updateAndSaveProject({ artifacts: updatedArtifacts });
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
            const updatedArtifacts = project.artifacts.filter(a => a.id !== artifactId);
            await updateAndSaveProject({ artifacts: updatedArtifacts });
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

  // UPDATED: Open artifact in external app
  const handleOpenArtifact = async (artifact: Artifact) => {
    console.log('Framing: Opening artifact', artifact.id);
    
    if (artifact.type === 'url') {
      const canOpen = await Linking.canOpenURL(artifact.uri);
      if (canOpen) {
        await Linking.openURL(artifact.uri);
      } else {
        Alert.alert('Error', 'Cannot open this URL.');
      }
    } else if (artifact.type === 'document') {
      // Try to open document with system viewer
      const canOpen = await Linking.canOpenURL(artifact.uri);
      if (canOpen) {
        await Linking.openURL(artifact.uri);
      } else {
        Alert.alert('Cannot Open', 'This document cannot be opened on this device.');
      }
    }
  };

  // Certainty items
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
    newCertaintyTextRef.current = '';
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

  // Design space items
  const handleAddDesignSpaceItem = async () => {
    if (!project || !newDesignSpaceTextRef.current.trim()) return;
    
    console.log('Framing: Adding design space item');
    const newItem: DesignSpaceItem = {
      id: Date.now().toString(),
      text: newDesignSpaceTextRef.current.trim(),
    };
    
    const updatedItems = [...(project.designSpaceItems || []), newItem];
    await updateAndSaveProject({ designSpaceItems: updatedItems });
    newDesignSpaceTextRef.current = '';
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

  // UPDATED: Exploration questions with modal management like decisions
  const handleSaveExplorationQuestion = async () => {
    if (!project || !questionText.trim()) {
      Alert.alert('Required', 'Please enter a question.');
      return;
    }
    
    console.log('Framing: Saving exploration question');
    
    let updatedQuestions: ExplorationQuestion[];
    
    if (editingQuestionId) {
      // Edit existing question
      updatedQuestions = (project.explorationQuestions || []).map(q => 
        q.id === editingQuestionId 
          ? { ...q, text: questionText.trim() }
          : q
      );
    } else {
      // Add new question
      const newQuestion: ExplorationQuestion = {
        id: Date.now().toString(),
        text: questionText.trim(),
        isFavorite: false,
      };
      updatedQuestions = [...(project.explorationQuestions || []), newQuestion];
    }
    
    await updateAndSaveProject({ explorationQuestions: updatedQuestions });
    setQuestionText('');
    setQuestionRationale('');
    setEditingQuestionId(null);
    setShowQuestionOverlay(false);
  };

  const handleEditExplorationQuestion = (question: ExplorationQuestion) => {
    console.log('Framing: Editing exploration question', question.id);
    setQuestionText(question.text);
    setEditingQuestionId(question.id);
    setShowQuestionOverlay(true);
  };

  const handleDeleteExplorationQuestion = async (id: string) => {
    if (!project) return;
    
    console.log('Framing: Deleting exploration question', id);
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedQuestions = (project.explorationQuestions || []).filter(q => q.id !== id);
            await updateAndSaveProject({ explorationQuestions: updatedQuestions });
          }
        }
      ]
    );
  };

  // UPDATED: Toggle favorite and create Draft Exploration Loop
  const handleToggleQuestionFavorite = async (id: string) => {
    if (!project) return;
    
    console.log('Framing: Toggling question favorite', id);
    
    const question = (project.explorationQuestions || []).find(q => q.id === id);
    if (!question) return;
    
    const newFavoriteStatus = !question.isFavorite;
    
    // Update question favorite status
    const updatedQuestions = (project.explorationQuestions || []).map(q => 
      q.id === id ? { ...q, isFavorite: newFavoriteStatus } : q
    );
    
    // If favoriting, create a new Draft Exploration Loop
    if (newFavoriteStatus) {
      const newLoop: ExplorationLoop = {
        id: Date.now().toString(),
        question: question.text,
        status: 'paused', // Using 'paused' as Draft status
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
      
      const updatedLoops = [...(project.explorationLoops || []), newLoop];
      
      await updateAndSaveProject({ 
        explorationQuestions: updatedQuestions,
        explorationLoops: updatedLoops,
      });
      
      // Show confirmation message
      Alert.alert(
        'Exploration Loop Created',
        'A new Exploration Loop has been created in Draft status.',
        [{ text: 'OK' }]
      );
    } else {
      await updateAndSaveProject({ explorationQuestions: updatedQuestions });
    }
  };

  // Framing decisions - UPDATED with rationale field
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
          ? { ...d, summary: decisionSummary.trim(), rationale: decisionRationale.trim() }
          : d
      );
    } else {
      // Add new decision
      const newDecision: FramingDecision = {
        id: Date.now().toString(),
        summary: decisionSummary.trim(),
        rationale: decisionRationale.trim(),
        artifacts: [],
        timestamp: new Date().toISOString(),
      };
      updatedDecisions = [...(project.framingDecisions || []), newDecision];
    }
    
    await updateAndSaveProject({ framingDecisions: updatedDecisions });
    setDecisionSummary('');
    setDecisionRationale('');
    setEditingDecisionId(null);
    setShowDecisionOverlay(false);
  };

  const handleEditDecision = (decision: FramingDecision) => {
    console.log('Framing: Editing decision', decision.id);
    setDecisionSummary(decision.summary);
    setDecisionRationale(decision.rationale || '');
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
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading project...</Text>
        </View>
      </View>
    );
  }

  const getCertaintyItemsByCategory = (category: CertaintyCategory) => {
    return (project.certaintyItems || []).filter(item => item.category === category);
  };

  // UPDATED: Helper text for unknown section
  const getCertaintyHelperText = (category: CertaintyCategory) => {
    switch (category) {
      case 'known':
        return 'Facts or insights which you are confident';
      case 'assumed':
        return 'Things you believe are true, but are not confirmed';
      case 'unknown':
        return 'Things you don't understand or still need to learn.';
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

        {/* 3. Artifacts (Visuals) - UPDATED: 4-column grid with favorite/delete icons */}
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
                  </TouchableOpacity>
                  
                  {/* Favorite and Delete icons in top right corner */}
                  <View style={styles.artifactActions}>
                    <TouchableOpacity 
                      style={styles.artifactActionButton}
                      onPress={() => handleToggleArtifactFavorite(artifact.id)}
                    >
                      <IconSymbol 
                        ios_icon_name={artifact.isFavorite ? "star.fill" : "star"} 
                        android_material_icon_name={artifact.isFavorite ? "star" : "star-border"} 
                        size={20} 
                        color={artifact.isFavorite ? "#FFD700" : "#FFFFFF"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.artifactActionButton}
                      onPress={() => handleDeleteArtifact(artifact.id)}
                    >
                      <IconSymbol 
                        ios_icon_name="trash.fill" 
                        android_material_icon_name="delete" 
                        size={20} 
                        color="#FFFFFF" 
                      />
                    </TouchableOpacity>
                  </View>
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
            
            {/* Add new item */}
            <View style={styles.addItemRow}>
              <TextInput
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
            
            {/* Add new item */}
            <View style={styles.addItemRow}>
              <TextInput
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

        {/* 6. Exploration Questions - UPDATED: Same approach as Decisions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exploration Questions</Text>
          <Text style={styles.helperText}>What are the first things we need to learn?</Text>
          
          <TouchableOpacity 
            style={styles.addDecisionButton}
            onPress={() => {
              console.log('Framing: Opening Add Question overlay');
              setShowQuestionOverlay(true);
            }}
          >
            <IconSymbol 
              ios_icon_name="plus.circle" 
              android_material_icon_name="add-circle" 
              size={20} 
              color={colors.phaseFraming} 
            />
            <Text style={styles.addDecisionText}>Add Question</Text>
          </TouchableOpacity>
          
          {(project.explorationQuestions || []).length > 0 && (
            <View style={styles.decisionsTimeline}>
              {(project.explorationQuestions || []).map((question) => (
                <View key={question.id} style={styles.decisionItem}>
                  <View style={styles.decisionDot} />
                  <View style={styles.decisionContent}>
                    <View style={styles.decisionHeader}>
                      <View style={styles.decisionActions}>
                        <TouchableOpacity onPress={() => handleToggleQuestionFavorite(question.id)}>
                          <IconSymbol 
                            ios_icon_name={question.isFavorite ? "star.fill" : "star"} 
                            android_material_icon_name={question.isFavorite ? "star" : "star-border"} 
                            size={20} 
                            color={question.isFavorite ? "#FFD700" : colors.textSecondary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleEditExplorationQuestion(question)}>
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
                    </View>
                    <Text style={styles.decisionSummary}>{question.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
                    {decision.rationale && (
                      <Text style={styles.decisionRationale}>{decision.rationale}</Text>
                    )}
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
              console.log('Framing: Closing decision overlay via background tap');
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
              
              <Text style={styles.inputLabel}>Decision / Change Summary</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What was decided or changed?"
                placeholderTextColor={colors.textSecondary}
                value={decisionSummary}
                onChangeText={setDecisionSummary}
                multiline
                numberOfLines={3}
                returnKeyType="done"
                blurOnSubmit={true}
              />
              
              <Text style={styles.inputLabel}>Rationale (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Why was this decision made?"
                placeholderTextColor={colors.textSecondary}
                value={decisionRationale}
                onChangeText={setDecisionRationale}
                multiline
                numberOfLines={3}
                returnKeyType="done"
                blurOnSubmit={true}
              />
              
              <View style={styles.decisionButtons}>
                <TouchableOpacity 
                  style={styles.decisionCancelButton}
                  onPress={() => {
                    console.log('Framing: Cancel button pressed');
                    setDecisionSummary('');
                    setDecisionRationale('');
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

      {/* Add/Edit Exploration Question Overlay */}
      <Modal
        visible={showQuestionOverlay}
        transparent
        animationType="slide"
        onRequestClose={() => {
          console.log('Framing: Closing question overlay');
          setShowQuestionOverlay(false);
          setEditingQuestionId(null);
          setQuestionText('');
          setQuestionRationale('');
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
              console.log('Framing: Closing question overlay via background tap');
              setShowQuestionOverlay(false);
              setEditingQuestionId(null);
              setQuestionText('');
              setQuestionRationale('');
            }}
          >
            <View style={styles.decisionOverlay}>
              <Text style={styles.overlayTitle}>
                {editingQuestionId ? 'Edit Question' : 'Add Question'}
              </Text>
              
              <Text style={styles.inputLabel}>Exploration Question</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What do you need to learn?"
                placeholderTextColor={colors.textSecondary}
                value={questionText}
                onChangeText={setQuestionText}
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
                    setQuestionText('');
                    setQuestionRationale('');
                    setEditingQuestionId(null);
                    setShowQuestionOverlay(false);
                    Keyboard.dismiss();
                  }}
                >
                  <Text style={styles.decisionCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.decisionSaveButton}
                  onPress={() => {
                    console.log('Framing: Save button pressed');
                    handleSaveExplorationQuestion();
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF0FF',
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
  artifactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginHorizontal: -4,
  },
  artifactGridItem: {
    width: '25%',
    padding: 4,
    position: 'relative',
  },
  artifactThumb: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.divider,
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
    fontSize: 10,
    color: colors.phaseFraming,
    fontWeight: '600',
    marginTop: 4,
  },
  artifactActions: {
    position: 'absolute',
    top: 8,
    right: 8,
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
    fontWeight: '600',
  },
  decisionRationale: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
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
