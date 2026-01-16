
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import FilterSortModal, { SortOption, SortDirection } from '@/components/FilterSortModal';
import { getProjects, Project, ProjectPhase } from '@/utils/storage';
import { colors, commonStyles } from '@/styles/commonStyles';
import PDFThumbnail from '@/components/PDFThumbnail';

export default function HomeScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectPhase[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadProjects = useCallback(async () => {
    console.log('Home: Loading projects');
    const allProjects = await getProjects();
    setProjects(allProjects);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects])
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

  const getPhaseSurface = (phase: ProjectPhase): string => {
    switch (phase) {
      case 'Framing': return colors.surfaceFraming;
      case 'Exploration': return colors.surfaceExploration;
      case 'Pilot': return colors.surfacePilot;
      case 'Delivery': return colors.surfaceDelivery;
      case 'Finish': return colors.surfaceFinish;
      default: return '#F5F5F5';
    }
  };

  const getFilteredAndSortedProjects = (): Project[] => {
    let filtered = projects;

    // Apply status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(p => selectedStatuses.includes(p.phase));
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortOption) {
        case 'date':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'phase':
          comparison = a.phase.localeCompare(b.phase);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  const getDisplayArtifacts = (project: Project): any[] => {
    const favoriteArtifacts = project.artifacts.filter(a => a.isFavorite);
    const displayArtifacts = favoriteArtifacts.length > 0 ? favoriteArtifacts : project.artifacts;
    return displayArtifacts.slice(0, 4);
  };

  const handleFilterApply = (statuses: ProjectPhase[], sort: SortOption, direction: SortDirection) => {
    console.log('Home: Applying filters', { statuses, sort, direction });
    setSelectedStatuses(statuses);
    setSortOption(sort);
    setSortDirection(direction);
    setShowFilterModal(false);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleEditProject = (projectId: string, event: any) => {
    event.stopPropagation();
    console.log('Home: Navigating to Edit Project', projectId);
    router.push(`/(tabs)/(home)/edit-project?id=${projectId}`);
  };

  const filteredProjects = getFilteredAndSortedProjects();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => {
              console.log('Home: Opening filter modal');
              setShowFilterModal(true);
            }}
          >
            <IconSymbol 
              ios_icon_name="line.3.horizontal.decrease.circle" 
              android_material_icon_name="filter-list" 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              console.log('Home: Navigating to Create Project');
              router.push('/(tabs)/(home)/create-project');
            }}
          >
            <IconSymbol 
              ios_icon_name="plus.circle.fill" 
              android_material_icon_name="add-circle" 
              size={28} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Projects List */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {filteredProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {selectedStatuses.length > 0 
                ? 'No projects match your filters' 
                : 'No projects yet. Tap + to start your first project.'}
            </Text>
          </View>
        ) : (
          <View style={styles.projectsList}>
            {filteredProjects.map((project) => {
              const displayArtifacts = getDisplayArtifacts(project);
              
              return (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.projectCard,
                    { backgroundColor: getPhaseSurface(project.phase) }
                  ]}
                  onPress={() => {
                    console.log('Home: Opening project', project.id);
                    router.push(`/(tabs)/(home)/project-overview?id=${project.id}`);
                  }}
                  activeOpacity={0.7}
                >
                  {/* Phase Indicator */}
                  <View style={[styles.phaseIndicator, { backgroundColor: getPhaseColor(project.phase) }]} />
                  
                  {/* Project Header */}
                  <View style={styles.projectHeader}>
                    <View style={styles.projectHeaderLeft}>
                      <Text style={styles.projectTitle}>{project.title}</Text>
                      <Text style={styles.projectDate}>{formatDate(project.startDate)}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={(e) => handleEditProject(project.id, e)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <IconSymbol 
                        ios_icon_name="ellipsis.circle" 
                        android_material_icon_name="more-horiz" 
                        size={24} 
                        color={colors.textSecondary} 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Artifacts Strip */}
                  {displayArtifacts.length > 0 && (
                    <View style={styles.artifactsStrip}>
                      {displayArtifacts.map((artifact, index) => (
                        <View key={artifact.id} style={styles.artifactThumbnail}>
                          {artifact.type === 'image' ? (
                            <Image 
                              source={{ uri: artifact.uri }} 
                              style={styles.artifactImage}
                            />
                          ) : artifact.type === 'document' ? (
                            <PDFThumbnail uri={artifact.uri} style={styles.artifactImage} />
                          ) : artifact.type === 'url' ? (
                            <View style={styles.artifactPlaceholder}>
                              <IconSymbol 
                                ios_icon_name="link" 
                                android_material_icon_name="link" 
                                size={20} 
                                color={colors.textSecondary} 
                              />
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterSortModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    padding: 4,
  },
  addButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  projectsList: {
    gap: 16,
  },
  projectCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    position: 'relative',
  },
  phaseIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  projectDate: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  artifactsStrip: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  artifactThumbnail: {
    width: 60,
    height: 60,
  },
  artifactImage: {
    width: '100%',
    height: '100%',
  },
  artifactPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
});
