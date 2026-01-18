
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
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
    focus: 'Understanding before solving.',
    description: 'Framing is about clarifying intent, context, and uncertainty. Use exploration loops to test assumptions, gather understanding what you do not know, and refine the questions that matter most.\n\nAt this stage, exploration is lightweight and reflective. You are learning what to explore, not what to build.',
  },
  {
    name: 'Exploration',
    color: '#F2C94C',
    surface: '#FFF6D8',
    focus: 'Learning through deliberate inquiry',
    description: 'Exploration is where loops become central. Each loop is a focused cycle of questioning, experimenting, and reflecting to continue learn and develop the project.\n\nUse loops to explore multiple directions without committing. The goal is not progress, but insight.',
  },
  {
    name: 'Pilot',
    color: '#555555',
    surface: '#EEF2F5',
    focus: 'Testing your designs under realistic conditions',
    description: 'In Pilot, exploration loops become more constrained. You use them to validate whether a direction holds up when exposed to real-world constraints.\n\nThe work shifts from "what could be" to "does this still make sense" when tested.',
  },
  {
    name: 'Delivery',
    color: '#555555',
    surface: '#E6E6E6',
    focus: 'Commitment to prepare for launch',
    description: 'Delivery turns validated learning into real outcomes. Exploration loops may still occur, but they are smaller and more targeted to finalize all elements and prepare for implementation and handoff.\n\nAt this stage, loops help refine decisions and final deliverables rather than question direction. Learning supports execution, instead of delaying it.',
  },
  {
    name: 'Finish',
    color: '#D32F2F',
    surface: '#FDECEC',
    focus: 'Complete and reflect',
    description: 'We consolidate what was learned across all phases. Exploration loops are no longer forward-looking, but reflective.\n\nUse this phase to capture insights, document decisions, and make learning transferable to future projects.',
  },
];

export default function PhasesScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>What to Focus on at Each Stage</Text>
          
          <Text style={styles.introText}>
            Design in Motion is not a linear process. While projects move through phases, exploration loops remain the core engine throughout. Each phase gives you a different focus.{'\n\n'}Exploration loops help you learn, test assumptions, and reflect at every stage — from early framing to final delivery.
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
