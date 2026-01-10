
import { IconSymbol } from '@/components/IconSymbol';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { getProjects, Project, ProjectPhase } from '@/utils/storage';

export default function HomeScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  const loadProjects = useCallback(async () => {
    const data = await getProjects();
    console.log('Loaded projects:', data);
    setProjects(data);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const unsubscribe = router.subscribe(() => {
      loadProjects();
    });
    return unsubscribe;
  }, [router, loadProjects]);

  const getPhaseColor = (phase: ProjectPhase): string => {
    switch (phase) {
      case 'framing': return colors.phaseFraming;
      case 'exploration': return colors.phaseExploration;
      case 'finish': return colors.phaseFinish;
      default: return colors.textSecondary;
    }
  };

  const getPhaseSurface = (phase: ProjectPhase): string => {
    switch (phase) {
      case 'framing': return colors.surfaceFraming;
      case 'exploration': return colors.surfaceExploration;
      case 'pilot': return colors.surfacePilot;
      case 'delivery': return colors.surfaceDelivery;
      case 'finish': return colors.surfaceFinish;
      default: return colors.background;
    }
  };

  if (projects.length === 0) {
    return (
      <View style={[commonStyles.container, styles.emptyContainer]}>
        <Text style={styles.emptyTitle}>No projects yet</Text>
        <Text style={styles.emptySubtext}>Start a project to begin exploring.</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(tabs)/(home)/create-project')}
        >
          <Text style={styles.primaryButtonText}>Start Project</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={[styles.projectCard, { backgroundColor: getPhaseSurface(project.phase) }]}
            onPress={() => router.push(`/(tabs)/(home)/edit-project?id=${project.id}`)}
          >
            <View style={styles.projectHeader}>
              <Text style={styles.projectTitle}>{project.title}</Text>
              <View style={[styles.phaseIndicator, { backgroundColor: getPhaseColor(project.phase) }]}>
                <Text style={styles.phaseText}>{project.phase}</Text>
              </View>
            </View>
            {project.artifacts && project.artifacts.length > 0 && (
              <ScrollView horizontal style={styles.artifactStrip} showsHorizontalScrollIndicator={false}>
                {project.artifacts.map((artifact, index) => (
                  <View key={index} style={styles.artifactThumb} />
                ))}
              </ScrollView>
            )}
            <Text style={styles.projectDate}>
              {new Date(project.updatedAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/(home)/create-project')}
      >
        <IconSymbol ios_icon_name="plus" android_material_icon_name="add" color="#FFFFFF" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
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
    padding: 16,
    marginBottom: 16,
    borderRadius: 0,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  phaseIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 0,
  },
  phaseText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  artifactStrip: {
    marginBottom: 12,
  },
  artifactThumb: {
    width: 60,
    height: 60,
    backgroundColor: colors.divider,
    marginRight: 8,
    borderRadius: 0,
  },
  projectDate: {
    fontSize: 12,
    color: colors.textSecondary,
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
