
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
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import FilterSortModal, { SortOption, SortDirection } from '@/components/FilterSortModal';
import * as Sharing from 'expo-sharing';
import {
  getProjects,
  updateProject,
  Project,
  ExplorationLoop,
  Artifact,
} from '@/utils/storage';

type LoopStatus = 'draft' | 'active' | 'paused' | 'completed';

export default function ExplorationLoopsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loops, setLoops] = useState<ExplorationLoop[]>([]);
  
  // Filter & Sort state
  const [showFilterSort, setShowFilterSort] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<LoopStatus[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('startDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const getStatusColor = (status: LoopStatus): string => {
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

  const getStatusLabel = (status: LoopStatus): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getPhaseLabel = (loop: ExplorationLoop): string => {
    // Determine phase based on what sections have content
    if (loop.adaptItems && loop.adaptItems.length > 0) return 'Adapt';
    if (loop.checkItems && loop.checkItems.length > 0) return 'Check';
    if (loop.buildItems && loop.buildItems.length > 0) return 'Build';
    if (loop.exploreItems && loop.exploreItems.length > 0) return 'Explore';
    return 'Draft';
  };

  const getStartDate = (loop: ExplorationLoop): string | null => {
    // Start date is when the loop was set to Active status
    // For now, we'll use the updatedDate if status is active or completed
    if (loop.status === 'active' || loop.status === 'completed') {
      return loop.updatedDate;
    }
    return null;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDisplayArtifacts = (loop: ExplorationLoop): Artifact[] => {
    if (!project) return [];
    
    // Get artifacts from Explore and Build segments
    const exploreAndBuildIds = [
      ...(loop.exploreArtifactIds || []),
      ...(loop.buildArtifactIds || [])
    ];
    
    const artifacts = project.artifacts.filter(a => exploreAndBuildIds.includes(a.id));
    
    // Filter to only favorites if any exist
    const favorites = artifacts.filter(a => a.isFavorite);
    return favorites.length > 0 ? favorites : artifacts;
  };

  const getFavoriteNextQuestions = (loop: ExplorationLoop): string[] => {
    if (!loop.nextExplorationQuestions) return [];
    return loop.nextExplorationQuestions
      .filter(q => q.isFavorite)
      .map(q => q.text);
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
      }
    } catch (error) {
      console.error('Error opening artifact:', error);
      Alert.alert('Error', 'Could not open this file');
    }
  };

  const getFilteredAndSortedLoops = (): ExplorationLoop[] => {
    let filtered = loops;
    
    // Apply status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(loop => selectedStatuses.includes(loop.status));
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortOption) {
        case 'startDate': {
          const dateA = getStartDate(a) || a.updatedDate;
          const dateB = getStartDate(b) || b.updatedDate;
          comparison = new Date(dateA).getTime() - new Date(dateB).getTime();
          break;
        }
        case 'updatedDate':
          comparison = new Date(a.updatedDate).getTime() - new Date(b.updatedDate).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  };

  const handleFilterApply = (statuses: LoopStatus[], sort: SortOption, direction: SortDirection) => {
    console.log('ExplorationLoopsScreen: Applying filter/sort', { statuses, sort, direction });
    setSelectedStatuses(statuses);
    setSortOption(sort);
    setSortDirection(direction);
  };

  const renderLoopCard = (loop: ExplorationLoop) => {
    const displayArtifacts = getDisplayArtifacts(loop);
    const favoriteNextQuestions = getFavoriteNextQuestions(loop);
    const startDate = getStartDate(loop);
    const phase = getPhaseLabel(loop);
    
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
        
        {/* Meta row: Start, Updated, Phase */}
        <View style={styles.loopMeta}>
          {startDate && (
            <Text style={styles.loopMetaText}>Start: {formatDate(startDate)}</Text>
          )}
          <Text style={styles.loopMetaText}>Updated: {formatDate(loop.updatedDate)}</Text>
          <View style={[styles.phaseBadge, { backgroundColor: getStatusColor(loop.status) }]}>
            <Text style={styles.phaseText}>{phase}</Text>
          </View>
        </View>
        
        {/* Artifacts strip */}
        {displayArtifacts.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.artifactStrip}
          >
            {displayArtifacts.map((artifact) => (
              <TouchableOpacity
                key={artifact.id}
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
                      size={24} 
                      color={colors.textSecondary} 
                    />
                    <Text style={styles.artifactLabel}>PDF</Text>
                  </View>
                ) : artifact.type === 'url' ? (
                  <View style={styles.artifactDoc}>
                    <IconSymbol 
                      ios_icon_name="link" 
                      android_material_icon_name="link" 
                      size={24} 
                      color={colors.textSecondary} 
                    />
                    <Text style={styles.artifactLabel}>URL</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        {/* Next Exploration Loop (favorite questions only) */}
        {favoriteNextQuestions.length > 0 && (
          <View style={styles.nextQuestionsSection}>
            <Text style={styles.nextQuestionsTitle}>Next Exploration Loop:</Text>
            {favoriteNextQuestions.map((question, index) => (
              <Text key={index} style={styles.nextQuestionText}>• {question}</Text>
            ))}
          </View>
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

  const filteredLoops = getFilteredAndSortedLoops();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowFilterSort(true)}
              style={styles.headerButton}
            >
              <IconSymbol
                ios_icon_name="line.3.horizontal.decrease.circle"
                android_material_icon_name="filter-list"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          ),
        }}
      />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {filteredLoops.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>
                {loops.length === 0 ? 'No exploration loops yet' : 'No loops match your filters'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {loops.length === 0 
                  ? 'Start a loop to explore an open question.'
                  : 'Try adjusting your filter settings.'}
              </Text>
              {loops.length === 0 && (
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
              )}
            </View>
          ) : (
            <React.Fragment>
              {filteredLoops.map(loop => renderLoopCard(loop))}
            </React.Fragment>
          )}
        </ScrollView>
        
        {/* Floating action button - Bottom Right */}
        {loops.length > 0 && (
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity 
              style={styles.floatingButton}
              onPress={handleCreateLoop}
            >
              <IconSymbol 
                ios_icon_name="plus" 
                android_material_icon_name="add" 
                size={28} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Filter & Sort Modal */}
      <FilterSortModal
        visible={showFilterSort}
        onClose={() => setShowFilterSort(false)}
        selectedStatuses={selectedStatuses as any}
        sortOption={sortOption}
        sortDirection={sortDirection}
        onApply={handleFilterApply as any}
      />
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
    paddingBottom: 120, // Extra space for floating button
  },
  headerButton: {
    marginRight: 16,
    padding: 4,
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
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
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
    flexWrap: 'wrap',
  },
  loopMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  phaseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  phaseText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  artifactStrip: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  artifactThumb: {
    width: 80,
    height: 80,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  artifactLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  nextQuestionsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  nextQuestionsTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  nextQuestionText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 80, // Above the FloatingTabBar
    right: 16,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 0, // Square button
    backgroundColor: colors.phaseExploration,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
