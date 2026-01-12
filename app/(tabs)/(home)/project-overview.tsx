
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
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import {
  getProjects,
  updateProject,
  Project,
  ProjectPhase,
  Artifact,
} from '@/utils/storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface Decision {
  id: string;
  summary: string;
  rationale: string;
  artifacts: string[];
  phase?: ProjectPhase;
  timestamp: string;
}

interface TimelineEvent {
  id: string;
  type: 'phase_change' | 'decision';
  timestamp: string;
  description: string;
  phase?: ProjectPhase;
}

export default function ProjectOverviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  
  const [showArtifactOverlay, setShowArtifactOverlay] = useState(false);
  const [showDecisionOverlay, setShowDecisionOverlay] = useState(false);
  
  const [decisionSummary, setDecisionSummary] = useState('');
  const [decisionRationale, setDecisionRationale] = useState('');
  const [decisionPhase, setDecisionPhase] = useState<ProjectPhase | undefined>();

  const loadProject = useCallback(async () => {
    const projects = await getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
      loadDecisionsAndTimeline(found);
    } else {
      Alert.alert('Project Not Found', 'This project no longer exists.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [projectId, router]);

  const loadDecisionsAndTimeline = (proj: Project) => {
    const storedDecisions = (proj as any).decisions || [];
    setDecisions(storedDecisions);
    
    const events: TimelineEvent[] = [];
    storedDecisions.forEach((dec: Decision) => {
      events.push({
        id: dec.id,
        type: 'decision',
        timestamp: dec.timestamp,
        description: dec.summary,
        phase: dec.phase,
      });
    });
    
    setTimeline(events.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  };

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

  const handlePhaseChange = async (newPhase: ProjectPhase) => {
    if (!project) return;
    
    const updatedProject = {
      ...project,
      phase: newPhase,
      updatedDate: new Date().toISOString(),
    };
    
    const timelineEvent: TimelineEvent = {
      id: Date.now().toString(),
      type: 'phase_change',
      timestamp: new Date().toISOString(),
      description: `Phase changed to ${newPhase}`,
      phase: newPhase,
    };
    
    setTimeline(prev => [timelineEvent, ...prev]);
    
    await updateProject(updatedProject);
    setProject(updatedProject);
  };

  const handleAddArtifact = async (type: 'camera' | 'photo' | 'file') => {
    if (!project) return;
    
    try {
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
          type: type === 'file' ? 'document' : 'image',
          uri: asset.uri,
          name: asset.name || 'Untitled',
        };
        
        const updatedProject = {
          ...project,
          artifacts: [...project.artifacts, newArtifact],
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

  const handleSaveDecision = async () => {
    if (!project) return;
    
    const newDecision: Decision = {
      id: Date.now().toString(),
      summary: decisionSummary || 'Decision recorded',
      rationale: decisionRationale,
      artifacts: [],
      phase: decisionPhase,
      timestamp: new Date().toISOString(),
    };
    
    const updatedDecisions = [...decisions, newDecision];
    
    let updatedProject = {
      ...project,
      updatedDate: new Date().toISOString(),
      decisions: updatedDecisions,
    } as any;
    
    if (decisionPhase && decisionPhase !== project.phase) {
      updatedProject.phase = decisionPhase;
    }
    
    await updateProject(updatedProject);
    setProject(updatedProject);
    setDecisions(updatedDecisions);
    
    const timelineEvent: TimelineEvent = {
      id: newDecision.id,
      type: 'decision',
      timestamp: newDecision.timestamp,
      description: newDecision.summary,
      phase: newDecision.phase,
    };
    setTimeline(prev => [timelineEvent, ...prev]);
    
    setDecisionSummary('');
    setDecisionRationale('');
    setDecisionPhase(undefined);
    setShowDecisionOverlay(false);
  };

  if (!project) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: '', headerShown: true }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading project...</Text>
        </View>
      </View>
    );
  }

  const phases: ProjectPhase[] = ['Framing', 'Exploration', 'Pilot', 'Delivery', 'Finish'];

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: '',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/(home)/edit-project?id=${project.id}`)}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>Edit</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.projectTitle}>{project.title}</Text>
            <View style={[styles.phaseLabel, { backgroundColor: getPhaseColor(project.phase) }]}>
              <Text style={styles.phaseLabelText}>{project.phase}</Text>
            </View>
            <Text style={styles.lastUpdated}>
              Last updated: {new Date(project.updatedDate).toLocaleDateString()}
            </Text>
          </View>

          {/* Phase Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phase</Text>
            <View style={styles.phaseSelector}>
              {phases.map((phase) => (
                <TouchableOpacity
                  key={phase}
                  style={[
                    styles.phaseOption,
                    project.phase === phase && { backgroundColor: getPhaseColor(phase) }
                  ]}
                  onPress={() => handlePhaseChange(phase)}
                >
                  <Text style={[
                    styles.phaseOptionText,
                    project.phase === phase && styles.phaseOptionTextActive
                  ]}>
                    {phase}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Key Artifacts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Key Artifacts</Text>
              <TouchableOpacity onPress={() => setShowArtifactOverlay(true)}>
                <Text style={styles.addButton}>Add Artifact</Text>
              </TouchableOpacity>
            </View>
            
            {project.artifacts.length === 0 ? (
              <View style={styles.emptyArtifacts}>
                <Text style={styles.emptyArtifactsText}>No visuals yet</Text>
                <Text style={styles.emptyArtifactsSubtext}>
                  Add material to support your thinking.
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.artifactStrip}>
                {project.artifacts.map((artifact) => (
                  <View key={artifact.id} style={styles.artifactThumb}>
                    {artifact.type === 'image' ? (
                      <Image source={{ uri: artifact.uri }} style={styles.artifactImage} />
                    ) : (
                      <View style={styles.artifactDoc}>
                        <IconSymbol 
                          ios_icon_name="doc" 
                          android_material_icon_name="description" 
                          size={24} 
                          color={colors.textSecondary} 
                        />
                      </View>
                    )}
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
                <Text style={styles.toolItemText}>Framing</Text>
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
                <Text style={styles.toolItemText}>Exploration Loops</Text>
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
                <Text style={styles.toolItemText}>Timeline</Text>
                <IconSymbol 
                  ios_icon_name="chevron.right" 
                  android_material_icon_name="arrow-forward" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.toolItem}>
                <Text style={styles.toolItemText}>Export (PDF)</Text>
                <IconSymbol 
                  ios_icon_name="chevron.right" 
                  android_material_icon_name="arrow-forward" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Inline Decision Capture */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.addDecisionButton}
              onPress={() => setShowDecisionOverlay(true)}
            >
              <IconSymbol 
                ios_icon_name="plus.circle" 
                android_material_icon_name="add-circle" 
                size={20} 
                color={colors.phaseFinish} 
              />
              <Text style={styles.addDecisionText}>Add Decision</Text>
            </TouchableOpacity>
          </View>

          {/* Lightweight Tracking */}
          <View style={styles.section}>
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>Costs</Text>
              <Text style={styles.trackingValue}>${project.costs.toFixed(2)}</Text>
            </View>
            <View style={[styles.trackingRow, styles.trackingRowLast]}>
              <Text style={styles.trackingLabel}>Hours</Text>
              <Text style={styles.trackingValue}>{project.hours}h</Text>
            </View>
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
            <Text style={styles.overlayTitle}>Add Artifact</Text>
            
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
              <Text style={styles.overlayOptionText}>Take Photo</Text>
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
              <Text style={styles.overlayOptionText}>Choose Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.overlayOption}
              onPress={() => handleAddArtifact('file')}
            >
              <IconSymbol 
                ios_icon_name="doc" 
                android_material_icon_name="description" 
                size={24} 
                color={colors.text} 
              />
              <Text style={styles.overlayOptionText}>Choose File</Text>
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
              
              <Text style={styles.inputLabel}>Decision Summary</Text>
              <TextInput
                style={styles.input}
                placeholder="What was decided?"
                placeholderTextColor={colors.textSecondary}
                value={decisionSummary}
                onChangeText={setDecisionSummary}
              />
              
              <Text style={styles.inputLabel}>Rationale (Why now?)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Why is this decision being made?"
                placeholderTextColor={colors.textSecondary}
                value={decisionRationale}
                onChangeText={setDecisionRationale}
                multiline
                numberOfLines={4}
              />
              
              <Text style={styles.inputLabel}>Optional Phase Update</Text>
              <View style={styles.phasePickerRow}>
                {phases.map((phase) => (
                  <TouchableOpacity
                    key={phase}
                    style={[
                      styles.phasePickerOption,
                      decisionPhase === phase && { backgroundColor: getPhaseColor(phase) }
                    ]}
                    onPress={() => setDecisionPhase(phase === decisionPhase ? undefined : phase)}
                  >
                    <Text style={[
                      styles.phasePickerText,
                      decisionPhase === phase && styles.phasePickerTextActive
                    ]}>
                      {phase.substring(0, 1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.decisionButtons}>
                <TouchableOpacity 
                  style={styles.decisionCancelButton}
                  onPress={() => {
                    setDecisionSummary('');
                    setDecisionRationale('');
                    setDecisionPhase(undefined);
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
  headerButton: {
    marginRight: 16,
  },
  headerButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  projectTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  phaseLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  phaseLabelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  lastUpdated: {
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  addButton: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  phaseSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  phaseOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.divider,
  },
  phaseOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  phaseOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyArtifacts: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  emptyArtifactsText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  emptyArtifactsSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  artifactStrip: {
    flexDirection: 'row',
  },
  artifactThumb: {
    width: 100,
    height: 100,
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
  },
  toolsList: {
    backgroundColor: '#FFFFFF',
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
  toolItemText: {
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
    color: colors.phaseFinish,
    fontWeight: '600',
  },
  trackingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  trackingRowLast: {
    borderBottomWidth: 0,
  },
  trackingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  trackingValue: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  phasePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  phasePickerOption: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.divider,
  },
  phasePickerText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  phasePickerTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: colors.phaseFinish,
  },
  decisionSaveText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
