
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
} from '@/utils/storage';
import ExplorationLoopFilterSortModal, { 
  LoopStatus, 
  LoopSortOption, 
  SortDirection 
} from '@/components/ExplorationLoopFilterSortModal';
import PDFThumbnail from '@/components/PDFThumbnail';

export default function ExplorationLoopsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loops, setLoops] = useState<ExplorationLoop[]>([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<LoopStatus[]>([]);
  const [sortOption, setSortOption] = useState<LoopSortOption>('startDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadProject = useCallback(async () => {
    console.log('Exploration Loops: Loading project', projectId);
    const projects = await getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
      setLoops(found.explorationLoops || []);
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
    console.log('Exploration Loops: Creating new loop');
    router.push(`/exploration-loop?projectId=${projectId}`);
  };

  const handleOpenLoop = (loopId: string) => {
    console.log('Exploration Loops: Opening loop', loopId);
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
            console.log('Exploration Loops: Deleting loop', loopId);
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

  const getFilteredAndSortedLoops = (): ExplorationLoop[] => {
    let filtered = loops;

    // Apply status filter
    if (selectedStatuses.length > 0) {
      filtered = loops.filter(loop => selectedStatuses.includes(loop.status));
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortOption === 'startDate') {
        const aDate = a.startDate || a.updatedDate;
        const bDate = b.startDate || b.updatedDate;
        comparison = new Date(aDate).getTime() - new Date(bDate).getTime();
      } else if (sortOption === 'updatedDate') {
        comparison = new Date(a.updatedDate).getTime() - new Date(b.updatedDate).getTime();
      } else if (sortOption === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      
      // Apply direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  const handleFilterApply = (statuses: LoopStatus[], sort: LoopSortOption, direction: SortDirection) => {
    console.log('Exploration Loops: Applying filter/sort', { statuses, sort, direction });
    setSelectedStatuses(statuses);
    setSortOption(sort);
    setSortDirection(direction);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFavoriteArtifacts = (loop: ExplorationLoop): Artifact[] => {
    if (!project) return [];
    
    // Get artifacts from Explore and Build segments
    const exploreArtifactIds = loop.exploreArtifactIds || [];
    const buildArtifactIds = loop.buildArtifactIds || [];
    const combinedIds = [...exploreArtifactIds, ...buildArtifactIds];
    
    // Get artifacts that are marked as favorite
    const favoriteArtifacts = project.artifacts.filter(
      artifact => combinedIds.includes(artifact.id) && artifact.isFavorite && artifact.type !== 'url'
    );
    
    // Return first 4
    return favoriteArtifacts.slice(0, 4);
  };

  const getFavoriteNextQuestions = (loop: ExplorationLoop): string[] => {
    if (!loop.nextExplorationQuestions) return [];
    
    return loop.nextExplorationQuestions
      .filter(q => q.isFavorite)
      .map(q => q.text);
  };

  const renderLoopCard = (loop: ExplorationLoop) => {
    const favoriteArtifacts = getFavoriteArtifacts(loop);
    const favoriteQuestions = getFavoriteNextQuestions(loop);
    const totalHours = Math.floor(loop.timeSpent || 0);
    const totalCosts = Math.floor(loop.costs || 0);
    const startDate = loop.startDate || loop.updatedDate;
    
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
          <Text style={styles.metaText}>Start: {formatDate(startDate)}</Text>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.metaText}>Updated: {formatDate(loop.updatedDate)}</Text>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.metaText}>{getStatusLabel(loop.status)}</Text>
        </View>

        <View style={styles.loopStats}>
          <Text style={styles.statsText}>Total Costs: €{totalCosts}</Text>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.statsText}>Total Hours: {totalHours}h</Text>
        </View>
        
        {favoriteArtifacts.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.artifactStrip}
          >
            {favoriteArtifacts.map((artifact) => (
              <View key={artifact.id} style={styles.artifactThumb}>
                {artifact.type === 'image' ? (
                  <Image source={{ uri: artifact.uri }} style={styles.artifactImage} />
                ) : artifact.type === 'document' ? (
                  <PDFThumbnail
                    uri={artifact.uri}
                    width={80}
                    height={80}
                  />
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

        {favoriteQuestions.length > 0 && (
          <View style={styles.nextQuestionsSection}>
            {favoriteQuestions.map((question, index) => (
              <Text key={index} style={styles.nextQuestionText}>
                {question}
              </Text>
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
  const explorationBackgroundColor = '#FFF6D8';

  return (
    <View style={[styles.container, { backgroundColor: explorationBackgroundColor }]}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                console.log('Exploration Loops: Opening filter modal');
                setFilterModalVisible(true);
              }}
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
          style={{ backgroundColor: explorationBackgroundColor }}
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
            </View>
          ) : (
            <React.Fragment>
              {filteredLoops.map(loop => renderLoopCard(loop))}
            </React.Fragment>
          )}
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleCreateLoop}
        >
          <IconSymbol 
            ios_icon_name="plus" 
            android_material_icon_name="add" 
            size={24} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <ExplorationLoopFilterSortModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        selectedStatuses={selectedStatuses}
        sortOption={sortOption}
        sortDirection={sortDirection}
        onApply={handleFilterApply}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: 'transparent',
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
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
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
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  metaSeparator: {
    fontSize: 11,
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
  loopStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  artifactStrip: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 12,
  },
  artifactThumb: {
    width: 80,
    height: 80,
    backgroundColor: colors.divider,
    marginRight: 12,
    overflow: 'hidden',
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
  nextQuestionsSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  nextQuestionText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 0,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
