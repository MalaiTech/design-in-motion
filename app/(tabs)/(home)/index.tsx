
import { IconSymbol } from '@/components/IconSymbol';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { getProjects, Project, ProjectPhase } from '@/utils/storage';
import FilterSortModal, { SortOption, SortDirection } from '@/components/FilterSortModal';
import PDFThumbnail from '@/components/PDFThumbnail';

export default function HomeScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectPhase[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('startDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadProjects = useCallback(async () => {
    const data = await getProjects();
    console.log('Home Screen: Loaded projects:', data.length);
    setProjects(data);
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
      default: return colors.background;
    }
  };

  const getFilteredAndSortedProjects = (): Project[] => {
    let filtered = projects;

    // Apply status filter
    if (selectedStatuses.length > 0) {
      filtered = projects.filter(project => selectedStatuses.includes(project.phase));
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortOption === 'startDate') {
        comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      } else if (sortOption === 'updatedDate') {
        comparison = new Date(a.updatedDate).getTime() - new Date(b.updatedDate).getTime();
      } else {
        comparison = a.phase.localeCompare(b.phase);
      }
      
      // Apply direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  // FIXED: Get artifacts to display - show ALL initial artifacts OR framing favorites
  // Logic: Show ALL initial artifacts (excluding URLs for display) if no framing favorites exist
  //        Show ONLY framing favorites if they exist (hide initial artifacts)
  const getDisplayArtifacts = (project: Project) => {
    if (!project.artifacts || project.artifacts.length === 0) {
      console.log('Home Screen: No artifacts in project', project.title);
      return [];
    }

    const framingArtifactIds = project.framingArtifactIds || [];
    
    console.log('Home Screen: Project', project.title, '- Total artifacts:', project.artifacts.length, 'Framing IDs:', framingArtifactIds.length);
    
    // 1. Check if there are any favorite artifacts from Framing (excluding URLs for display)
    const framingFavoriteArtifacts = project.artifacts.filter(artifact => 
      framingArtifactIds.includes(artifact.id) && 
      artifact.isFavorite === true &&
      artifact.type !== 'url'
    );
    
    console.log('Home Screen: Framing favorite artifacts (non-URL):', framingFavoriteArtifacts.length);
    
    // 2. If there are framing favorites, show ONLY those (hide initial artifacts)
    if (framingFavoriteArtifacts.length > 0) {
      console.log('Home Screen: Displaying ONLY', framingFavoriteArtifacts.length, 'framing favorite artifacts');
      return framingFavoriteArtifacts;
    }
    
    // 3. Otherwise, show ALL initial artifacts (artifacts NOT in framingArtifactIds, excluding URLs)
    const initialArtifacts = project.artifacts.filter(
      artifact => !framingArtifactIds.includes(artifact.id) && artifact.type !== 'url'
    );
    
    if (initialArtifacts.length > 0) {
      console.log('Home Screen: Displaying ALL', initialArtifacts.length, 'initial artifacts');
      return initialArtifacts;
    }
    
    console.log('Home Screen: No artifacts to display');
    return [];
  };

  const handleFilterApply = (statuses: ProjectPhase[], sort: SortOption, direction: SortDirection) => {
    setSelectedStatuses(statuses);
    setSortOption(sort);
    setSortDirection(direction);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleEditProject = (projectId: string, event: any) => {
    event.stopPropagation();
    console.log('Home Screen: Navigating to edit project', projectId);
    router.push(`/(tabs)/(home)/edit-project?id=${projectId}`);
  };

  const filteredProjects = getFilteredAndSortedProjects();

  if (projects.length === 0) {
    return (
      <View style={[commonStyles.container, styles.emptyContainer]}>
        <View style={styles.customHeader}>
          <Image
            source={require('@/assets/images/a01ea08f-54b3-4fdb-aa75-b084bc2b1f09.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Design in Motion</Text>
            <Text style={styles.headerSubtitle}>An explorative development process</Text>
          </View>
        </View>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>No projects yet</Text>
          <Text style={styles.emptySubtext}>Start a project to begin exploring.</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              console.log('Home Screen: Navigating to create project');
              router.push('/(tabs)/(home)/create-project');
            }}
          >
            <Text style={styles.primaryButtonText}>Start Project</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={styles.customHeader}>
        <Image
          source={require('@/assets/images/a01ea08f-54b3-4fdb-aa75-b084bc2b1f09.png')}
          style={styles.appIcon}
          resizeMode="contain"
        />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Design in Motion</Text>
          <Text style={styles.headerSubtitle}>An explorative development process</Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            console.log('Home Screen: Opening filter modal');
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
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredProjects.map((project) => {
          const displayArtifacts = getDisplayArtifacts(project);
          
          return (
            <TouchableOpacity
              key={project.id}
              style={[styles.projectCard, { backgroundColor: getPhaseSurface(project.phase) }]}
              onPress={() => {
                console.log('Home Screen: Opening project overview for', project.title);
                router.push(`/(tabs)/(home)/project-overview?id=${project.id}`);
              }}
            >
              <View style={styles.projectHeader}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={(e) => handleEditProject(project.id, e)}
                >
                  <IconSymbol
                    ios_icon_name="pencil"
                    android_material_icon_name="edit"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.projectMeta}>
                <Text style={styles.metaText}>Start: {formatDate(project.startDate)}</Text>
                <Text style={styles.metaSeparator}>•</Text>
                <Text style={styles.metaText}>Updated: {formatDate(project.updatedDate)}</Text>
                <Text style={styles.metaSeparator}>•</Text>
                <Text style={styles.metaText}>{project.phase}</Text>
              </View>

              {displayArtifacts.length > 0 && (
                <ScrollView horizontal style={styles.artifactStrip} showsHorizontalScrollIndicator={false}>
                  {displayArtifacts.map((artifact) => (
                    <View key={artifact.id} style={styles.artifactThumb}>
                      {artifact.type === 'image' && artifact.uri ? (
                        <Image
                          source={{ uri: artifact.uri }}
                          style={styles.artifactImage}
                          resizeMode="cover"
                        />
                      ) : artifact.type === 'document' && artifact.uri ? (
                        <PDFThumbnail
                          uri={artifact.uri}
                          width={80}
                          height={80}
                        />
                      ) : (
                        <View style={styles.placeholderThumb}>
                          <IconSymbol
                            ios_icon_name="doc.text"
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
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          console.log('Home Screen: Navigating to create project (FAB)');
          router.push('/(tabs)/(home)/create-project');
        }}
      >
        <IconSymbol ios_icon_name="plus" android_material_icon_name="add" color="#FFFFFF" size={24} />
      </TouchableOpacity>

      <FilterSortModal
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
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  appIcon: {
    width: 84,
    height: 84,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 30,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  projectCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 0,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  editButton: {
    padding: 4,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  artifactStrip: {
    marginTop: 4,
  },
  artifactThumb: {
    width: 80,
    height: 80,
    marginRight: 12,
    borderRadius: 0,
    overflow: 'hidden',
  },
  artifactImage: {
    width: '100%',
    height: '100%',
  },
  placeholderThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
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
