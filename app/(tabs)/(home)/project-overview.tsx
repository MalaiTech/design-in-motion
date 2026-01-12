
import React, { useState, useCallback } from 'react';
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
  ProjectPhase,
  Artifact,
  Decision,
} from '@/utils/storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import PDFThumbnail from '@/components/PDFThumbnail.native';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function ProjectOverviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  
  // Edit states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPhaseMenu, setShowPhaseMenu] = useState(false);
  
  // Overlays
  const [showArtifactOverlay, setShowArtifactOverlay] = useState(false);
  const [showDecisionOverlay, setShowDecisionOverlay] = useState(false);
  const [showArtifactViewer, setShowArtifactViewer] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  
  // Decision form
  const [decisionSummary, setDecisionSummary] = useState('');
  const [decisionRationale, setDecisionRationale] = useState('');
  const [editingDecisionId, setEditingDecisionId] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    const projects = await getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
      setEditedTitle(found.title);
      const storedDecisions = (found as any).decisions || [];
      setDecisions(storedDecisions);
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

  const getPhaseColor = (phase: ProjectPhase): string => {
    switch (phase) {
      case 'Framing': return colors.phaseFraming;
      case 'Exploration': return colors.phaseExploration;
      case 'Finish': return colors.phaseFinish;
      case 'Pilot': return colors.textSecondary;
      case 'Delivery': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const handleSaveTitle = async () => {
    if (!project || !editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    
    const updatedProject = {
      ...project,
      title: editedTitle.trim(),
      updatedDate: new Date().toISOString(),
    };
    
    await updateProject(updatedProject);
    setProject(updatedProject);
    setIsEditingTitle(false);
  };

  const handleDateChange = async (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (!project || !selectedDate) return;
    
    const updatedProject = {
      ...project,
      startDate: selectedDate.toISOString(),
      updatedDate: new Date().toISOString(),
    };
    
    await updateProject(updatedProject);
    setProject(updatedProject);
  };

  const handlePhaseChange = async (newPhase: ProjectPhase) => {
    if (!project) return;
    
    const updatedProject = {
      ...project,
      phase: newPhase,
      updatedDate: new Date().toISOString(),
    };
    
    await updateProject(updatedProject);
    setProject(updatedProject);
    setShowPhaseMenu(false);
  };

  // Calculate total costs and hours from exploration loops
  const calculateTotals = () => {
    if (!project || !project.explorationLoops) {
      return { totalCosts: 0, totalHours: 0 };
    }
    
    const totalCosts = project.explorationLoops.reduce((sum, loop) => sum + (loop.costs || 0), 0);
    const totalHours = project.explorationLoops.reduce((sum, loop) => sum + (loop.timeSpent || 0), 0);
    
    return { totalCosts, totalHours };
  };

  const { totalCosts, totalHours } = calculateTotals();

  // Artifact management
  const handleAddArtifact = async (type: 'camera' | 'photo' | 'document' | 'url') => {
    if (!project) return;
    
    try {
      if (type === 'url') {
        Alert.prompt(
          'Add URL',
          'Enter the URL',
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
      a.id === artifactId 
        ? { ...a, isFavorite: !a.isFavorite, caption: !a.isFavorite ? 'favorite' : undefined } 
        : a
    );
    
    const updatedProject = {
      ...project,
      artifacts: updatedArtifacts,
      updatedDate: new Date().toISOString(),
    };
    
    await updateProject(updatedProject);
    setProject(updatedProject);
  };

  const handleOpenArtifact = (artifact: Artifact) => {
    if (artifact.type === 'url') {
      Linking.openURL(artifact.uri).catch(() => {
        Alert.alert('Error', 'Could not open URL');
      });
    } else {
      setSelectedArtifact(artifact);
      setShowArtifactViewer(true);
    }
  };

  // Decision management
  const handleSaveDecision = async () => {
    if (!project || !decisionSummary.trim()) {
      Alert.alert('Required', 'Please enter a decision summary.');
      return;
    }
    
    let updatedDecisions: Decision[];
    
    if (editingDecisionId) {
      // Edit existing decision
      updatedDecisions = decisions.map(d => 
        d.id === editingDecisionId 
          ? { ...d, summary: decisionSummary.trim(), rationale: decisionRationale.trim() }
          : d
      );
    } else {
      // Add new decision
      const newDecision: Decision = {
        id: Date.now().toString(),
        summary: decisionSummary.trim(),
        rationale: decisionRationale.trim(),
        artifacts: [],
        timestamp: new Date().toISOString(),
      };
      updatedDecisions = [...decisions, newDecision];
    }
    
    const updatedProject = {
      ...project,
      updatedDate: new Date().toISOString(),
      decisions: updatedDecisions,
    } as any;
    
    await updateProject(updatedProject);
    setProject(updatedProject);
    setDecisions(updatedDecisions);
    
    setDecisionSummary('');
    setDecisionRationale('');
    setEditingDecisionId(null);
    setShowDecisionOverlay(false);
  };

  const handleEditDecision = (decision: Decision) => {
    setDecisionSummary(decision.summary);
    setDecisionRationale(decision.rationale || '');
    setEditingDecisionId(decision.id);
    setShowDecisionOverlay(true);
  };

  const handleDeleteDecision = async (decisionId: string) => {
    if (!project) return;
    
    Alert.alert(
      'Delete Decision',
      'Are you sure you want to delete this decision?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedDecisions = decisions.filter(d => d.id !== decisionId);
            
            const updatedProject = {
              ...project,
              updatedDate: new Date().toISOString(),
              decisions: updatedDecisions,
            } as any;
            
            await updateProject(updatedProject);
            setProject(updatedProject);
            setDecisions(updatedDecisions);
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

  const phases: ProjectPhase[] = ['Framing', 'Exploration', 'Pilot', 'Delivery', 'Finish'];
  
  // Filter artifacts: show favorites if any exist, otherwise show all
  const favoriteArtifacts = project.artifacts.filter(a => a.isFavorite || a.caption === 'favorite');
  const displayArtifacts = favoriteArtifacts.length > 0 ? favoriteArtifacts : project.artifacts;

  // Project-specific floating tabs
  const projectTabs: TabBarItem[] = [
    {
      name: 'framing',
      route: (id?: string) => `/(tabs)/(home)/framing?id=${id || projectId}` as any,
      icon: 'dashboard',
      label: 'Framing',
    },
    {
      name: 'exploration',
      route: (id?: string) => `/(tabs)/(home)/exploration-loops?id=${id || projectId}` as any,
      icon: 'refresh',
      label: 'Exploration',
    },
    {
      name: 'timeline',
      route: (id?: string) => `/(tabs)/(home)/timeline?id=${id || projectId}` as any,
      icon: 'calendar-today',
      label: 'Timeline',
    },
    {
      name: 'export',
      route: (id?: string) => `/(tabs)/(home)/project-overview?id=${id || projectId}` as any,
      icon: 'download',
      label: 'Export',
    },
  ];

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Project Title - Editable */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Project title</Text>
            <View style={styles.titleContainer}>
              {isEditingTitle ? (
                <TextInput
                  style={styles.titleInput}
                  value={editedTitle}
                  onChangeText={setEditedTitle}
                  onBlur={handleSaveTitle}
                  autoFocus
                  placeholder="Enter project title"
                  placeholderTextColor={colors.textSecondary}
                />
              ) : (
                <React.Fragment>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
                    <IconSymbol 
                      ios_icon_name="pencil" 
                      android_material_icon_name="edit" 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </React.Fragment>
              )}
            </View>
          </View>

          {/* Starting Date & Totals in one section */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.dateRow}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.secondaryLabel}>Starting date</Text>
              <Text style={styles.secondaryValue}>
                {new Date(project.startDate).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.totalsRow}>
              <View style={styles.totalItem}>
                <Text style={styles.secondaryLabel}>Total Costs</Text>
                <Text style={styles.secondaryValue}>${totalCosts.toFixed(2)}</Text>
              </View>
              <View style={styles.totalItem}>
                <Text style={styles.secondaryLabel}>Total Hours</Text>
                <Text style={styles.secondaryValue}>{totalHours}h</Text>
              </View>
            </View>
          </View>

          {/* Phase - Pulldown Menu */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Phase</Text>
            <TouchableOpacity 
              style={styles.phaseSelector}
              onPress={() => setShowPhaseMenu(true)}
            >
              <View style={[styles.phaseIndicator, { backgroundColor: getPhaseColor(project.phase) }]} />
              <Text style={styles.phaseText}>{project.phase}</Text>
              <IconSymbol 
                ios_icon_name="chevron.down" 
                android_material_icon_name="arrow-drop-down" 
                size={24} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          {/* Visuals (Artifacts) - No title */}
          <View style={styles.section}>
            <View style={styles.visualsHeader}>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setShowArtifactOverlay(true)}
              >
                <IconSymbol 
                  ios_icon_name="plus.circle" 
                  android_material_icon_name="add-circle" 
                  size={24} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </View>
            
            {displayArtifacts.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.artifactStrip}>
                {displayArtifacts.map((artifact) => (
                  <View key={artifact.id} style={styles.artifactContainer}>
                    <TouchableOpacity
                      style={styles.artifactThumb}
                      onPress={() => handleOpenArtifact(artifact)}
                    >
                      {artifact.type === 'image' ? (
                        <Image source={{ uri: artifact.uri }} style={styles.artifactImage} />
                      ) : artifact.type === 'document' && artifact.uri.toLowerCase().endsWith('.pdf') ? (
                        <View style={styles.artifactDoc}>
                          <IconSymbol 
                            ios_icon_name="doc" 
                            android_material_icon_name="description" 
                            size={32} 
                            color={colors.textSecondary} 
                          />
                        </View>
                      ) : artifact.type === 'url' ? (
                        <View style={styles.artifactDoc}>
                          <IconSymbol 
                            ios_icon_name="link" 
                            android_material_icon_name="link" 
                            size={32} 
                            color={colors.textSecondary} 
                          />
                        </View>
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
                    </TouchableOpacity>
                    
                    {/* Favorite and Delete buttons below thumbnail */}
                    <View style={styles.artifactActions}>
                      <TouchableOpacity onPress={() => handleToggleArtifactFavorite(artifact.id)}>
                        <IconSymbol 
                          ios_icon_name={(artifact.isFavorite || artifact.caption === 'favorite') ? "star.fill" : "star"} 
                          android_material_icon_name={(artifact.isFavorite || artifact.caption === 'favorite') ? "star" : "star-border"} 
                          size={20} 
                          color={(artifact.isFavorite || artifact.caption === 'favorite') ? "#FFD700" : colors.textSecondary} 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteArtifact(artifact.id)}>
                        <IconSymbol 
                          ios_icon_name="trash" 
                          android_material_icon_name="delete" 
                          size={20} 
                          color={colors.phaseFinish} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Project Tools */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Tools</Text>
            <View style={styles.toolsList}>
              <TouchableOpacity 
                style={styles.toolItem}
                onPress={() => router.push(`/(tabs)/(home)/framing?id=${project.id}`)}
              >
                <View style={styles.toolItemLeft}>
                  <IconSymbol 
                    ios_icon_name="square.grid.2x2" 
                    android_material_icon_name="dashboard" 
                    size={20} 
                    color={colors.phaseFraming} 
                  />
                  <Text style={styles.toolItemText}>Framing</Text>
                </View>
                <IconSymbol 
                  ios_icon_name="chevron.right" 
                  android_material_icon_name="arrow-forward" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.toolItem}
                onPress={() => router.push(`/(tabs)/(home)/exploration-loops?id=${project.id}`)}
              >
                <View style={styles.toolItemLeft}>
                  <IconSymbol 
                    ios_icon_name="arrow.triangle.2.circlepath" 
                    android_material_icon_name="refresh" 
                    size={20} 
                    color={colors.phaseExploration} 
                  />
                  <Text style={styles.toolItemText}>Exploration</Text>
                </View>
                <IconSymbol 
                  ios_icon_name="chevron.right" 
                  android_material_icon_name="arrow-forward" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.toolItem}
                onPress={() => router.push(`/(tabs)/(home)/timeline?id=${project.id}`)}
              >
                <View style={styles.toolItemLeft}>
                  <IconSymbol 
                    ios_icon_name="calendar" 
                    android_material_icon_name="calendar-today" 
                    size={20} 
                    color={colors.text} 
                  />
                  <Text style={styles.toolItemText}>Timeline</Text>
                </View>
                <IconSymbol 
                  ios_icon_name="chevron.right" 
                  android_material_icon_name="arrow-forward" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.toolItem}>
                <View style={styles.toolItemLeft}>
                  <IconSymbol 
                    ios_icon_name="arrow.down.doc" 
                    android_material_icon_name="download" 
                    size={20} 
                    color={colors.text} 
                  />
                  <Text style={styles.toolItemText}>Export</Text>
                </View>
                <IconSymbol 
                  ios_icon_name="chevron.right" 
                  android_material_icon_name="arrow-forward" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Project Decisions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Project Decisions</Text>
              <TouchableOpacity onPress={() => setShowDecisionOverlay(true)}>
                <IconSymbol 
                  ios_icon_name="plus.circle" 
                  android_material_icon_name="add-circle" 
                  size={24} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </View>
            
            {decisions.length === 0 ? (
              <View style={styles.emptyDecisions}>
                <Text style={styles.emptyDecisionsText}>No decisions recorded yet</Text>
              </View>
            ) : (
              <View style={styles.decisionsList}>
                {decisions.map((decision) => (
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

      {/* Floating Tab Bar for Project Navigation */}
      <FloatingTabBar tabs={projectTabs} projectId={projectId} />

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(project.startDate)}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Phase Menu Modal */}
      <Modal
        visible={showPhaseMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhaseMenu(false)}
      >
        <TouchableOpacity 
          style={styles.overlayBackground}
          activeOpacity={1}
          onPress={() => setShowPhaseMenu(false)}
        >
          <View style={styles.overlayContent}>
            <Text style={styles.overlayTitle}>Select Phase</Text>
            {phases.map((phase) => (
              <TouchableOpacity
                key={phase}
                style={styles.phaseMenuItem}
                onPress={() => handlePhaseChange(phase)}
              >
                <View style={[styles.phaseIndicator, { backgroundColor: getPhaseColor(phase) }]} />
                <Text style={[
                  styles.phaseMenuText,
                  project.phase === phase && styles.phaseMenuTextActive
                ]}>
                  {phase}
                </Text>
                {project.phase === phase && (
                  <IconSymbol 
                    ios_icon_name="checkmark" 
                    android_material_icon_name="check" 
                    size={20} 
                    color={colors.primary} 
                  />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.overlayCancelButton}
              onPress={() => setShowPhaseMenu(false)}
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
    backgroundColor: colors.background,
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
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 12,
  },
  projectTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  titleInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    padding: 0,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  secondaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  secondaryValue: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  totalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 12,
  },
  phaseIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  phaseText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  visualsHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  addButton: {
    padding: 4,
  },
  artifactStrip: {
    flexDirection: 'row',
  },
  artifactContainer: {
    marginRight: 12,
  },
  artifactThumb: {
    width: 100,
    height: 100,
    backgroundColor: colors.divider,
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
  artifactActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  toolsList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  toolItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  toolItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolItemText: {
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
  phaseMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  phaseMenuText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  phaseMenuTextActive: {
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
  artifactViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artifactViewerImage: {
    width: '100%',
    height: '100%',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
    backgroundColor: colors.primary,
  },
  decisionSaveText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
