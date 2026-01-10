
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { getProjects, Project, ProjectPhase } from '@/utils/storage';
import { IconSymbol } from '@/components/IconSymbol';

export default function HomeScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<ProjectPhase | 'All'>('All');

  const loadProjects = useCallback(async () => {
    const loadedProjects = await getProjects();
    setProjects(loadedProjects);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Refresh projects when screen comes into focus
  useEffect(() => {
    const unsubscribe = router.subscribe(() => {
      loadProjects();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router, loadProjects]);

  const filteredProjects = filter === 'All' 
    ? projects 
    : projects.filter(p => p.phase === filter);

  const getPhaseColor = (phase: ProjectPhase): string => {
    switch (phase) {
      case 'Framing': return colors.framingPrimary;
      case 'Exploration': return colors.explorationPrimary;
      case 'Pilot': return colors.pilotPrimary;
      case 'Delivery': return colors.deliveryPrimary;
      case 'Finish': return colors.finishPrimary;
      default: return colors.text;
    }
  };

  const getPhaseSurface = (phase: ProjectPhase): string => {
    switch (phase) {
      case 'Framing': return colors.framingSurface;
      case 'Exploration': return colors.explorationSurface;
      case 'Pilot': return colors.pilotSurface;
      case 'Delivery': return colors.deliverySurface;
      case 'Finish': return colors.finishSurface;
      default: return colors.background;
    }
  };

  const phases: Array<ProjectPhase | 'All'> = ['All', 'Framing', 'Exploration', 'Pilot', 'Delivery', 'Finish'];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Design in Motion',
          headerLargeTitle: true,
        }}
      />
      <View style={commonStyles.container}>
        {/* Phase Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {phases.map((phase) => (
            <TouchableOpacity
              key={phase}
              style={[
                styles.filterButton,
                filter === phase && styles.filterButtonActive,
                filter === phase && phase !== 'All' && {
                  backgroundColor: getPhaseColor(phase as ProjectPhase),
                },
              ]}
              onPress={() => setFilter(phase)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === phase && styles.filterButtonTextActive,
                ]}
              >
                {phase}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Projects List */}
        <ScrollView 
          style={styles.projectsList}
          contentContainerStyle={styles.projectsListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredProjects.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol 
                ios_icon_name="folder" 
                android_material_icon_name="folder" 
                size={64} 
                color={colors.textSecondary} 
              />
              <Text style={[commonStyles.title, styles.emptyTitle]}>
                {filter === 'All' ? 'No Projects Yet' : `No ${filter} Projects`}
              </Text>
              <Text style={[commonStyles.textSecondary, styles.emptyText]}>
                {filter === 'All' 
                  ? 'Start your first project to begin your creative journey' 
                  : `Create a project in the ${filter} phase`}
              </Text>
            </View>
          ) : (
            filteredProjects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={[
                  styles.projectCard,
                  { borderLeftColor: getPhaseColor(project.phase), borderLeftWidth: 4 },
                ]}
                onPress={() => router.push(`/(tabs)/(home)/edit-project?id=${project.id}`)}
              >
                {/* Phase Badge */}
                <View style={[styles.phaseBadge, { backgroundColor: getPhaseSurface(project.phase) }]}>
                  <Text style={[styles.phaseText, { color: getPhaseColor(project.phase) }]}>
                    {project.phase}
                  </Text>
                </View>

                {/* Project Info */}
                <Text style={styles.projectName}>{project.name}</Text>
                {project.description ? (
                  <Text style={styles.projectDescription} numberOfLines={2}>
                    {project.description}
                  </Text>
                ) : null}

                {/* Artifact Strip (Placeholder) */}
                <View style={styles.artifactStrip}>
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.artifactPlaceholder,
                        { backgroundColor: getPhaseSurface(project.phase) },
                      ]} 
                    />
                  ))}
                </View>

                {/* Updated Date */}
                <Text style={styles.updatedDate}>
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Create Project Button */}
        <View style={styles.createButtonContainer}>
          <TouchableOpacity
            style={[commonStyles.button, styles.createButton]}
            onPress={() => router.push('/(tabs)/(home)/create-project')}
          >
            <IconSymbol 
              ios_icon_name="plus" 
              android_material_icon_name="add" 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={[commonStyles.buttonText, styles.createButtonText]}>
              Start a Project
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.background,
  },
  filterButtonActive: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  projectsList: {
    flex: 1,
  },
  projectsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  projectCard: {
    backgroundColor: colors.background,
    borderRadius: 0,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  phaseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  phaseText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  projectName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  artifactStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  artifactPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  updatedDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  createButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: {
    marginLeft: 4,
  },
});
