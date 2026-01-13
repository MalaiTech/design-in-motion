
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
} from '@/utils/storage';

export default function ExplorationLoopsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loops, setLoops] = useState<ExplorationLoop[]>([]);

  const loadProject = useCallback(async () => {
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
    router.push(`/exploration-loop?projectId=${projectId}`);
  };

  const handleOpenLoop = (loopId: string) => {
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
