
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
import * as Sharing from 'expo-sharing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMBNAIL_GAP = 12;
const THUMBNAILS_PER_ROW = 4;
const THUMBNAIL_SIZE = (SCREEN_WIDTH - 32 - (THUMBNAIL_GAP * (THUMBNAILS_PER_ROW - 1))) / THUMBNAILS_PER_ROW;

interface TimeEntry {
  id: string;
  reason: string;
  hours: number;
}

interface CostEntry {
  id: string;
  reason: string;
  amount: number;
}

export default function ExplorationLoopScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;
  const loopId = params.loopId as string | undefined;
  const isNewLoop = !loopId;

  // SIMPLIFIED: Single source of truth for project data
  const [project, setProject] = useState<Project | null>(null);
  const [loop, setLoop] = useState<ExplorationLoop | null>(null);
  
  // UI state
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showArtifactOverlay, setShowArtifactOverlay] = useState(false);
  const [artifactSection, setArtifactSection] = useState<'explore' | 'build' | 'check' | 'adapt'>('explore');
  const [showArtifactViewer, setShowArtifactViewer] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [showDecisionOverlay, setShowDecisionOverlay] = useState(false);
  const [showTimeEntryOverlay, setShowTimeEntryOverlay] = useState(false);
  const [showCostEntryOverlay, setShowCostEntryOverlay] = useState(false);
  
  // Edit states
  const [editingExploreId, setEditingExploreId] = useState<string | null>(null);
  const [editingBuildId, setEditingBuildId] = useState<string | null>(null);
  const [editingCheckId, setEditingCheckId] = useState<string | null>(null);
  const [editingAdaptId, setEditingAdaptId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  // Refs for input values (prevents re-renders)
  const questionRef = useRef('');
  const newExploreTextRef = useRef('');
  const newBuildTextRef = useRef('');
  const newCheckTextRef = useRef('');
  const newAdaptTextRef = useRef('');
  const newQuestionTextRef = useRef('');
  
  // Keys to force input re-render after adding items
  const [exploreInputKey, setExploreInputKey] = useState(0);
  const [buildInputKey, setBuildInputKey] = useState(0);
  const [checkInputKey, setCheckInputKey] = useState(0);
  const [adaptInputKey, setAdaptInputKey] = useState(0);
  const [questionInputKey, setQuestionInputKey] = useState(0);
  
  // Decision overlay
  const [decisionSummary, setDecisionSummary] = useState('');
  
  // Time/Cost entry overlays
  const [timeEntryReason, setTimeEntryReason] = useState('');
  const [timeEntryHours, setTimeEntryHours] = useState('');
  const [costEntryReason, setCostEntryReason] = useState('');
  const [costEntryAmount, setCostEntryAmount] = useState('');

  const loadProject = useCallback(async () => {
    console.log('Exploration Loop: Loading project', projectId, loopId);
    const projects = await getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
      
      if (loopId) {
        const foundLoop = found.explorationLoops?.find(l => l.id === loopId);
        if (foundLoop) {
          console.log('Exploration Loop: Found loop', foundLoop.id, 'Status:', foundLoop.status);
          setLoop(foundLoop);
          questionRef.current = foundLoop.question;
        } else {
          Alert.alert('Loop Not Found', 'This exploration loop no longer exists.', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }
      } else {
        console.log('Exploration Loop: Creating new loop');
        // Initialize new loop
        const newLoop: ExplorationLoop = {
          id: Date.now().toString(),
          question: '',
          status: 'draft',
          updatedDate: new Date().toISOString(),
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
          nextExplorationQuestions: [],
          timeSpent: 0,
          costs: 0,
          invoicesArtifactIds: [],
        };
        setLoop(newLoop);
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
    }, [loadProject])
  );

  // FIXED: Use same pattern as Framing screen - single atomic update
  const updateAndSaveLoop = useCallback(async (updates: Partial<ExplorationLoop>) => {
    if (!project || !loop) return;
    
    console.log('Exploration Loop: Updating loop with', Object.keys(updates));
    
    const updatedLoop: ExplorationLoop = {
      ...loop,
      ...updates,
      updatedDate: new Date().toISOString(),
    };
    
    // Update loops array in project
    let updatedLoops = project.explorationLoops || [];
    if (isNewLoop) {
      updatedLoops = [...updatedLoops, updatedLoop];
      console.log('Exploration Loop: Adding new loop to project');
    } else {
      updatedLoops = updatedLoops.map(l => l.id === loop.id ? updatedLoop : l);
      console.log('Exploration Loop: Updating existing loop in project');
    }
    
    const updatedProject: Project = {
      ...project,
      explorationLoops: updatedLoops,
      updatedDate: new Date().toISOString(),
    };
    
    // Update both state and AsyncStorage atomically
    await updateProject(updatedProject);
    setProject(updatedProject);
    setLoop(updatedLoop);
  }, [project, loop, isNewLoop]);

  // Save text field immediately
  const saveTextField = useCallback(async (field: 'question', value: string) => {
    if (!loop) return;
    console.log('Exploration Loop: Saving question field');
    await updateAndSaveLoop({ [field]: value });
  }, [loop, updateAndSaveLoop]);

  // Artifact management - FIXED: Match Framing screen approach
  const handleAddArtifact = async (type: 'camera' | 'photo' | 'document' | 'url') => {
    if (!project || !loop) return;
    
    try {
      if (type === 'url') {
        Alert.prompt(
          'Add URL',
          'Enter the URL of the artifact',
          async (url) => {
            if (url && url.trim()) {
              console.log('Exploration Loop: Adding URL artifact to', artifactSection);
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
              const sectionField = `${artifactSection}ArtifactIds` as keyof ExplorationLoop;
              const currentIds = (loop[sectionField] as string[]) || [];
              await updateAndSaveLoop({ [sectionField]: [...currentIds, newArtifact.id] });
              
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
          type: 'application/pdf',
          copyToCacheDirectory: true,
        });
      }
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Exploration Loop: Adding', result.assets.length, 'artifacts to', artifactSection);
        const newArtifacts: Artifact[] = result.assets.map((asset: any, index: number) => ({
          id: `${Date.now()}_${index}`,
          type: type === 'document' ? 'document' : 'image',
          uri: asset.uri,
          name: asset.name || 'Untitled',
        }));
        
        const updatedArtifacts = [...project.artifacts, ...newArtifacts];
        const updatedProject = {
          ...project,
          artifacts: updatedArtifacts,
          updatedDate: new Date().toISOString(),
        };
        
        await updateProject(updatedProject);
        setProject(updatedProject);
        
        // Add to appropriate section
        const sectionField = `${artifactSection}ArtifactIds` as keyof ExplorationLoop;
        const currentIds = (loop[sectionField] as string[]) || [];
        const newIds = newArtifacts.map(a => a.id);
        await updateAndSaveLoop({ [sectionField]: [...currentIds, ...newIds] });
        
        setShowArtifactOverlay(false);
      }
    } catch (error) {
      console.error('Exploration Loop: Error adding artifact:', error);
      Alert.alert('Error', 'Failed to add artifact.');
    }
  };

  const handleDeleteArtifact = async (artifactId: string) => {
    if (!project || !loop) return;
    
    Alert.alert(
      'Delete Artifact',
      'Are you sure you want to delete this artifact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('Exploration Loop: Deleting artifact', artifactId);
            const updatedArtifacts = project.artifacts.filter(a => a.id !== artifactId);
            const updatedProject = {
              ...project,
              artifacts: updatedArtifacts,
              updatedDate: new Date().toISOString(),
            };
            
            await updateProject(updatedProject);
            setProject(updatedProject);
            
            // Remove from all section lists
            await updateAndSaveLoop({
              exploreArtifactIds: loop.exploreArtifactIds.filter(id => id !== artifactId),
              buildArtifactIds: loop.buildArtifactIds.filter(id => id !== artifactId),
              checkArtifactIds: loop.checkArtifactIds.filter(id => id !== artifactId),
              adaptArtifactIds: loop.adaptArtifactIds.filter(id => id !== artifactId),
            });
            
            setShowArtifactViewer(false);
          }
        }
      ]
    );
  };

  const handleToggleArtifactFavorite = async (artifactId: string) => {
    if (!project) return;
    
    console.log('Exploration Loop: Toggling artifact favorite', artifactId);
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
    
    if (selectedArtifact?.id === artifactId) {
      setSelectedArtifact(updatedArtifacts.find(a => a.id === artifactId) || null);
    }
  };

  const handleOpenArtifact = async (artifact: Artifact) => {
    console.log('Exploration Loop: Opening artifact', artifact.type);
    
    try {
      if (artifact.type === 'url') {
        let url = artifact.uri.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot open this URL.');
        }
      } else if (artifact.type === 'document') {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(artifact.uri);
        } else {
          Alert.alert('Not Available', 'Sharing is not available on this device.');
        }
      }
    } catch (error) {
      console.error('Exploration Loop: Error opening artifact:', error);
      Alert.alert('Error', 'Failed to open artifact.');
    }
  };

  // Explore items
  const handleAddExploreItem = async () => {
    if (!loop || !newExploreTextRef.current.trim()) return;
    
    console.log('Exploration Loop: Adding explore item');
    const newItem: ExploreItem = {
      id: Date.now().toString(),
      text: newExploreTextRef.current.trim(),
      isFavorite: false,
    };
    
    await updateAndSaveLoop({ exploreItems: [...loop.exploreItems, newItem] });
    newExploreTextRef.current = '';
    setExploreInputKey(prev => prev + 1);
  };

  const handleDeleteExploreItem = async (id: string) => {
    if (!loop) return;
    console.log('Exploration Loop: Deleting explore item', id);
    await updateAndSaveLoop({ exploreItems: loop.exploreItems.filter(item => item.id !== id) });
  };

  const handleEditExploreItem = async (id: string, newText: string) => {
    if (!loop || !newText.trim()) return;
    console.log('Exploration Loop: Editing explore item', id);
    await updateAndSaveLoop({ 
      exploreItems: loop.exploreItems.map(item => 
        item.id === id ? { ...item, text: newText.trim() } : item
      )
    });
    setEditingExploreId(null);
  };

  const handleToggleExploreFavorite = async (id: string) => {
    if (!loop) return;
    console.log('Exploration Loop: Toggling explore favorite', id);
    await updateAndSaveLoop({ 
      exploreItems: loop.exploreItems.map(item => 
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    });
  };

  // Build items
  const handleAddBuildItem = async () => {
    if (!loop || !newBuildTextRef.current.trim()) return;
    
    console.log('Exploration Loop: Adding build item');
    const newItem: BuildItem = {
      id: Date.now().toString(),
      text: newBuildTextRef.current.trim(),
      isFavorite: false,
    };
    
    await updateAndSaveLoop({ buildItems: [...loop.buildItems, newItem] });
    newBuildTextRef.current = '';
    setBuildInputKey(prev => prev + 1);
  };

  const handleDeleteBuildItem = async (id: string) => {
    if (!loop) return;
    console.log('Exploration Loop: Deleting build item', id);
    await updateAndSaveLoop({ buildItems: loop.buildItems.filter(item => item.id !== id) });
  };

  const handleEditBuildItem = async (id: string, newText: string) => {
    if (!loop || !newText.trim()) return;
    console.log('Exploration Loop: Editing build item', id);
    await updateAndSaveLoop({ 
      buildItems: loop.buildItems.map(item => 
        item.id === id ? { ...item, text: newText.trim() } : item
      )
    });
    setEditingBuildId(null);
  };

  const handleToggleBuildFavorite = async (id: string) => {
    if (!loop) return;
    console.log('Exploration Loop: Toggling build favorite', id);
    await updateAndSaveLoop({ 
      buildItems: loop.buildItems.map(item => 
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    });
  };

  // Check items
  const handleAddCheckItem = async () => {
    if (!loop || !newCheckTextRef.current.trim()) return;
    
    console.log('Exploration Loop: Adding check item');
    const newItem: CheckItem = {
      id: Date.now().toString(),
      text: newCheckTextRef.current.trim(),
      isFavorite: false,
    };
    
    await updateAndSaveLoop({ checkItems: [...loop.checkItems, newItem] });
    newCheckTextRef.current = '';
    setCheckInputKey(prev => prev + 1);
  };

  const handleDeleteCheckItem = async (id: string) => {
    if (!loop) return;
    console.log('Exploration Loop: Deleting check item', id);
    await updateAndSaveLoop({ checkItems: loop.checkItems.filter(item => item.id !== id) });
  };

  const handleEditCheckItem = async (id: string, newText: string) => {
    if (!loop || !newText.trim()) return;
    console.log('Exploration Loop: Editing check item', id);
    await updateAndSaveLoop({ 
      checkItems: loop.checkItems.map(item => 
        item.id === id ? { ...item, text: newText.trim() } : item
      )
    });
    setEditingCheckId(null);
  };

  const handleToggleCheckFavorite = async (id: string) => {
    if (!loop) return;
    console.log('Exploration Loop: Toggling check favorite', id);
    await updateAndSaveLoop({ 
      checkItems: loop.checkItems.map(item => 
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    });
  };

  // Adapt items
  const handleAddAdaptItem = async () => {
    if (!loop || !newAdaptTextRef.current.trim()) return;
    
    console.log('Exploration Loop: Adding adapt item');
    const newItem: AdaptItem = {
      id: Date.now().toString(),
      text: newAdaptTextRef.current.trim(),
      isFavorite: false,
    };
    
    await updateAndSaveLoop({ adaptItems: [...loop.adaptItems, newItem] });
    newAdaptTextRef.current = '';
    setAdaptInputKey(prev => prev + 1);
  };

  const handleDeleteAdaptItem = async (id: string) => {
    if (!loop) return;
    console.log('Exploration Loop: Deleting adapt item', id);
    await updateAndSaveLoop({ adaptItems: loop.adaptItems.filter(item => item.id !== id) });
  };

  const handleEditAdaptItem = async (id: string, newText: string) => {
    if (!loop || !newText.trim()) return;
    console.log('Exploration Loop: Editing adapt item', id);
    await updateAndSaveLoop({ 
      adaptItems: loop.adaptItems.map(item => 
        item.id === id ? { ...item, text: newText.trim() } : item
      )
    });
    setEditingAdaptId(null);
  };

  const handleToggleAdaptFavorite = async (id: string) => {
    if (!loop) return;
    console.log('Exploration Loop: Toggling adapt favorite', id);
    await updateAndSaveLoop({ 
      adaptItems: loop.adaptItems.map(item => 
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    });
  };

  // Next exploration questions
  const handleAddNextQuestion = async () => {
    if (!loop || !newQuestionTextRef.current.trim()) return;
    
    console.log('Exploration Loop: Adding next exploration question');
    const newQuestion: ExplorationQuestion = {
      id: Date.now().toString(),
      text: newQuestionTextRef.current.trim(),
      isFavorite: false,
    };
    
    await updateAndSaveLoop({ nextExplorationQuestions: [...loop.nextExplorationQuestions, newQuestion] });
    newQuestionTextRef.current = '';
    setQuestionInputKey(prev => prev + 1);
  };

  const handleDeleteNextQuestion = async (id: string) => {
    if (!loop) return;
    console.log('Exploration Loop: Deleting next exploration question', id);
    await updateAndSaveLoop({ 
      nextExplorationQuestions: loop.nextExplorationQuestions.filter(q => q.id !== id) 
    });
  };

  const handleEditNextQuestion = async (id: string, newText: string) => {
    if (!loop || !newText.trim()) return;
    console.log('Exploration Loop: Editing next exploration question', id);
    await updateAndSaveLoop({ 
      nextExplorationQuestions: loop.nextExplorationQuestions.map(q => 
        q.id === id ? { ...q, text: newText.trim() } : q
      )
    });
    setEditingQuestionId(null);
  };

  // FIXED: Match Framing screen pattern - single atomic operation
  const handleToggleNextQuestionFavorite = async (id: string) => {
    if (!project || !loop) return;
    
    const question = loop.nextExplorationQuestions.find(q => q.id === id);
    if (!question) return;
    
    console.log('Exploration Loop: Toggling next question favorite', id, 'Current:', question.isFavorite);
    
    // If marking as favorite, create a new Draft Exploration Loop
    if (!question.isFavorite) {
      console.log('Exploration Loop: Creating new loop from favorited question');
      
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
        checkArtifactIds: [],
        adaptItems: [],
        adaptArtifactIds: [],
        explorationDecisions: [],
        nextExplorationQuestions: [],
        timeSpent: 0,
        costs: 0,
        invoicesArtifactIds: [],
      };
      
      // Update question favorite status in current loop
      const updatedQuestions = loop.nextExplorationQuestions.map(q => 
        q.id === id ? { ...q, isFavorite: true } : q
      );
      
      // Update current loop with new question favorite status
      const updatedCurrentLoop: ExplorationLoop = {
        ...loop,
        nextExplorationQuestions: updatedQuestions,
        updatedDate: new Date().toISOString(),
      };
      
      // Build updated loops array - update current loop AND add new loop
      let updatedLoops = project.explorationLoops || [];
      
      // Update current loop
      updatedLoops = updatedLoops.map(l => 
        l.id === loop.id ? updatedCurrentLoop : l
      );
      
      // Add new loop
      updatedLoops = [...updatedLoops, newLoop];
      
      // Single atomic update to project
      const updatedProject: Project = {
        ...project,
        explorationLoops: updatedLoops,
        updatedDate: new Date().toISOString(),
      };
      
      console.log('Exploration Loop: Saving project with', updatedLoops.length, 'loops');
      
      // FIXED: Save to AsyncStorage first, then update state
      await updateProject(updatedProject);
      setProject(updatedProject);
      setLoop(updatedCurrentLoop);
      
      Alert.alert(
        'Loop Created',
        'A new exploration loop has been created in Draft status.',
        [{ text: 'OK' }]
      );
    } else {
      // Just toggle favorite off
      await updateAndSaveLoop({ 
        nextExplorationQuestions: loop.nextExplorationQuestions.map(q => 
          q.id === id ? { ...q, isFavorite: false } : q
        )
      });
    }
  };

  // Exploration decisions
  const handleSaveDecision = async () => {
    if (!loop || !decisionSummary.trim()) {
      Alert.alert('Required', 'Please enter a decision summary.');
      return;
    }
    
    console.log('Exploration Loop: Saving decision');
    const newDecision: ExplorationDecision = {
      id: Date.now().toString(),
      summary: decisionSummary.trim(),
      timestamp: new Date().toISOString(),
    };
    
    await updateAndSaveLoop({ explorationDecisions: [...loop.explorationDecisions, newDecision] });
    setDecisionSummary('');
    setShowDecisionOverlay(false);
  };

  // Time and cost tracking
  const handleAddTimeEntry = async () => {
    if (!loop || !timeEntryReason.trim() || !timeEntryHours.trim()) {
      Alert.alert('Required', 'Please enter both reason and hours.');
      return;
    }
    
    const hours = parseFloat(timeEntryHours);
    if (isNaN(hours) || hours <= 0) {
      Alert.alert('Invalid', 'Please enter a valid number of hours.');
      return;
    }
    
    console.log('Exploration Loop: Adding time entry');
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      reason: timeEntryReason.trim(),
      hours,
    };
    
    const currentEntries = (loop as any).timeEntries || [];
    const updatedEntries = [...currentEntries, newEntry];
    const totalHours = updatedEntries.reduce((sum, e) => sum + e.hours, 0);
    
    await updateAndSaveLoop({ 
      timeSpent: totalHours,
      ...(updatedEntries.length > 0 && { timeEntries: updatedEntries } as any)
    });
    
    setTimeEntryReason('');
    setTimeEntryHours('');
    setShowTimeEntryOverlay(false);
  };

  const handleDeleteTimeEntry = async (id: string) => {
    if (!loop) return;
    console.log('Exploration Loop: Deleting time entry', id);
    
    const currentEntries = (loop as any).timeEntries || [];
    const updatedEntries = currentEntries.filter((e: TimeEntry) => e.id !== id);
    const totalHours = updatedEntries.reduce((sum: number, e: TimeEntry) => sum + e.hours, 0);
    
    await updateAndSaveLoop({ 
      timeSpent: totalHours,
      ...(updatedEntries.length > 0 && { timeEntries: updatedEntries } as any)
    });
  };

  const handleAddCostEntry = async () => {
    if (!loop || !costEntryReason.trim() || !costEntryAmount.trim()) {
      Alert.alert('Required', 'Please enter both reason and amount.');
      return;
    }
    
    const amount = parseFloat(costEntryAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid', 'Please enter a valid amount.');
      return;
    }
    
    console.log('Exploration Loop: Adding cost entry');
    const newEntry: CostEntry = {
      id: Date.now().toString(),
      reason: costEntryReason.trim(),
      amount,
    };
    
    const currentEntries = (loop as any).costEntries || [];
    const updatedEntries = [...currentEntries, newEntry];
    const totalCosts = updatedEntries.reduce((sum, e) => sum + e.amount, 0);
    
    await updateAndSaveLoop({ 
      costs: totalCosts,
      ...(updatedEntries.length > 0 && { costEntries: updatedEntries } as any)
    });
    
    setCostEntryReason('');
    setCostEntryAmount('');
    setShowCostEntryOverlay(false);
  };

  const handleDeleteCostEntry = async (id: string) => {
    if (!loop) return;
    console.log('Exploration Loop: Deleting cost entry', id);
    
    const currentEntries = (loop as any).costEntries || [];
    const updatedEntries = currentEntries.filter((e: CostEntry) => e.id !== id);
    const totalCosts = updatedEntries.reduce((sum: number, e: CostEntry) => sum + e.amount, 0);
    
    await updateAndSaveLoop({ 
      costs: totalCosts,
      ...(updatedEntries.length > 0 && { costEntries: updatedEntries } as any)
    });
  };

  const getArtifactsByIds = (ids: string[]): Artifact[] => {
    if (!project) return [];
    return project.artifacts.filter(a => ids.includes(a.id));
  };

  const getTotalHours = () => {
    if (!loop) return 0;
    const entries = (loop as any).timeEntries || [];
    return entries.reduce((sum: number, entry: TimeEntry) => sum + entry.hours, 0);
  };

  const getTotalCosts = () => {
    if (!loop) return 0;
    const entries = (loop as any).costEntries || [];
    return entries.reduce((sum: number, entry: CostEntry) => sum + entry.amount, 0);
  };

  // FIXED: Match Framing screen artifact grid layout
  const renderArtifactGrid = (artifactIds: string[]) => {
    const artifacts = getArtifactsByIds(artifactIds);
    
    if (artifacts.length === 0) {
      return null;
    }
    
    return (
      <View style={styles.artifactGrid}>
        {artifacts.map((artifact) => (
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
                  color={colors.phaseExploration} 
                />
                <Text style={styles.artifactPlaceholderText}>PDF</Text>
              </View>
            ) : (
              <View style={styles.artifactPlaceholder}>
                <IconSymbol 
                  ios_icon_name="link" 
                  android_material_icon_name="link" 
                  size={32} 
                  color={colors.phaseExploration} 
                />
                <Text style={styles.artifactPlaceholderText}>URL</Text>
              </View>
            )}
            
            <View style={styles.artifactActions}>
              <TouchableOpacity 
                style={styles.artifactActionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleArtifactFavorite(artifact.id);
                }}
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
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteArtifact(artifact.id);
                }}
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
  };

  if (!project || !loop) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: '', headerShown: true, headerStyle: { backgroundColor: '#FFF6D8' } }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const timeEntries = (loop as any).timeEntries || [];
  const costEntries = (loop as any).costEntries || [];

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: '',
          headerShown: true,
          headerStyle: { backgroundColor: '#FFF6D8' },
          headerTintColor: colors.text,
        }} 
      />
      
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
                {loop.status.charAt(0).toUpperCase() + loop.status.slice(1)}
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
              defaultValue={loop.question}
              onChangeText={(text) => {
                questionRef.current = text;
              }}
              onBlur={() => {
                console.log('Exploration Loop: Question blur, saving');
                saveTextField('question', questionRef.current);
              }}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* 3. Explore - UPDATED: All content always visible */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explore</Text>
            
            {/* Notes section - ALWAYS visible */}
            <Text style={styles.subsectionTitle}>Notes</Text>
            <View style={styles.listContainer}>
              {loop.exploreItems.map((item, index) => (
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
                  key={exploreInputKey}
                  style={styles.addItemInput}
                  placeholder="Add exploration note..."
                  placeholderTextColor={colors.textSecondary}
                  defaultValue=""
                  onChangeText={(text) => {
                    newExploreTextRef.current = text;
                  }}
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
            
            {/* Visuals section - ALWAYS visible */}
            <Text style={styles.subsectionTitle}>Visuals</Text>
            <View style={styles.visualsSection}>
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
                <Text style={styles.addVisualsText}>Add Visual</Text>
              </TouchableOpacity>
              
              {renderArtifactGrid(loop.exploreArtifactIds)}
            </View>
          </View>

          {/* 4. Build - UPDATED: All content always visible */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Build</Text>
            
            {/* Notes section - ALWAYS visible */}
            <Text style={styles.subsectionTitle}>Notes</Text>
            <View style={styles.listContainer}>
              {loop.buildItems.map((item, index) => (
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
                  key={buildInputKey}
                  style={styles.addItemInput}
                  placeholder="Add build note..."
                  placeholderTextColor={colors.textSecondary}
                  defaultValue=""
                  onChangeText={(text) => {
                    newBuildTextRef.current = text;
                  }}
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
            
            {/* Visuals section - ALWAYS visible */}
            <Text style={styles.subsectionTitle}>Visuals</Text>
            <View style={styles.visualsSection}>
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
                <Text style={styles.addVisualsText}>Add Visual</Text>
              </TouchableOpacity>
              
              {renderArtifactGrid(loop.buildArtifactIds)}
            </View>
          </View>

          {/* 5. Check - UPDATED: All content always visible */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Check</Text>
            
            {/* Notes section - ALWAYS visible */}
            <Text style={styles.subsectionTitle}>Notes</Text>
            <View style={styles.listContainer}>
              {loop.checkItems.map((item, index) => (
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
                  key={checkInputKey}
                  style={styles.addItemInput}
                  placeholder="Add check note..."
                  placeholderTextColor={colors.textSecondary}
                  defaultValue=""
                  onChangeText={(text) => {
                    newCheckTextRef.current = text;
                  }}
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
            
            {/* Visuals section - ALWAYS visible */}
            <Text style={styles.subsectionTitle}>Visuals</Text>
            <View style={styles.visualsSection}>
              <TouchableOpacity 
                style={styles.addVisualsButton}
                onPress={() => {
                  setArtifactSection('check');
                  setShowArtifactOverlay(true);
                }}
              >
                <IconSymbol 
                  ios_icon_name="plus.circle" 
                  android_material_icon_name="add-circle" 
                  size={20} 
                  color={colors.phaseExploration} 
                />
                <Text style={styles.addVisualsText}>Add Visual</Text>
              </TouchableOpacity>
              
              {renderArtifactGrid(loop.checkArtifactIds)}
            </View>
          </View>

          {/* 6. Adapt - UPDATED: All content always visible */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adapt</Text>
            
            {/* Notes section - ALWAYS visible */}
            <Text style={styles.subsectionTitle}>Notes</Text>
            <View style={styles.listContainer}>
              {loop.adaptItems.map((item, index) => (
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
                  key={adaptInputKey}
                  style={styles.addItemInput}
                  placeholder="Add adapt note..."
                  placeholderTextColor={colors.textSecondary}
                  defaultValue=""
                  onChangeText={(text) => {
                    newAdaptTextRef.current = text;
                  }}
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
            
            {/* Visuals section - ALWAYS visible */}
            <Text style={styles.subsectionTitle}>Visuals</Text>
            <View style={styles.visualsSection}>
              <TouchableOpacity 
                style={styles.addVisualsButton}
                onPress={() => {
                  setArtifactSection('adapt');
                  setShowArtifactOverlay(true);
                }}
              >
                <IconSymbol 
                  ios_icon_name="plus.circle" 
                  android_material_icon_name="add-circle" 
                  size={20} 
                  color={colors.phaseExploration} 
                />
                <Text style={styles.addVisualsText}>Add Visual</Text>
              </TouchableOpacity>
              
              {renderArtifactGrid(loop.adaptArtifactIds)}
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
            
            {loop.explorationDecisions.length > 0 && (
              <View style={styles.decisionsTimeline}>
                {loop.explorationDecisions.map((decision) => (
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
            <Text style={styles.helperText}>
              Favorite a question to create a new exploration loop in Draft status
            </Text>
            
            <View style={styles.listContainer}>
              {loop.nextExplorationQuestions.map((question, index) => (
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
                  key={questionInputKey}
                  style={styles.addItemInput}
                  placeholder="Add next exploration question..."
                  placeholderTextColor={colors.textSecondary}
                  defaultValue=""
                  onChangeText={(text) => {
                    newQuestionTextRef.current = text;
                  }}
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
            
            <View style={styles.trackingSection}>
              <View style={styles.trackingHeader}>
                <Text style={styles.trackingTitle}>Hours</Text>
                <Text style={styles.trackingTotal}>{getTotalHours().toFixed(1)} hrs</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.addTrackingButton}
                onPress={() => setShowTimeEntryOverlay(true)}
              >
                <IconSymbol 
                  ios_icon_name="plus.circle" 
                  android_material_icon_name="add-circle" 
                  size={20} 
                  color={colors.phaseExploration} 
                />
                <Text style={styles.addTrackingText}>Add Time Entry</Text>
              </TouchableOpacity>
              
              {timeEntries.length > 0 && (
                <View style={styles.trackingList}>
                  {timeEntries.map((entry: TimeEntry) => (
                    <View key={entry.id} style={styles.trackingItem}>
                      <View style={styles.trackingItemContent}>
                        <Text style={styles.trackingItemReason}>{entry.reason}</Text>
                        <Text style={styles.trackingItemValue}>{entry.hours} hrs</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteTimeEntry(entry.id)}>
                        <IconSymbol 
                          ios_icon_name="trash" 
                          android_material_icon_name="delete" 
                          size={20} 
                          color={colors.phaseFinish} 
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            <View style={styles.trackingSection}>
              <View style={styles.trackingHeader}>
                <Text style={styles.trackingTitle}>Costs</Text>
                <Text style={styles.trackingTotal}>${getTotalCosts().toFixed(2)}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.addTrackingButton}
                onPress={() => setShowCostEntryOverlay(true)}
              >
                <IconSymbol 
                  ios_icon_name="plus.circle" 
                  android_material_icon_name="add-circle" 
                  size={20} 
                  color={colors.phaseExploration} 
                />
                <Text style={styles.addTrackingText}>Add Cost Entry</Text>
              </TouchableOpacity>
              
              {costEntries.length > 0 && (
                <View style={styles.trackingList}>
                  {costEntries.map((entry: CostEntry) => (
                    <View key={entry.id} style={styles.trackingItem}>
                      <View style={styles.trackingItemContent}>
                        <Text style={styles.trackingItemReason}>{entry.reason}</Text>
                        <Text style={styles.trackingItemValue}>${entry.amount.toFixed(2)}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteCostEntry(entry.id)}>
                        <IconSymbol 
                          ios_icon_name="trash" 
                          android_material_icon_name="delete" 
                          size={20} 
                          color={colors.phaseFinish} 
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
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
            
            {['draft', 'active', 'paused', 'completed'].map((statusOption) => (
              <TouchableOpacity 
                key={statusOption}
                style={styles.overlayOption}
                onPress={async () => {
                  console.log('Exploration Loop: Selected status', statusOption);
                  await updateAndSaveLoop({ status: statusOption as any });
                  setShowStatusPicker(false);
                }}
              >
                <Text style={styles.overlayOptionText}>
                  {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
            
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
              {selectedArtifact?.type === 'url' && (
                <TouchableOpacity 
                  onPress={() => selectedArtifact && handleOpenArtifact(selectedArtifact)}
                  style={styles.artifactViewerAction}
                >
                  <IconSymbol 
                    ios_icon_name="safari" 
                    android_material_icon_name="open-in-new" 
                    size={28} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
              )}
              
              {selectedArtifact?.type === 'document' && (
                <TouchableOpacity 
                  onPress={() => selectedArtifact && handleOpenArtifact(selectedArtifact)}
                  style={styles.artifactViewerAction}
                >
                  <IconSymbol 
                    ios_icon_name="doc" 
                    android_material_icon_name="open-in-new" 
                    size={28} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
              )}
              
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
              <Image 
                source={{ uri: selectedArtifact.uri }} 
                style={styles.artifactViewerImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.artifactViewerDoc}>
                <IconSymbol 
                  ios_icon_name={selectedArtifact?.type === 'url' ? "link" : "doc"} 
                  android_material_icon_name={selectedArtifact?.type === 'url' ? "link" : "description"} 
                  size={64} 
                  color="#FFFFFF" 
                />
                <Text style={styles.artifactViewerDocName}>{selectedArtifact?.name || selectedArtifact?.uri}</Text>
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

      {/* Add Time Entry Overlay */}
      <Modal
        visible={showTimeEntryOverlay}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimeEntryOverlay(false)}
      >
        <KeyboardAvoidingView 
          style={styles.overlayBackground}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity 
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowTimeEntryOverlay(false)}
          >
            <View style={styles.decisionOverlay}>
              <Text style={styles.overlayTitle}>Add Time Entry</Text>
              
              <Text style={styles.inputLabel}>Reason</Text>
              <TextInput
                style={styles.input}
                placeholder="What did you work on?"
                placeholderTextColor={colors.textSecondary}
                value={timeEntryReason}
                onChangeText={setTimeEntryReason}
              />
              
              <Text style={styles.inputLabel}>Hours</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={timeEntryHours}
                onChangeText={setTimeEntryHours}
                keyboardType="decimal-pad"
              />
              
              <View style={styles.decisionButtons}>
                <TouchableOpacity 
                  style={styles.decisionCancelButton}
                  onPress={() => {
                    setTimeEntryReason('');
                    setTimeEntryHours('');
                    setShowTimeEntryOverlay(false);
                  }}
                >
                  <Text style={styles.decisionCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.decisionSaveButton}
                  onPress={handleAddTimeEntry}
                >
                  <Text style={styles.decisionSaveText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Cost Entry Overlay */}
      <Modal
        visible={showCostEntryOverlay}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCostEntryOverlay(false)}
      >
        <KeyboardAvoidingView 
          style={styles.overlayBackground}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity 
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowCostEntryOverlay(false)}
          >
            <View style={styles.decisionOverlay}>
              <Text style={styles.overlayTitle}>Add Cost Entry</Text>
              
              <Text style={styles.inputLabel}>Reason</Text>
              <TextInput
                style={styles.input}
                placeholder="What was the expense for?"
                placeholderTextColor={colors.textSecondary}
                value={costEntryReason}
                onChangeText={setCostEntryReason}
              />
              
              <Text style={styles.inputLabel}>Amount ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={costEntryAmount}
                onChangeText={setCostEntryAmount}
                keyboardType="decimal-pad"
              />
              
              <View style={styles.decisionButtons}>
                <TouchableOpacity 
                  style={styles.decisionCancelButton}
                  onPress={() => {
                    setCostEntryReason('');
                    setCostEntryAmount('');
                    setShowCostEntryOverlay(false);
                  }}
                >
                  <Text style={styles.decisionCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.decisionSaveButton}
                  onPress={handleAddCostEntry}
                >
                  <Text style={styles.decisionSaveText}>Add</Text>
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
    backgroundColor: '#FFF6D8',
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
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
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
    marginBottom: 12,
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
  visualsSection: {
    marginTop: 8,
  },
  addVisualsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 8,
    marginBottom: 12,
  },
  addVisualsText: {
    fontSize: 16,
    color: colors.phaseExploration,
    fontWeight: '600',
  },
  artifactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THUMBNAIL_GAP,
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
    color: colors.phaseExploration,
    fontWeight: '600',
    marginTop: 4,
  },
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
  trackingSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 16,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  trackingTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.phaseExploration,
  },
  addTrackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  addTrackingText: {
    fontSize: 16,
    color: colors.phaseExploration,
    fontWeight: '600',
  },
  trackingList: {
    marginTop: 12,
  },
  trackingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  trackingItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 12,
  },
  trackingItemReason: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  trackingItemValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
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
    textAlign: 'center',
    paddingHorizontal: 32,
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
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  decisionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
