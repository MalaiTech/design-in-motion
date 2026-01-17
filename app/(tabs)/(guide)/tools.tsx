
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface Tool {
  name: string;
  icon: string;
  description: string;
}

const tools: Tool[] = [
  {
    name: 'Design Framing',
    icon: 'crop-square',
    description: 'Map what you know, identify uncertainties, and define exploration questions that will guide your work.',
  },
  {
    name: 'Exploration Loops',
    icon: 'refresh',
    description: 'Structured cycles of Explore, Build, Check, and Adapt. Each loop generates learning and moves you forward.',
  },
  {
    name: 'Artifacts',
    icon: 'image',
    description: 'Capture photos, documents, and notes throughout your process. Mark favorites to highlight key moments.',
  },
  {
    name: 'Timeline',
    icon: 'timeline',
    description: 'Visual history of your project showing phase changes, decisions, and exploration loops over time.',
  },
  {
    name: 'Decisions Log',
    icon: 'check-circle',
    description: 'Document key decisions with context and rationale. Build a clear record of why you chose specific directions.',
  },
  {
    name: 'PDF Export',
    icon: 'description',
    description: 'Generate professional reports including executive overview, design process documentation, timeline, and costs.',
  },
];

export default function ToolsScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Tools',
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
          <Text style={styles.sectionTitle}>Practical Supports Inside the App</Text>
          
          <Text style={styles.introText}>
            These tools help you structure your thinking, document your process, and communicate your work effectively.
          </Text>

          <View style={styles.toolsContainer}>
            {tools.map((tool, index) => (
              <React.Fragment key={tool.name}>
                <View style={styles.toolCard}>
                  <View style={styles.toolHeader}>
                    <View style={styles.iconContainer}>
                      <IconSymbol
                        ios_icon_name={tool.icon}
                        android_material_icon_name={tool.icon}
                        size={24}
                        color={colors.text}
                      />
                    </View>
                    <Text style={styles.toolName}>{tool.name}</Text>
                  </View>
                  <Text style={styles.toolDescription}>{tool.description}</Text>
                </View>
                {index < tools.length - 1 && <View style={styles.divider} />}
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
  toolsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toolCard: {
    padding: 20,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
    flex: 1,
  },
  toolDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    letterSpacing: 0.1,
    marginLeft: 52,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 72,
  },
  bottomSpacer: {
    height: 40,
  },
});
