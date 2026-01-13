
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

    // 2. Phase changes (we don't have history, so we only show current phase if it's not Framing)
    // In a real app, you'd track phase change history
    if (proj.phase !== 'Framing') {
      events.push({
        id: `phase_change_${proj.id}_${proj.phase}`,
        type: 'phase_change',
        timestamp: proj.updatedDate,
        data: {
          phase: proj.phase,
        },
      });
    }

    // 3. Framing event (if framing data exists)
    if (proj.opportunityOrigin || proj.purpose || (proj.framingDecisions && proj.framingDecisions.length > 0)) {
      events.push({
        id: `framing_${proj.id}`,
        type: 'framing',
        timestamp: proj.startDate, // Framing typically happens at the start
        data: {
          purpose: proj.purpose,
          framingDecisions: proj.framingDecisions || [],
          artifacts: proj.artifacts.filter(a => a.caption === 'favorite'),
        },
      });
    }

    // 4. Exploration loops
    if (proj.explorationLoops && proj.explorationLoops.length > 0) {
      proj.explorationLoops.forEach((loop) => {
        events.push({
          id: `exploration_loop_${loop.id}`,
          type: 'exploration_loop',
          timestamp: loop.updatedDate,
          data: {
            loopId: loop.id,
            question: loop.question,
            status: loop.status,
            buildItems: loop.buildItems || [],
            explorationDecisions: loop.explorationDecisions || [],
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

    setTimelineEvents(events);
  };

  const handleDeleteEvent = async (eventId: string, eventType: string) => {
    if (!project) return;

    Alert.alert(
      'Delete Timeline Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            let updatedProject = { ...project };

            // Handle deletion based on event type
            if (eventType === 'exploration_loop') {
              const loopId = eventId.replace('exploration_loop_', '');
              updatedProject.explorationLoops = (project.explorationLoops || []).filter(
                loop => loop.id !== loopId
              );
            } else if (eventType === 'decision') {
              const decisionId = eventId.replace('decision_', '');
              const decisions = ((project as any).decisions || []).filter(
                (d: any) => d.id !== decisionId
              );
              (updatedProject as any).decisions = decisions;
            } else if (eventType === 'framing') {
              // Clear framing data
              updatedProject.opportunityOrigin = '';
              updatedProject.purpose = '';
              updatedProject.framingDecisions = [];
            }

            updatedProject.updatedDate = new Date().toISOString();
            await updateProject(updatedProject);
            setProject(updatedProject);
            generateTimeline(updatedProject);
          }
        }
      ]
    );
  };

  const handleEventTap = (event: TimelineEvent) => {
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
                <Text style={styles.eventType}>Phase Change</Text>
                <Text style={styles.eventDate}>
                  {new Date(event.timestamp).toLocaleDateString()}
                </Text>
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

              {event.data.purpose && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>Purpose</Text>
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
                  <Text style={styles.cardSectionTitle}>Decisions</Text>
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

              <View style={styles.cardSection}>
                <Text style={styles.cardSectionTitle}>Status</Text>
                <Text style={styles.cardSectionText}>
                  {event.data.status.charAt(0).toUpperCase() + event.data.status.slice(1)}
                </Text>
              </View>

              {event.data.question && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>Exploration Question</Text>
                  <Text style={styles.cardSectionText}>{event.data.question}</Text>
                </View>
              )}

              {event.data.buildItems && event.data.buildItems.length > 0 && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>Build</Text>
                  <Text style={styles.cardSectionText} numberOfLines={2}>
                    {event.data.buildItems.map((item: any) => item.text).join(', ')}
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

              {event.data.explorationDecisions && event.data.explorationDecisions.length > 0 && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>Decisions</Text>
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
    marginBottom: 4,
  },
  cardSectionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
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
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.divider,
  },
  decisionText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  decisionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
