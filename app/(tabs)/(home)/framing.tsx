
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Image,
  Alert,
  Dimensions,
  Keyboard,
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
} from '@/utils/storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

type CertaintyCategory = 'known' | 'assumed' | 'unknown';

export default function FramingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  
  // Framing fields - local state
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
  
  // New item inputs
  const [newCertaintyText, setNewCertaintyText] = useState('');
  const [newDesignSpaceText, setNewDesignSpaceText] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  
  // Decision overlay
  const [decisionSummary, setDecisionSummary] = useState('');

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

  const saveChanges = useCallback(async () => {
    if (!project) return;
    
    console.log('Framing: Saving changes to project');
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
  }, [project, opportunityOrigin, purpose, certaintyItems, designSpaceItems, explorationQuestions, framingDecisions]);

  useFocusEffect(
    useCallback(() => {
      loadProject();
      return () => {
        console.log('Framing: Screen unfocused, saving changes');
        saveChanges();
      };
    }, [loadProject, saveChanges])
  );

  // Artifact management
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
        });
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
      }
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newArtifact: Artifact = {
          id: Date.now().toString(),
          type: type === 'document' ? 'document' : 'image',
          uri: asset.uri,
          name: asset.name || 'Untitled',
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
    
    console.log('Framing: Toggling artifact favorite', artifactId);
    const updatedArtifacts = project.artifacts.map(a => 
      a.id === artifactId ? { ...a, caption: a.caption === 'favorite' ? undefined : 'favorite' } : a
    );
    
    const updatedProject = {
      ...project,
      artifacts: updatedArtifacts,
      updatedDate: new Date().toISOString(),
    };
    
    await updateProject(updatedProject);
    setProject(updatedProject);
  };

  // Certainty items
  const handleAddCertaintyItem = () => {
    if (!newCertaintyText.trim()) return;
    
    console.log('Framing: Adding certainty item');
    const newItem: CertaintyItem = {
      id: Date.now().toString(),
      text: newCertaintyText.trim(),
      category: selectedCertaintyCategory,
    };
    
    setCertaintyItems([...certaintyItems, newItem]);
    setNewCertaintyText('');
    Keyboard.dismiss();
  };

  const handleDeleteCertaintyItem = (id: string) => {
    console.log('Framing: Deleting certainty item', id);
    setCertaintyItems(certaintyItems.filter(item => item.id !== id));
  };

  const handleEditCertaintyItem = (id: string, newText: string) => {
    console.log('Framing: Editing certainty item', id);
    setCertaintyItems(certaintyItems.map(item => 
      item.id === id ? { ...item, text: newText } : item
    ));
    setEditingCertaintyId(null);
  };

  // Design space items
  const handleAddDesignSpaceItem = () => {
    if (!newDesignSpaceText.trim()) return;
    
    console.log('Framing: Adding design space item');
    const newItem: DesignSpaceItem = {
      id: Date.now().toString(),
      text: newDesignSpaceText.trim(),
    };
    
    setDesignSpaceItems([...designSpaceItems, newItem]);
    setNewDesignSpaceText('');
    Keyboard.dismiss();
  };

  const handleDeleteDesignSpaceItem = (id: string) => {
    console.log('Framing: Deleting design space item', id);
    setDesignSpaceItems(designSpaceItems.filter(item => item.id !== id));
  };

  const handleEditDesignSpaceItem = (id: string, newText: string) => {
    console.log('Framing: Editing design space item', id);
    setDesignSpaceItems(designSpaceItems.map(item => 
      item.id === id ? { ...item, text: newText } : item
    ));
    setEditingDesignSpaceId(null);
  };

  // Exploration questions
  const handleAddExplorationQuestion = () => {
    if (!newQuestionText.trim()) return;
    
    console.log('Framing: Adding exploration question');
    const newQuestion: ExplorationQuestion = {
      id: Date.now().toString(),
      text: newQuestionText.trim(),
      isFavorite: false,
    };
    
    setExplorationQuestions([...explorationQuestions, newQuestion]);
    setNewQuestionText('');
    Keyboard.dismiss();
  };

  const handleDeleteExplorationQuestion = (id: string) => {
    console.log('Framing: Deleting exploration question', id);
    setExplorationQuestions(explorationQuestions.filter(q => q.id !== id));
  };

  const handleEditExplorationQuestion = (id: string, newText: string) => {
    console.log('Framing: Editing exploration question', id);
    setExplorationQuestions(explorationQuestions.map(q => 
      q.id === id ? { ...q, text: newText } : q
    ));
    setEditingQuestionId(null);
  };

  const handleToggleQuestionFavorite = (id: string) => {
    console.log('Framing: Toggling question favorite', id);
    setExplorationQuestions(explorationQuestions.map(q => 
      q.id === id ? { ...q, isFavorite: !q.isFavorite } : q
    ));
  };

  // Framing decisions
  const handleSaveDecision = async () => {
    if (!decisionSummary.trim()) {
      Alert.alert('Required', 'Please enter a decision summary.');
      return;
    }
    
    console.log('Framing: Saving decision');
    const newDecision: FramingDecision = {
      id: Date.now().toString(),
      summary: decisionSummary.trim(),
      artifacts: [],
      timestamp: new Date().toISOString(),
    };
    
    setFramingDecisions([...framingDecisions, newDecision]);
    setDecisionSummary('');
    setShowDecisionOverlay(false);
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
        return 'Things you don&apos;t understand or still need to learn';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
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
            onBlur={saveChanges}
            multiline
            numberOfLines={4}
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
            value={purpose}
            onChangeText={setPurpose}
            onBlur={saveChanges}
            multiline
            numberOfLines={4}
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.artifactStrip}>
              {project.artifacts.map((artifact) => (
                <TouchableOpacity
                  key={artifact.id}
                  style={styles.artifactThumb}
                  onPress={() => {
                    setSelectedArtifact(artifact);
                    setShowArtifactViewer(true);
                  }}
                >
                  {artifact.type === 'image' ? (
                    <Image source={{ uri: artifact.uri }} style={styles.artifactImage} />
                  ) : (
                    <View style={styles.artifactDoc}>
                      <IconSymbol 
                        ios_icon_name="doc" 
                        android_material_icon_name="description" 
                        size={32} 
                        color={colors.textSecondary} 
                      />
                    </View>
                  )}
                  {artifact.caption === 'favorite' && (
                    <View style={styles.favoriteBadge}>
                      <IconSymbol 
                        ios_icon_name="star.fill" 
                        android_material_icon_name="star" 
                        size={16} 
                        color="#FFD700" 
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
          
          {/* Helper text for selected category */}
          <Text style={styles.helperText}>{getCertaintyHelperText(selectedCertaintyCategory)}</Text>
          
          {/* List for selected category */}
          <View style={styles.listContainer}>
            {getCertaintyItemsByCategory(selectedCertaintyCategory).map((item) => (
              <View key={item.id} style={styles.listItem}>
                {editingCertaintyId === item.id ? (
                  <TextInput
                    style={styles.listItemInput}
                    value={item.text}
                    onChangeText={(text) => handleEditCertaintyItem(item.id, text)}
                    onBlur={() => {
                      setEditingCertaintyId(null);
                      saveChanges();
                    }}
                    autoFocus
                  />
                ) : (
                  <>
                    <Text style={styles.listItemText}>{item.text}</Text>
                    <View style={styles.listItemActions}>
                      <TouchableOpacity onPress={() => setEditingCertaintyId(item.id)}>
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
                  </>
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
            {designSpaceItems.map((item) => (
              <View key={item.id} style={styles.listItem}>
                {editingDesignSpaceId === item.id ? (
                  <TextInput
                    style={styles.listItemInput}
                    value={item.text}
                    onChangeText={(text) => handleEditDesignSpaceItem(item.id, text)}
                    onBlur={() => {
                      setEditingDesignSpaceId(null);
                      saveChanges();
                    }}
                    autoFocus
                  />
                ) : (
                  <>
                    <Text style={styles.listItemText}>{item.text}</Text>
                    <View style={styles.listItemActions}>
                      <TouchableOpacity onPress={() => setEditingDesignSpaceId(item.id)}>
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
                  </>
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
            {explorationQuestions.map((question) => (
              <View key={question.id} style={styles.listItem}>
                {editingQuestionId === question.id ? (
                  <TextInput
                    style={styles.listItemInput}
                    value={question.text}
                    onChangeText={(text) => handleEditExplorationQuestion(question.id, text)}
                    onBlur={() => {
                      setEditingQuestionId(null);
                      saveChanges();
                    }}
                    autoFocus
                  />
                ) : (
                  <>
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
                      <TouchableOpacity onPress={() => setEditingQuestionId(question.id)}>
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
                  </>
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
            onPress={() => setShowDecisionOverlay(true)}
          >
            <IconSymbol 
              ios_icon_name="plus.circle" 
              android_material_icon_name="add-circle" 
              size={20} 
              color={colors.phaseFraming} 
            />
            <Text style={styles.addDecisionText}>Add Decision</Text>
          </TouchableOpacity>
          
          {framingDecisions.length > 0 && (
            <View style={styles.decisionsTimeline}>
              {framingDecisions.map((decision) => (
                <View key={decision.id} style={styles.decisionItem}>
                  <View style={styles.decisionDot} />
                  <View style={styles.decisionContent}>
                    <Text style={styles.decisionSummary}>{decision.summary}</Text>
                    <Text style={styles.decisionTimestamp}>
                      {new Date(decision.timestamp).toLocaleDateString()}
                    </Text>
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
            
            <View style={styles.artifactViewerActions}>
              <TouchableOpacity 
                onPress={() => selectedArtifact && handleToggleArtifactFavorite(selectedArtifact.id)}
                style={styles.artifactViewerAction}
              >
                <IconSymbol 
                  ios_icon_name={selectedArtifact?.caption === 'favorite' ? "star.fill" : "star"} 
                  android_material_icon_name={selectedArtifact?.caption === 'favorite' ? "star" : "star-border"} 
                  size={28} 
                  color={selectedArtifact?.caption === 'favorite' ? "#FFD700" : "#FFFFFF"} 
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

      {/* Add Decision Overlay */}
      <Modal
        visible={showDecisionOverlay}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDecisionOverlay(false)}
      >
        <TouchableOpacity 
          style={styles.overlayBackground}
          activeOpacity={1}
          onPress={() => setShowDecisionOverlay(false)}
        >
          <View style={styles.decisionOverlay}>
            <Text style={styles.overlayTitle}>Add Decision</Text>
            
            <Text style={styles.inputLabel}>Decision / Change Summary</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What was decided or changed?"
              placeholderTextColor={colors.textSecondary}
              value={decisionSummary}
              onChangeText={setDecisionSummary}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.decisionButtons}>
              <TouchableOpacity 
                style={styles.decisionCancelButton}
                onPress={() => {
                  setDecisionSummary('');
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
    paddingBottom: 100,
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
  artifactStrip: {
    flexDirection: 'row',
    marginTop: 12,
  },
  artifactThumb: {
    width: 100,
    height: 100,
    backgroundColor: colors.divider,
    marginRight: 8,
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
  favoriteBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  decisionSummary: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  decisionTimestamp: {
    fontSize: 12,
    color: colors.textSecondary,
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
