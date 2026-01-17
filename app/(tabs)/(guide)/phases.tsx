
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';

interface Phase {
  name: string;
  color: string;
  surface: string;
  focus: string;
  description: string;
}

const phases: Phase[] = [
  {
    name: 'Framing',
    color: '#1E4DD8',
    surface: '#EAF0FF',
    focus: 'Define the opportunity',
    description: 'Establish what you know, what you need to learn, and what questions will guide your exploration.',
  },
  {
    name: 'Exploration',
    color: '#F2C94C',
    surface: '#FFF6D8',
    focus: 'Test and learn',
    description: 'Run structured loops to explore possibilities, build prototypes, check assumptions, and adapt based on findings.',
  },
  {
    name: 'Pilot',
    color: '#555555',
    surface: '#EEF2F5',
    focus: 'Validate at scale',
    description: 'Test your solution in real conditions to confirm it works before full commitment.',
  },
  {
    name: 'Delivery',
    color: '#555555',
    surface: '#E6E6E6',
    focus: 'Prepare for launch',
    description: 'Finalize all elements and prepare for implementation or handoff.',
  },
  {
    name: 'Finish',
    color: '#D32F2F',
    surface: '#FDECEC',
    focus: 'Complete and reflect',
    description: 'Close the project, document outcomes, and capture learnings for future work.',
  },
];

export default function PhasesScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Phases',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>What to Focus on at Each Stage</Text>
          
          <Text style={styles.introText}>
            Each phase has a distinct purpose and set of activities. Move through them sequentially, 
            but feel free to return to earlier phases if new insights emerge.
          </Text>

          <View style={styles.phasesContainer}>
            {phases.map((phase, index) => (
              <React.Fragment key={phase.name}>
                <View style={[styles.phaseCard, { backgroundColor: phase.surface }]}>
                  <View style={styles.phaseHeader}>
                    <View style={[styles.phaseIndicator, { backgroundColor: phase.color }]} />
                    <Text style={styles.phaseName}>{phase.name}</Text>
                  </View>
                  <Text style={styles.phaseFocus}>{phase.focus}</Text>
                  <Text style={styles.phaseDescription}>{phase.description}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: 32,
    letterSpacing: 0.2,
  },
  phasesContainer: {
    gap: 16,
  },
  phaseCard: {
    padding: 20,
    borderRadius: 8,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  phaseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.3,
  },
  phaseFocus: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  phaseDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  bottomSpacer: {
    height: 40,
  },
});
