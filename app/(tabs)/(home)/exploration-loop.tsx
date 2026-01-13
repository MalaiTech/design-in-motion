
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import {
  getProjects,
  updateProject,
  Project,
  ExplorationLoop,
  Artifact,
  ExploreItem,
  BuildItem,
  CheckItem,
  AdaptItem,
  ExplorationDecision,
  ExplorationQuestion,
} from '@/utils/storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export default function ExplorationLoopScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;
  const loopId = params.loopId as string | undefined;
  const isNewLoop = !loopId;

  const [project, setProject] = useState<Project | null>(null);
  const [loop, setLoop] = useState<ExplorationLoop | null>(null);
  
  // Loop fields
  const [status, setStatus] = useState<'active' | 'paused' | 'completed'>('active');
  const [question, setQuestion] = useState('');
  const [exploreItems, setExploreItems] = useState<ExploreItem[]>([]);
  const [exploreArtifactIds, setExploreArtifactIds] = useState<string[]>([]);
  const [buildItems, setBuildItems] = useState<BuildItem[]>([]);
  const [buildArtifactIds, setBuildArtifactIds] = useState<string[]>([]);
  const [checkItems, setCheckItems] = useState<CheckItem[]>([]);
  const [adaptItems, setAdaptItems] = useState<AdaptItem[]>([]);
  const [explorationDecisions, setExplorationDecisions] = useState<ExplorationDecision[]>([]);
  const [nextExplorationQuestions, setNextExplorationQuestions] = useState<ExplorationQuestion[]>([]);
  const [timeSpent, setTimeSpent] = useState('0');
  const [costs, setCosts] = useState('0');
  const [invoicesArtifactIds, setInvoicesArtifactIds] = useState<string[]>([]);
  
  // UI state
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showArtifactOverlay, setShowArtifactOverlay] = useState(false);
  const [artifactSection, setArtifactSection] = useState<'explore' | 'build' | 'invoices'>('explore');
  const [showArtifactViewer, setShowArtifactViewer] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [showDecisionOverlay, setShowDecisionOverlay] = useState(false);
  
  // Edit states
  const [editingExploreId, setEditingExploreId] = useState<string | null>(null);
  const [editingBuildId, setEditingBuildId] = useState<string | null>(null);
  const [editingCheckId, setEditingCheckId] = useState<string | null>(null);
  const [editingAdaptId, setEditingAdaptId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  // New item inputs
  const [newExploreText, setNewExploreText] = useState('');
  const [newBuildText, setNewBuildText] = useState('');
  const [newCheckText, setNewCheckText] = useState('');
  const [newAdaptText, setNewAdaptText] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  
  // Decision overlay
  const [decisionSummary, setDecisionSummary] = useState('');
  
  const hasUnsavedChanges = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadProject = useCallback(async () => {
    const projects = await getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
      
      if (loopId) {
        const foundLoop = found.explorationLoops?.find(l => l.id === loopId);
        if (foundLoop) {
          setLoop(foundLoop);
          setStatus(foundLoop.status);
          setQuestion(foundLoop.question);
          setExploreItems(foundLoop.exploreItems || []);
          setExploreArtifactIds(foundLoop.exploreArtifactIds || []);
          setBuildItems(foundLoop.buildItems || []);
          setBuildArtifactIds(foundLoop.buildArtifactIds || []);
          setCheckItems(foundLoop.checkItems || []);
          setAdaptItems(foundLoop.adaptItems || []);
          setExplorationDecisions(foundLoop.explorationDecisions || []);
          setNextExplorationQuestions(foundLoop.nextExplorationQuestions || []);
          setTimeSpent(foundLoop.timeSpent?.toString() || '0');
          setCosts(foundLoop.costs?.toString() || '0');
          setInvoicesArtifactIds(foundLoop.invoicesArtifactIds || []);
        } else {
          Alert.alert('Loop Not Found', 'This exploration loop no longer exists.', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }
      }
    } else {
      Alert.alert('Project Not Found', 'This project no longer exists.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [projectId, loopId, router]);

  useFocusEffect(
    useCallback(() => {
      loadProject();
      return () => {
        if (hasUnsavedChanges.current) {
          saveChanges();
        }
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }, [loadProject])
  );

  const saveChanges = useCallback(async () => {
    if (!project) return;
    
    const updatedLoop: ExplorationLoop = {
      id: loopId || Date.now().toString(),
      question,
      status,
      updatedDate: new Date().toISOString(),
      artifactIds: [...exploreArtifactIds, ...buildArtifactIds, ...invoicesArtifactIds],
      exploreItems,
      exploreArtifactIds,
      buildItems,
      buildArtifactIds,
      checkItems,
      adaptItems,
      explorationDecisions,
      nextExplorationQuestions,
      timeSpent: parseFloat(timeSpent) || 0,
      costs: parseFloat(costs) || 0,
      invoicesArtifactIds,
    };
    
    let updatedLoops = project.explorationLoops || [];
    if (isNewLoop) {
      updatedLoops = [...updatedLoops, updatedLoop];
    } else {
      updatedLoops = updatedLoops.map(l => l.id === loopId ? updatedLoop : l);
    }
    
    const updatedProject: Project = {
      ...project,
      explorationLoops: updatedLoops,
      updatedDate: new Date().toISOString(),
    };
    
    await updateProject(updatedProject);
    hasUnsavedChanges.current = false;
  }, [project, loopId, isNewLoop, question, status, exploreItems, exploreArtifactIds, buildItems, buildArtifactIds, checkItems, adaptItems, explorationDecisions, nextExplorationQuestions, timeSpent, costs, invoicesArtifactIds]);

  const markAsChanged = useCallback(() => {
    hasUnsavedChanges.current = true;
    
    // Debounced auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveChanges();
    }, 500);
  }, [saveChanges]);

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
              
              // Add to appropriate section
              if (artifactSection === 'explore') {
                setExploreArtifactIds([...exploreArtifactIds, newArtifact.id]);
              } else if (artifactSection === 'build') {
                setBuildArtifactIds([...buildArtifactIds, newArtifact.id]);
              } else {
                setInvoicesArtifactIds([...invoicesArtifactIds, newArtifact.id]);
              }
              
              markAsChanged();
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
        
        // Add to appropriate section
        if (artifactSection === 'explore') {
          setExploreArtifactIds([...exploreArtifactIds, newArtifact.id]);
        } else if (artifactSection === 'build') {
          setBuildArtifactIds([...buildArtifactIds, newArtifact.id]);
        } else {
          setInvoicesArtifactIds([...invoicesArtifactIds, newArtifact.id]);
        }
        
        markAsChanged();
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
            
            // Remove from section lists
            setExploreArtifactIds(exploreArtifactIds.filter(id => id !== artifactId));
            setBuildArtifactIds(buildArtifactIds.filter(id => id !== artifactId));
            setInvoicesArtifactIds(invoicesArtifactIds.filter(id => id !== artifactId));
            
            markAsChanged();
            setShowArtifactViewer(false);
          }
        }
      ]
    );
  };

  const handleToggleArtifactFavorite = async (artifactId: string) => {
    if (!project) return;
    
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

  // Explore items
  const handleAddExploreItem = () => {
    if (!newExploreText.trim()) return;
    
    const newItem: ExploreItem = {
      id: Date.now().toString(),
      text: newExploreText.trim(),
      isFavorite: false,
    };
    
    setExploreItems([...exploreItems, newItem]);
    setNewExploreText('');
    markAsChanged();
  };

  const handleDeleteExploreItem = (id: string) => {
    setExploreItems(exploreItems.filter(item => item.id !== id));
    markAsChanged();
  };

  const handleEditExploreItem = (id: string, newText: string) => {
    setExploreItems(exploreItems.map(item => 
      item.id === id ? { ...item, text: newText } : item
    ));
    setEditingExploreId(null);
    markAsChanged();
  };

  const handleToggleExploreFavorite = (id: string) => {
    setExploreItems(exploreItems.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
    markAsChanged();
  };

  // Build items
  const handleAddBuildItem = () => {
    if (!newBuildText.trim()) return;
    
    const newItem: BuildItem = {
      id: Date.now().toString(),
      text: newBuildText.trim(),
      isFavorite: false,
    };
    
    setBuildItems([...buildItems, newItem]);
    setNewBuildText('');
    markAsChanged();
  };

  const handleDeleteBuildItem = (id: string) => {
    setBuildItems(buildItems.filter(item => item.id !== id));
    markAsChanged();
  };

  const handleEditBuildItem = (id: string, newText: string) => {
    setBuildItems(buildItems.map(item => 
      item.id === id ? { ...item, text: newText } : item
    ));
    setEditingBuildId(null);
    markAsChanged();
  };

  const handleToggleBuildFavorite = (id: string) => {
    setBuildItems(buildItems.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
    markAsChanged();
  };

  // Check items
  const handleAddCheckItem = () => {
    if (!newCheckText.trim()) return;
    
    const newItem: CheckItem = {
      id: Date.now().toString(),
      text: newCheckText.trim(),
      isFavorite: false,
    };
    
    setCheckItems([...checkItems, newItem]);
    setNewCheckText('');
    markAsChanged();
  };

  const handleDeleteCheckItem = (id: string) => {
    setCheckItems(checkItems.filter(item => item.id !== id));
    markAsChanged();
  };

  const handleEditCheckItem = (id: string, newText: string) => {
    setCheckItems(checkItems.map(item => 
      item.id === id ? { ...item, text: newText } : item
    ));
    setEditingCheckId(null);
    markAsChanged();
  };

  const handleToggleCheckFavorite = (id: string) => {
    setCheckItems(checkItems.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
    markAsChanged();
  };

  // Adapt items
  const handleAddAdaptItem = () => {
    if (!newAdaptText.trim()) return;
    
    const newItem: AdaptItem = {
      id: Date.now().toString(),
      text: newAdaptText.trim(),
      isFavorite: false,
    };
    
    setAdaptItems([...adaptItems, newItem]);
    setNewAdaptText('');
    markAsChanged();
  };

  const handleDeleteAdaptItem = (id: string) => {
    setAdaptItems(adaptItems.filter(item => item.id !== id));
    markAsChanged();
  };

  const handleEditAdaptItem = (id: string, newText: string) => {
    setAdaptItems(adaptItems.map(item => 
      item.id === id ? { ...item, text: newText } : item
    ));
    setEditingAdaptId(null);
    markAsChanged();
  };

  const handleToggleAdaptFavorite = (id: string) => {
    setAdaptItems(adaptItems.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
    markAsChanged();
  };

  // Next exploration questions
  const handleAddNextQuestion = () => {
    if (!newQuestionText.trim()) return;
    
    const newQuestion: ExplorationQuestion = {
      id: Date.now().toString(),
      text: newQuestionText.trim(),
      isFavorite: false,
    };
    
    setNextExplorationQuestions([...nextExplorationQuestions, newQuestion]);
    setNewQuestionText('');
    markAsChanged();
  };

  const handleDeleteNextQuestion = (id: string) => {
    setNextExplorationQuestions(nextExplorationQuestions.filter(q => q.id !== id));
    markAsChanged();
  };

  const handleEditNextQuestion = (id: string, newText: string) => {
    setNextExplorationQuestions(nextExplorationQuestions.map(q => 
      q.id === id ? { ...q, text: newText } : q
    ));
    setEditingQuestionId(null);
    markAsChanged();
  };

  const handleToggleNextQuestionFavorite = (id: string) => {
    setNextExplorationQuestions(nextExplorationQuestions.map(q => 
      q.id === id ? { ...q, isFavorite: !q.isFavorite } : q
    ));
    markAsChanged();
  };

  // Exploration decisions
  const handleSaveDecision = async () => {
    if (!decisionSummary.trim()) {
      Alert.alert('Required', 'Please enter a decision summary.');
      return;
    }
    
    const newDecision: ExplorationDecision = {
      id: Date.now().toString(),
      summary: decisionSummary.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setExplorationDecisions([...explorationDecisions, newDecision]);
    setDecisionSummary('');
    setShowDecisionOverlay(false);
    markAsChanged();
  };

  const getArtifactsByIds = (ids: string[]): Artifact[] => {
    if (!project) return [];
    return project.artifacts.filter(a => ids.includes(a.id));
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
        >
          {/* 1. Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <TouchableOpacity 
              style={styles.statusButton}
              onPress={() => setShowStatusPicker(true)}
            >
              <Text style={styles.statusButtonText}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
              <IconSymbol 
                ios_icon_name="chevron.down" 
                android_material_icon_name="arrow-drop-down" 
                size={20} 
                color={colors.text} 
              />
            </TouchableOpacity>
          </View>

          {/* 2. Exploration / Learning Question */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exploration / Learning Question</Text>
            <TextInput
              style={styles.textArea}
              placeholder="What are you exploring or learning?"
              placeholderTextColor={colors.textSecondary}
              value={question}
              onChangeText={(text) => {
                setQuestion(text);
                markAsChanged();
              }}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* 3. Explore */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explore</Text>
            
            <View style={styles.listContainer}>
              {exploreItems.map((item, index) => (
                <View key={item.id} style={styles.listItem}>
                  {editingExploreId === item.id ? (
                    <TextInput
                      style={styles.listItemInput}
                      value={item.text}
                      onChangeText={(text) => handleEditExploreItem(item.id, text)}
                      onBlur={() => setEditingExploreId(null)}
                      autoFocus
                    />
                  ) : (
                    <React.Fragment key={index}>
                      <Text style={styles.listItemText}>{item.text}</Text>
                      <View style={styles.listItemActions}>
                        <TouchableOpacity onPress={() => handleToggleExploreFavorite(item.id)}>
                          <IconSymbol 
                            ios_icon_name={item.isFavorite ? "star.fill" : "star"} 
                            android_material_icon_name={item.isFavorite ? "star" : "star-border"} 
                            size={20} 
                            color={item.isFavorite ? "#FFD700" : colors.textSecondary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditingExploreId(item.id)}>
                          <IconSymbol 
                            ios_icon_name="pencil" 
                            android_material_icon_name="edit" 
                            size={20} 
                            color={colors.textSecondary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteExploreItem(item.id)}>
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
              
              <View style={styles.addItemRow}>
                <TextInput
                  style={styles.addItemInput}
                  placeholder="Add exploration note..."
                  placeholderTextColor={colors.textSecondary}
                  value={newExploreText}
                  onChangeText={setNewExploreText}
                  onSubmitEditing={handleAddExploreItem}
                />
                <TouchableOpacity onPress={handleAddExploreItem}>
                  <IconSymbol 
                    ios_icon_name="plus.circle.fill" 
                    android_material_icon_name="add-circle" 
                    size={28} 
                    color={colors.phaseExploration} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Explore Artifacts */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.addVisualsButton}
              onPress={() => {
                setArtifactSection('explore');
                setShowArtifactOverlay(true);
              }}
            >
              <IconSymbol 
                ios_icon_name="plus.circle" 
                android_material_icon_name="add-circle" 
                size={20} 
                color={colors.phaseExploration} 
              />
              <Text style={styles.addVisualsText}>Visuals</Text>
            </TouchableOpacity>
            
            {exploreArtifactIds.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.artifactStrip}>
                {getArtifactsByIds(exploreArtifactIds).map((artifact, index) => (
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

          {/* 4. Build */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Build</Text>
            
            <View style={styles.listContainer}>
              {buildItems.map((item, index) => (
                <View key={item.id} style={styles.listItem}>
                  {editingBuildId === item.id ? (
                    <TextInput
                      style={styles.listItemInput}
                      value={item.text}
                      onChangeText={(text) => handleEditBuildItem(item.id, text)}
                      onBlur={() => setEditingBuildId(null)}
                      autoFocus
                    />
                  ) : (
                    <React.Fragment key={index}>
                      <Text style={styles.listItemText}>{item.text}</Text>
                      <View style={styles.listItemActions}>
                        <TouchableOpacity onPress={() => handleToggleBuildFavorite(item.id)}>
                          <IconSymbol 
                            ios_icon_name={item.isFavorite ? "star.fill" : "star"} 
                            android_material_icon_name={item.isFavorite ? "star" : "star-border"} 
                            size={20} 
                            color={item.isFavorite ? "#FFD700" : colors.textSecondary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditingBuildId(item.id)}>
                          <IconSymbol 
                            ios_icon_name="pencil" 
                            android_material_icon_name="edit" 
                            size={20} 
                            color={colors.textSecondary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteBuildItem(item.id)}>
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
              
              <View style={styles.addItemRow}>
                <TextInput
                  style={styles.addItemInput}
                  placeholder="Add build note..."
                  placeholderTextColor={colors.textSecondary}
                  value={newBuildText}
                  onChangeText={setNewBuildText}
                  onSubmitEditing={handleAddBuildItem}
                />
                <TouchableOpacity onPress={handleAddBuildItem}>
                  <IconSymbol 
                    ios_icon_name="plus.circle.fill" 
                    android_material_icon_name="add-circle" 
                    size={28} 
                    color={colors.phaseExploration} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Build Artifacts */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.addVisualsButton}
              onPress={() => {
                setArtifactSection('build');
                setShowArtifactOverlay(true);
              }}
            >
              <IconSymbol 
                ios_icon_name="plus.circle" 
                android_material_icon_name="add-circle" 
                size={20} 
                color={colors.phaseExploration} 
              />
              <Text style={styles.addVisualsText}>Visuals</Text>
            </TouchableOpacity>
            
            {buildArtifactIds.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.artifactStrip}>
                {getArtifactsByIds(buildArtifactIds).map((artifact, index) => (
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

          {/* 5. Check */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Check</Text>
            
            <View style={styles.listContainer}>
              {checkItems.map((item, index) => (
                <View key={item.id} style={styles.listItem}>
                  {editingCheckId === item.id ? (
                    <TextInput
                      style={styles.listItemInput}
                      value={item.text}
                      onChangeText={(text) => handleEditCheckItem(item.id, text)}
                      onBlur={() => setEditingCheckId(null)}
                      autoFocus
                    />
                  ) : (
                    <React.Fragment key={index}>
                      <Text style={styles.listItemText}>{item.text}</Text>
                      <View style={styles.listItemActions}>
                        <TouchableOpacity onPress={() => handleToggleCheckFavorite(item.id)}>
                          <IconSymbol 
                            ios_icon_name={item.isFavorite ? "star.fill" : "star"} 
                            android_material_icon_name={item.isFavorite ? "star" : "star-border"} 
                            size={20} 
                            color={item.isFavorite ? "#FFD700" : colors.textSecondary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditingCheckId(item.id)}>
                          <IconSymbol 
                            ios_icon_name="pencil" 
                            android_material_icon_name="edit" 
                            size={20} 
                            color={colors.textSecondary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteCheckItem(item.id)}>
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
              
              <View style={styles.addItemRow}>
                <TextInput
                  style={styles.addItemInput}
                  placeholder="Add check note..."
                  placeholderTextColor={colors.textSecondary}
                  value={newCheckText}
                  onChangeText={setNewCheckText}
                  onSubmitEditing={handleAddCheckItem}
                />
                <TouchableOpacity onPress={handleAddCheckItem}>
                  <IconSymbol 
                    ios_icon_name="plus.circle.fill" 
                    android_material_icon_name="add-circle" 
                    size={28} 
                    color={colors.phaseExploration} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 6. Adapt */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adapt</Text>
            
            <View style={styles.listContainer}>
              {adaptItems.map((item, index) => (
                <View key={item.id} style={styles.listItem}>
                  {editingAdaptId === item.id ? (
                    <TextInput
                      style={styles.listItemInput}
                      value={item.text}
                      onChangeText={(text) => handleEditAdaptItem(item.id, text)}
                      onBlur={() => setEditingAdaptId(null)}
                      autoFocus
                    />
                  ) : (
                    <React.Fragment key={index}>
                      <Text style={styles.listItemText}>{item.text}</Text>
                      <View style={styles.listItemActions}>
                        <TouchableOpacity onPress={() => handleToggleAdaptFavorite(item.id)}>
                          <IconSymbol 
                            ios_icon_name={item.isFavorite ? "star.fill" : "star"} 
                            android_material_icon_name={item.isFavorite ? "star" : "star-border"} 
                            size={20} 
                            color={item.isFavorite ? "#FFD700" : colors.textSecondary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditingAdaptId(item.id)}>
                          <IconSymbol 
                            ios_icon_name="pencil" 
                            android_material_icon_name="edit" 
                            size={20} 
                            color={colors.textSecondary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteAdaptItem(item.id)}>
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
              
              <View style={styles.addItemRow}>
                <TextInput
                  style={styles.addItemInput}
                  placeholder="Add adapt note..."
                  placeholderTextColor={colors.textSecondary}
                  value={newAdaptText}
                  onChangeText={setNewAdaptText}
                  onSubmitEditing={handleAddAdaptItem}
                />
                <TouchableOpacity onPress={handleAddAdaptItem}>
                  <IconSymbol 
                    ios_icon_name="plus.circle.fill" 
                    android_material_icon_name="add-circle" 
                    size={28} 
                    color={colors.phaseExploration} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 7. Exploration Decisions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exploration Decisions</Text>
            
            <TouchableOpacity 
              style={styles.addDecisionButton}
              onPress={() => setShowDecisionOverlay(true)}
            >
              <IconSymbol 
                ios_icon_name="plus.circle" 
                android_material_icon_name="add-circle" 
                size={20} 
                color={colors.phaseExploration} 
              />
              <Text style={styles.addDecisionText}>Add Decision</Text>
            </TouchableOpacity>
            
            {explorationDecisions.length > 0 && (
              <View style={styles.decisionsTimeline}>
                {explorationDecisions.map((decision, index) => (
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

          {/* 8. Next Exploration Questions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Exploration Questions</Text>
            
            <View style={styles.listContainer}>
              {nextExplorationQuestions.map((question, index) => (
                <View key={question.id} style={styles.listItem}>
                  {editingQuestionId === question.id ? (
                    <TextInput
                      style={styles.listItemInput}
                      value={question.text}
                      onChangeText={(text) => handleEditNextQuestion(question.id, text)}
                      onBlur={() => setEditingQuestionId(null)}
                      autoFocus
                    />
                  ) : (
                    <React.Fragment key={index}>
                      <Text style={styles.listItemText}>{question.text}</Text>
                      <View style={styles.listItemActions}>
                        <TouchableOpacity onPress={() => handleToggleNextQuestionFavorite(question.id)}>
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
                        <TouchableOpacity onPress={() => handleDeleteNextQuestion(question.id)}>
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
              
              <View style={styles.addItemRow}>
                <TextInput
                  style={styles.addItemInput}
                  placeholder="Add next exploration question..."
                  placeholderTextColor={colors.textSecondary}
                  value={newQuestionText}
                  onChangeText={setNewQuestionText}
                  onSubmitEditing={handleAddNextQuestion}
                />
                <TouchableOpacity onPress={handleAddNextQuestion}>
                  <IconSymbol 
                    ios_icon_name="plus.circle.fill" 
                    android_material_icon_name="add-circle" 
                    size={28} 
                    color={colors.phaseExploration} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 9. Time and Costs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time and Costs</Text>
            
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Hours Spent</Text>
              <TextInput
                style={styles.numberInput}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={timeSpent}
                onChangeText={(text) => {
                  setTimeSpent(text);
                  markAsChanged();
                }}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Costs</Text>
              <TextInput
                style={styles.numberInput}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={costs}
                onChangeText={(text) => {
                  setCosts(text);
                  markAsChanged();
                }}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* 10. Invoices and Receipts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invoices and Receipts</Text>
            
            <TouchableOpacity 
              style={styles.addVisualsButton}
              onPress={() => {
                setArtifactSection('invoices');
                setShowArtifactOverlay(true);
              }}
            >
              <IconSymbol 
                ios_icon_name="plus.circle" 
                android_material_icon_name="add-circle" 
                size={20} 
                color={colors.phaseExploration} 
              />
              <Text style={styles.addVisualsText}>Visuals</Text>
            </TouchableOpacity>
            
            {invoicesArtifactIds.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.artifactStrip}>
                {getArtifactsByIds(invoicesArtifactIds).map((artifact, index) => (
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
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Status Picker Modal */}
      <Modal
        visible={showStatusPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <TouchableOpacity 
          style={styles.overlayBackground}
          activeOpacity={1}
          onPress={() => setShowStatusPicker(false)}
        >
          <View style={styles.overlayContent}>
            <Text style={styles.overlayTitle}>Select Status</Text>
            
            <TouchableOpacity 
              style={styles.overlayOption}
              onPress={() => {
                setStatus('active');
                markAsChanged();
                setShowStatusPicker(false);
              }}
            >
              <Text style={styles.overlayOptionText}>Active</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.overlayOption}
              onPress={() => {
                setStatus('paused');
                markAsChanged();
                setShowStatusPicker(false);
              }}
            >
              <Text style={styles.overlayOptionText}>Paused</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.overlayOption}
              onPress={() => {
                setStatus('completed');
                markAsChanged();
                setShowStatusPicker(false);
              }}
            >
              <Text style={styles.overlayOptionText}>Completed</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.overlayCancelButton}
              onPress={() => setShowStatusPicker(false)}
            >
              <Text style={styles.overlayCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
        <KeyboardAvoidingView 
          style={styles.overlayBackground}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity 
            style={{ flex: 1 }}
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceExploration,
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.phaseExploration,
    marginBottom: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  statusButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.divider,
    minHeight: 80,
    textAlignVertical: 'top',
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
    color: colors.phaseExploration,
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
    color: colors.phaseExploration,
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
    backgroundColor: colors.phaseExploration,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  numberInput: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
    minWidth: 80,
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
    backgroundColor: colors.phaseExploration,
  },
  decisionSaveText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
