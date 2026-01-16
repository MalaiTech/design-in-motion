
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
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
  FramingDecision,
  ExplorationDecision,
  ExplorationQuestion,
  PhaseChangeEvent,
} from '@/utils/storage';

interface TimelineEvent {
  id: string;
  type: 'project_created' | 'phase_change' | 'framing' | 'exploration_loop' | 'decision';
  timestamp: string;
  data: any;
}

export default function TimelineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  const loadProject = useCallback(async () => {
    console.log('Timeline: Loading project', projectId);
    const projects = await getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
      generateTimeline(found);
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

  const generateTimeline = (proj: Project) => {
    console.log('Timeline: Generating timeline for project', proj.title);
    const events: TimelineEvent[] = [];

    // 1. Project created event
    events.push({
      id: `project_created_${proj.id}`,
      type: 'project_created',
      timestamp: proj.startDate,
      data: {
        title: proj.title,
      },
    });

    // 2. Phase changes from history (each phase change is a separate event)
    if (proj.phaseHistory && proj.phaseHistory.length > 0) {
      proj.phaseHistory.forEach((phaseEvent: PhaseChangeEvent) => {
        events.push({
          id: phaseEvent.id,
          type: 'phase_change',
          timestamp: phaseEvent.timestamp,
          data: {
            phase: phaseEvent.phase,
          },
        });
      });
    }

    // 3. Framing event (if framing data exists)
    if (proj.opportunityOrigin || proj.purpose || (proj.framingDecisions && proj.framingDecisions.length > 0)) {
      // Get favorite exploration questions (First Explorations)
      const favoriteQuestions = (proj.explorationQuestions || []).filter(q => q.isFavorite);
      
      events.push({
        id: `framing_${proj.id}`,
        type: 'framing',
        timestamp: proj.startDate,
        data: {
          purpose: proj.purpose,
          framingDecisions: proj.framingDecisions || [],
          firstExplorations: favoriteQuestions,
          artifacts: proj.artifacts.filter(a => a.caption === 'favorite'),
        },
      });
    }

    // 4. Exploration loops
    if (proj.explorationLoops && proj.explorationLoops.length > 0) {
      proj.explorationLoops.forEach((loop) => {
        // Get favorite next exploration questions
        const favoriteNextQuestions = (loop.nextExplorationQuestions || []).filter(q => q.isFavorite);
        
        events.push({
          id: `exploration_loop_${loop.id}`,
          type: 'exploration_loop',
          timestamp: loop.startDate, // Use startDate instead of updatedDate
          data: {
            loopId: loop.id,
            question: loop.question,
            status: loop.status,
            explorationDecisions: loop.explorationDecisions || [],
            nextExplorations: favoriteNextQuestions,
            artifacts: proj.artifacts.filter(a => 
              loop.exploreArtifactIds?.includes(a.id) || 
              loop.buildArtifactIds?.includes(a.id)
            ).filter(a => a.caption === 'favorite'),
          },
        });
      });
    }

    // 5. Project decisions (from project overview)
    const projectDecisions = (proj as any).decisions || [];
    projectDecisions.forEach((decision: any) => {
      events.push({
        id: `decision_${decision.id}`,
        type: 'decision',
        timestamp: decision.timestamp,
        data: {
          summary: decision.summary,
          rationale: decision.rationale,
        },
      });
    });

    // Sort chronologically (oldest first)
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    console.log('Timeline: Generated', events.length, 'events');
    setTimelineEvents(events);
  };

  const handleDeleteEvent = async (eventId: string, eventType: string) => {
    if (!project) return;

    // Only allow deletion of phase_change events
    if (eventType !== 'phase_change') {
      console.log('Timeline: Attempted to delete non-phase-change event', eventType);
      return;
    }

    console.log('Timeline: User tapped delete phase change event', eventId);
    Alert.alert(
      'Delete Phase Change',
      'Are you sure you want to delete this phase change event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('Timeline: Deleting phase change event', eventId);
            
            // Remove the phase change event from history
            const updatedPhaseHistory = (project.phaseHistory || []).filter(
              (phaseEvent: PhaseChangeEvent) => phaseEvent.id !== eventId
            );
            
            const updatedProject = {
              ...project,
              phaseHistory: updatedPhaseHistory,
              updatedDate: new Date().toISOString(),
            };
            
            await updateProject(updatedProject);
            setProject(updatedProject);
            generateTimeline(updatedProject);
          }
        }
      ]
    );
  };

  const handleEventTap = (event: TimelineEvent) => {
    console.log('Timeline: User tapped event', event.type);
    if (event.type === 'framing') {
      router.push(`/(tabs)/(home)/framing?id=${projectId}`);
    } else if (event.type === 'exploration_loop') {
      router.push(`/(tabs)/(home)/exploration-loop?projectId=${projectId}&loopId=${event.data.loopId}`);
    }
  };

  const renderEvent = (event: TimelineEvent, index: number) => {
    const isLast = index === timelineEvents.length - 1;

    switch (event.type) {
      case 'project_created':
        return (
          <View key={event.id} style={styles.eventContainer}>
            <View style={styles.timelineMarker}>
              <View style={styles.markerDot} />
              {!isLast && <View style={styles.markerLine} />}
            </View>
            <View style={styles.eventContent}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventType}>Project Created</Text>
                <Text style={styles.eventDate}>
                  {new Date(event.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.eventDescription}>{event.data.title}</Text>
            </View>
          </View>
        );

      case 'phase_change':
        return (
          <View key={event.id} style={styles.eventContainer}>
            <View style={styles.timelineMarker}>
              <View style={styles.markerDot} />
              {!isLast && <View style={styles.markerLine} />}
            </View>
            <View style={styles.eventContent}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventType}>Project Phase Change</Text>
                <View style={styles.eventActions}>
                  <Text style={styles.eventDate}>
                    {new Date(event.timestamp).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event.id, event.type);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <IconSymbol 
                      ios_icon_name="trash" 
                      android_material_icon_name="delete" 
                      size={18} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.eventDescription}>
                Phase changed to {event.data.phase}
              </Text>
            </View>
          </View>
        );

      case 'framing':
        return (
          <TouchableOpacity
            key={event.id}
            style={styles.eventContainer}
            onPress={() => handleEventTap(event)}
          >
            <View style={styles.timelineMarker}>
              <View style={styles.markerDot} />
              {!isLast && <View style={styles.markerLine} />}
            </View>
            <View style={[styles.eventContent, styles.cardEvent]}>
              <View style={styles.eventHeader}>
                <Text style={[styles.eventType, { color: colors.phaseFraming }]}>
                  Framing
                </Text>
                <Text style={styles.eventDate}>
                  {new Date(event.timestamp).toLocaleDateString()}
                </Text>
              </View>

              {event.data.purpose && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionText} numberOfLines={3}>
                    {event.data.purpose}
                  </Text>
                </View>
              )}

              {event.data.artifacts && event.data.artifacts.length > 0 && (
                <View style={styles.cardSection}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.cardArtifactStrip}
                  >
                    {event.data.artifacts.map((artifact: any) => (
                      <View key={artifact.id} style={styles.cardArtifactThumb}>
                        {artifact.type === 'image' ? (
                          <Image 
                            source={{ uri: artifact.uri }} 
                            style={styles.cardArtifactImage} 
                          />
                        ) : (
                          <View style={styles.cardArtifactDoc}>
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
                </View>
              )}

              {event.data.framingDecisions && event.data.framingDecisions.length > 0 && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>DECISIONS</Text>
                  {event.data.framingDecisions.map((decision: FramingDecision) => (
                    <View key={decision.id} style={styles.decisionItem}>
                      <Text style={styles.decisionText}>{decision.summary}</Text>
                      <Text style={styles.decisionDate}>
                        {new Date(decision.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {event.data.firstExplorations && event.data.firstExplorations.length > 0 && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>FIRST EXPLORATIONS</Text>
                  {event.data.firstExplorations.map((question: ExplorationQuestion) => (
                    <View key={question.id} style={styles.decisionItem}>
                      <Text style={styles.decisionText}>{question.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>
        );

      case 'exploration_loop':
        return (
          <TouchableOpacity
            key={event.id}
            style={styles.eventContainer}
            onPress={() => handleEventTap(event)}
          >
            <View style={styles.timelineMarker}>
              <View style={styles.markerDot} />
              {!isLast && <View style={styles.markerLine} />}
            </View>
            <View style={[styles.eventContent, styles.cardEvent]}>
              <View style={styles.eventHeader}>
                <Text style={[styles.eventType, { color: colors.phaseExploration }]}>
                  Exploration Loop
                </Text>
                <Text style={styles.eventDate}>
                  {new Date(event.timestamp).toLocaleDateString()}
                </Text>
              </View>

              {event.data.question && (
                <View style={styles.cardSection}>
                  <View style={styles.questionRow}>
                    <Text style={styles.cardSectionText}>{event.data.question}</Text>
                    <Text style={styles.statusBadge}>
                      {event.data.status.charAt(0).toUpperCase() + event.data.status.slice(1)}
                    </Text>
                  </View>
                </View>
              )}

              {event.data.artifacts && event.data.artifacts.length > 0 && (
                <View style={styles.cardSection}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.cardArtifactStrip}
                  >
                    {event.data.artifacts.map((artifact: any) => (
                      <View key={artifact.id} style={styles.cardArtifactThumb}>
                        {artifact.type === 'image' ? (
                          <Image 
                            source={{ uri: artifact.uri }} 
                            style={styles.cardArtifactImage} 
                          />
                        ) : (
                          <View style={styles.cardArtifactDoc}>
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
                </View>
              )}

              {event.data.explorationDecisions && event.data.explorationDecisions.length > 0 && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>DECISIONS</Text>
                  {event.data.explorationDecisions.map((decision: ExplorationDecision) => (
                    <View key={decision.id} style={styles.decisionItem}>
                      <Text style={styles.decisionText}>{decision.summary}</Text>
                      <Text style={styles.decisionDate}>
                        {new Date(decision.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {event.data.nextExplorations && event.data.nextExplorations.length > 0 && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>NEXT EXPLORATIONS</Text>
                  {event.data.nextExplorations.map((question: ExplorationQuestion) => (
                    <View key={question.id} style={styles.decisionItem}>
                      <Text style={styles.decisionText}>{question.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>
        );

      case 'decision':
        return (
          <View key={event.id} style={styles.eventContainer}>
            <View style={styles.timelineMarker}>
              <View style={[styles.markerDot, styles.markerDotDecision]} />
              {!isLast && <View style={styles.markerLine} />}
            </View>
            <View style={styles.eventContent}>
              <View style={styles.eventHeader}>
                <Text style={[styles.eventType, styles.eventTypeDecision]}>
                  Project Decision
                </Text>
                <Text style={styles.eventDate}>
                  {new Date(event.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.eventDescription}>{event.data.summary}</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
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
      {timelineEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No activity yet</Text>
          <Text style={styles.emptyStateSubtext}>
            As you work on the project, changes will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {timelineEvents.map((event, index) => renderEvent(event, index))}
        </ScrollView>
      )}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  },
  eventContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineMarker: {
    width: 40,
    alignItems: 'center',
    paddingTop: 4,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text,
    marginBottom: 8,
  },
  markerDotDecision: {
    backgroundColor: colors.phaseFinish,
  },
  markerLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.divider,
  },
  eventContent: {
    flex: 1,
  },
  cardEvent: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  eventTypeDecision: {
    color: colors.phaseFinish,
  },
  eventDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  cardSection: {
    marginTop: 12,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardSectionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusBadge: {
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.background,
    borderRadius: 4,
  },
  cardArtifactStrip: {
    flexDirection: 'row',
    marginTop: 8,
  },
  cardArtifactThumb: {
    width: 60,
    height: 60,
    backgroundColor: colors.divider,
    marginRight: 8,
  },
  cardArtifactImage: {
    width: '100%',
    height: '100%',
  },
  cardArtifactDoc: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  decisionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.divider,
    gap: 12,
  },
  decisionText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  decisionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
