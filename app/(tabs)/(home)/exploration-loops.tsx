
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
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
} from '@/utils/storage';

export default function ExplorationLoopsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loops, setLoops] = useState<ExplorationLoop[]>([]);

  const loadProject = useCallback(async () => {
    console.log('ExplorationLoopsScreen: Loading project', projectId);
    const projects = await getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
      setLoops(found.explorationLoops || []);
      console.log('ExplorationLoopsScreen: Loaded project with', (found.explorationLoops || []).length, 'loops');
    } else {
      Alert.alert('Project Not Found', 'This project no longer exists.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [projectId, router]);

  useFocusEffect(
    useCallback(() => {
      loadProject();
    }, [loadProject])
  );

  const handleCreateLoop = () => {
    console.log('ExplorationLoopsScreen: User tapped New Exploration button');
    router.push(`/exploration-loop?projectId=${projectId}`);
  };

  const handleOpenLoop = (loopId: string) => {
    console.log('ExplorationLoopsScreen: User tapped loop', loopId);
    router.push(`/exploration-loop?projectId=${projectId}&loopId=${loopId}`);
  };

  const handleDeleteLoop = async (loopId: string) => {
    if (!project) return;
    
    Alert.alert(
      'Delete Exploration Loop',
      'Are you sure you want to delete this exploration loop?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('ExplorationLoopsScreen: Deleting loop', loopId);
            const updatedLoops = loops.filter(loop => loop.id !== loopId);
            
            const updatedProject = {
              ...project,
              explorationLoops: updatedLoops,
              updatedDate: new Date().toISOString(),
            };
            
            await updateProject(updatedProject);
            setProject(updatedProject);
            setLoops(updatedLoops);
          }
        }
      ]
    );
  };

  const getStatusColor = (status: ExplorationLoop['status']): string => {
    switch (status) {
      case 'draft':
        return colors.textSecondary;
      case 'active':
        return colors.phaseExploration;
      case 'paused':
        return colors.textSecondary;
      case 'completed':
        return colors.phaseFraming;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: ExplorationLoop['status']): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderLoopCard = (loop: ExplorationLoop) => {
    const loopArtifacts = project?.artifacts.filter(a => loop.artifactIds.includes(a.id)) || [];
    
    return (
      <TouchableOpacity
        key={loop.id}
        style={styles.loopCard}
        onPress={() => handleOpenLoop(loop.id)}
      >
        <View style={styles.loopHeader}>
          <Text style={styles.loopQuestion}>{loop.question || 'Untitled Exploration'}</Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteLoop(loop.id);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol 
              ios_icon_name="trash" 
              android_material_icon_name="delete" 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.loopMeta}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loop.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(loop.status)}</Text>
          </View>
          <Text style={styles.loopDate}>
            Updated {new Date(loop.updatedDate).toLocaleDateString()}
          </Text>
        </View>
        
        {loopArtifacts.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.artifactStrip}
          >
            {loopArtifacts.map((artifact) => (
              <View key={artifact.id} style={styles.artifactThumb}>
                {artifact.type === 'image' ? (
                  <Image source={{ uri: artifact.uri }} style={styles.artifactImage} />
                ) : (
                  <View style={styles.artifactDoc}>
                    <IconSymbol 
                      ios_icon_name="doc" 
                      android_material_icon_name="description" 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </TouchableOpacity>
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

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {loops.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No exploration loops yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start a loop to explore an open question.
              </Text>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleCreateLoop}
              >
                <IconSymbol 
                  ios_icon_name="plus.circle.fill" 
                  android_material_icon_name="add-circle" 
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.primaryButtonText}>New Exploration</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <React.Fragment>
              {loops.map(loop => renderLoopCard(loop))}
            </React.Fragment>
          )}
        </ScrollView>
        
        {loops.length > 0 && (
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity 
              style={styles.floatingButton}
              onPress={handleCreateLoop}
            >
              <IconSymbol 
                ios_icon_name="plus" 
                android_material_icon_name="add" 
                size={24} 
                color="#FFFFFF" 
              />
              <Text style={styles.floatingButtonText}>New Exploration</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.phaseExploration,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loopCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  loopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loopQuestion: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginRight: 12,
  },
  loopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  loopDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  artifactStrip: {
    flexDirection: 'row',
    marginTop: 8,
  },
  artifactThumb: {
    width: 60,
    height: 60,
    backgroundColor: colors.divider,
    marginRight: 8,
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
    backgroundColor: colors.background,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.phaseExploration,
    paddingVertical: 16,
    gap: 8,
  },
  floatingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
</write file>

<write file="utils/storage.ts">
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProjectPhase = 'Framing' | 'Exploration' | 'Pilot' | 'Delivery' | 'Finish';

export interface Artifact {
  id: string;
  type: 'image' | 'document' | 'url';
  uri: string;
  name?: string;
  caption?: string;
  isFavorite?: boolean;
}

export interface Decision {
  id: string;
  summary: string;
  rationale: string;
  artifacts: string[];
  phase?: ProjectPhase;
  timestamp: string;
}

export interface CertaintyItem {
  id: string;
  text: string;
  category: 'known' | 'assumed' | 'unknown';
}

export interface DesignSpaceItem {
  id: string;
  text: string;
}

export interface ExplorationQuestion {
  id: string;
  text: string;
  isFavorite: boolean;
}

export interface FramingDecision {
  id: string;
  summary: string;
  artifacts: string[];
  timestamp: string;
}

export interface ExploreItem {
  id: string;
  text: string;
  isFavorite: boolean;
}

export interface BuildItem {
  id: string;
  text: string;
  isFavorite: boolean;
}

export interface CheckItem {
  id: string;
  text: string;
  isFavorite: boolean;
}

export interface AdaptItem {
  id: string;
  text: string;
  isFavorite: boolean;
}

export interface ExplorationDecision {
  id: string;
  summary: string;
  timestamp: string;
}

export interface ExplorationLoop {
  id: string;
  question: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  updatedDate: string;
  artifactIds: string[];
  
  // Explore section
  exploreItems: ExploreItem[];
  exploreArtifactIds: string[];
  
  // Build section
  buildItems: BuildItem[];
  buildArtifactIds: string[];
  
  // Check section
  checkItems: CheckItem[];
  
  // Adapt section
  adaptItems: AdaptItem[];
  
  // Exploration decisions
  explorationDecisions: ExplorationDecision[];
  
  // Next exploration questions
  nextExplorationQuestions: ExplorationQuestion[];
  
  // Time and costs
  timeSpent: number;
  costs: number;
  
  // Invoices and receipts
  invoicesArtifactIds: string[];
}

export interface Project {
  id: string;
  title: string;
  phase: ProjectPhase;
  costs: number;
  hours: number;
  updatedDate: string;
  startDate: string;
  artifacts: Artifact[];
  decisions?: Decision[];
  
  // Framing fields
  opportunityOrigin?: string;
  purpose?: string;
  certaintyItems?: CertaintyItem[];
  designSpaceItems?: DesignSpaceItem[];
  explorationQuestions?: ExplorationQuestion[];
  framingDecisions?: FramingDecision[];
  
  // Exploration Loops
  explorationLoops?: ExplorationLoop[];
}

const PROJECTS_KEY = '@design_in_motion_projects';

export const getProjects = async (): Promise<Project[]> => {
  try {
    const data = await AsyncStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
};

export const saveProject = async (project: Project): Promise<void> => {
  try {
    const projects = await getProjects();
    projects.push(project);
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};

export const updateProject = async (updatedProject: Project): Promise<void> => {
  try {
    const projects = await getProjects();
    const index = projects.findIndex(p => p.id === updatedProject.id);
    if (index !== -1) {
      projects[index] = updatedProject;
      await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const projects = await getProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};
</write file>

Now let me update the Framing screen to make the favorite icon selectable and create Draft Exploration Loops when questions are favorited:

<write file="app/(tabs)/(home)/framing.tsx">
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
  
  // Framing fields
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
  
  const hasUnsavedChanges = useRef(false);

  const loadProject = useCallback(async () => {
    console.log('FramingScreen: Loading project', projectId);
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
    hasUnsavedChanges.current = false;
  }, [project, opportunityOrigin, purpose, certaintyItems, designSpaceItems, explorationQuestions, framingDecisions]);

  useFocusEffect(
    useCallback(() => {
      loadProject();
      return () => {
        if (hasUnsavedChanges.current) {
          saveChanges();
        }
      };
    }, [loadProject, saveChanges])
  );

  const markAsChanged = () => {
    hasUnsavedChanges.current = true;
  };

  // Artifact management - UPDATED to support multiple photo selection
  const handleAddArtifact = async (type: 'camera' | 'photo' | 'document' | 'url') => {
    if (!project) return;
    
    console.log('FramingScreen: User adding artifact type:', type);
    
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
        // UPDATED: Enable multiple selection
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsMultipleSelection: true, // Enable multiple selection
        });
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
      }
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // UPDATED: Process all selected assets
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
        
        console.log('FramingScreen: Added', newArtifacts.length, 'artifacts');
        
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
            console.log('FramingScreen: Deleting artifact', artifactId);
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
        // For web URLs, use Linking.openURL to open in browser
        const canOpen = await Linking.canOpenURL(artifact.uri);
        if (canOpen) {
          await Linking.openURL(artifact.uri);
        } else {
          Alert.alert('Error', 'Cannot open this URL');
        }
      } else if (artifact.type === 'document') {
        // For local documents, use Sharing to open with system apps
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
      console.error('Error opening artifact:', error);
      Alert.alert('Error', 'Could not open this file');
    }
  };

  // Certainty items
  const handleAddCertaintyItem = () => {
    if (!newCertaintyText.trim()) return;
    
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
    setCertaintyItems(certaintyItems.filter(item => item.id !== id));
    markAsChanged();
  };

  const handleEditCertaintyItem = (id: string, newText: string) => {
    setCertaintyItems(certaintyItems.map(item => 
      item.id === id ? { ...item, text: newText } : item
    ));
    setEditingCertaintyId(null);
    markAsChanged();
  };

  // Design space items
  const handleAddDesignSpaceItem = () => {
    if (!newDesignSpaceText.trim()) return;
    
    const newItem: DesignSpaceItem = {
      id: Date.now().toString(),
      text: newDesignSpaceText.trim(),
    };
    
    setDesignSpaceItems([...designSpaceItems, newItem]);
    setNewDesignSpaceText('');
    markAsChanged();
  };

  const handleDeleteDesignSpaceItem = (id: string) => {
    setDesignSpaceItems(designSpaceItems.filter(item => item.id !== id));
    markAsChanged();
  };

  const handleEditDesignSpaceItem = (id: string, newText: string) => {
    setDesignSpaceItems(designSpaceItems.map(item => 
      item.id === id ? { ...item, text: newText } : item
    ));
    setEditingDesignSpaceId(null);
    markAsChanged();
  };

  // Exploration questions
  const handleAddExplorationQuestion = () => {
    if (!newQuestionText.trim()) return;
    
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
    setExplorationQuestions(explorationQuestions.filter(q => q.id !== id));
    markAsChanged();
  };

  const handleEditExplorationQuestion = (id: string, newText: string) => {
    setExplorationQuestions(explorationQuestions.map(q => 
      q.id === id ? { ...q, text: newText } : q
    ));
    setEditingQuestionId(null);
    markAsChanged();
  };

  const handleToggleQuestionFavorite = async (id: string) => {
    if (!project) return;
    
    const question = explorationQuestions.find(q => q.id === id);
    if (!question) return;
    
    const newFavoriteStatus = !question.isFavorite;
    
    console.log('FramingScreen: User toggled favorite on question', id, 'to', newFavoriteStatus);
    
    // Update the question's favorite status
    const updatedQuestions = explorationQuestions.map(q => 
      q.id === id ? { ...q, isFavorite: newFavoriteStatus } : q
    );
    setExplorationQuestions(updatedQuestions);
    
    // If favorited, create a Draft Exploration Loop
    if (newFavoriteStatus) {
      console.log('FramingScreen: Creating Draft Exploration Loop for question:', question.text);
      
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
      
      const updatedLoops = [...(project.explorationLoops || []), newLoop];
      
      const updatedProject: Project = {
        ...project,
        explorationQuestions: updatedQuestions,
        explorationLoops: updatedLoops,
        updatedDate: new Date().toISOString(),
      };
      
      await updateProject(updatedProject);
      setProject(updatedProject);
      hasUnsavedChanges.current = false;
      
      Alert.alert(
        'Exploration Loop Created',
        'A draft exploration loop has been created for this question. You can find it in the Exploration Loops screen.',
        [{ text: 'OK' }]
      );
    } else {
      // If unfavorited, just save the updated questions
      const updatedProject: Project = {
        ...project,
        explorationQuestions: updatedQuestions,
        updatedDate: new Date().toISOString(),
      };
      
      await updateProject(updatedProject);
      setProject(updatedProject);
      hasUnsavedChanges.current = false;
    }
  };

  // Framing decisions - UPDATED to match Project Overview approach
  const handleSaveDecision = async () => {
    if (!decisionSummary.trim()) {
      Alert.alert('Required', 'Please enter a decision summary.');
      return;
    }
    
    if (!project) return;
    
    let updatedDecisions: FramingDecision[];
    
    if (editingDecisionId) {
      // Edit existing decision
      updatedDecisions = framingDecisions.map(d => 
        d.id === editingDecisionId 
          ? { ...d, summary: decisionSummary.trim(), rationale: decisionRationale.trim() } as any
          : d
      );
    } else {
      // Add new decision
      const newDecision: any = {
        id: Date.now().toString(),
        summary: decisionSummary.trim(),
        rationale: decisionRationale.trim(),
        artifacts: [],
        timestamp: new Date().toISOString(),
      };
      updatedDecisions = [...framingDecisions, newDecision];
    }
    
    // Update state immediately
    setFramingDecisions(updatedDecisions);
    
    // Save to storage immediately
    const updatedProject: Project = {
      ...project,
      framingDecisions: updatedDecisions,
      updatedDate: new Date().toISOString(),
    };
    
    await updateProject(updatedProject);
    setProject(updatedProject);
    
    // Clear form
    setDecisionSummary('');
    setDecisionRationale('');
    setEditingDecisionId(null);
    setShowDecisionOverlay(false);
    hasUnsavedChanges.current = false;
  };

  const handleEditDecision = (decision: any) => {
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
              onChangeText={(text) => {
                setOpportunityOrigin(text);
                markAsChanged();
              }}
              multiline
              numberOfLines={4}
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
              onChangeText={(text) => {
                setPurpose(text);
                markAsChanged();
              }}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* 3. Artifacts (Visuals) - UPDATED to 4 columns grid */}
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
                      
                      {/* Favorite and Delete icons in right upper corner */}
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
                      onBlur={() => setEditingCertaintyId(null)}
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
            <Text style={styles.helperText}>What limits or bounderies must be respected? (e.g. time, budget, technology, ethics)</Text>
            
            <View style={styles.listContainer}>
              {designSpaceItems.map((item) => (
                <View key={item.id} style={styles.listItem}>
                  {editingDesignSpaceId === item.id ? (
                    <TextInput
                      style={styles.listItemInput}
                      value={item.text}
                      onChangeText={(text) => handleEditDesignSpaceItem(item.id, text)}
                      onBlur={() => setEditingDesignSpaceId(null)}
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

          {/* 6. Exploration Questions - UPDATED: Favorite icon is now selectable */}
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
                      onBlur={() => setEditingQuestionId(null)}
                      autoFocus
                    />
                  ) : (
                    <>
                      <Text style={styles.listItemText}>{question.text}</Text>
                      <View style={styles.listItemActions}>
                        <TouchableOpacity 
                          onPress={() => handleToggleQuestionFavorite(question.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
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

          {/* 7. Framing Decisions & Changes - UPDATED to match Project Overview */}
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
            <Text style={styles.helperText}>Note important changes and decisions</Text>
            
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

      {/* Artifact Viewer - UPDATED: Removed favorite/delete actions (available on thumbnails) */}
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

      {/* Add/Edit Decision Overlay - UPDATED to match Project Overview */}
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
  artifactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  artifactGridItem: {
    width: '23%', // UPDATED: 4 columns (4 * 23% + 3 * 8px gap = ~100%)
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
</write file>

Now I need to update the exploration-loop.tsx file to support the "draft" status in the status picker:Now I need to update the exploration-loop.tsx file to add "Draft" as the first status option:

<write file="app/(tabs)/(home)/exploration-loop.tsx">
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
  const [status, setStatus] = useState<'draft' | 'active' | 'paused' | 'completed'>('draft');
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
    console.log('ExplorationLoopScreen: Loading project', projectId, 'loop', loopId);
    const projects = await getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
      
      if (loopId) {
        const foundLoop = found.explorationLoops?.find(l => l.id === loopId);
        if (foundLoop) {
          console.log('ExplorationLoopScreen: Loaded loop with status', foundLoop.status);
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
    
    console.log('ExplorationLoopScreen: Saving changes with status', status);
    
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
    
    console.log('ExplorationLoopScreen: User adding artifact type:', type);
    
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
            console.log('ExplorationLoopScreen: Deleting artifact', artifactId);
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

      {/* Status Picker Modal - UPDATED: Added "Draft" as first option */}
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
                console.log('ExplorationLoopScreen: User selected Draft status');
                setStatus('draft');
                markAsChanged();
                setShowStatusPicker(false);
              }}
            >
              <Text style={styles.overlayOptionText}>Draft</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.overlayOption}
              onPress={() => {
                console.log('ExplorationLoopScreen: User selected Active status');
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
                console.log('ExplorationLoopScreen: User selected Paused status');
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
                console.log('ExplorationLoopScreen: User selected Completed status');
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
