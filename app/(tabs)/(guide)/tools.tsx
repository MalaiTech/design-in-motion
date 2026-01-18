
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface Tool {
  name: string;
  description: string;
  details: string;
}

interface ToolCategory {
  title: string;
  tools: Tool[];
}

const toolCategories: ToolCategory[] = [
  {
    title: 'Thinking & Framing Tools',
    tools: [
      {
        name: 'Opportunity Origin',
        description: 'What triggered this project?',
        details: 'The opportunity origin captures what initiated the project. This might be a problem, an observation, a question, or an external signal.\n\nWriting this down anchors the work and prevents drifting away from the original intent.\n\nUse this before defining solutions or directions.',
      },
      {
        name: 'Purpose',
        description: 'What are we trying to achieve and for whom?',
        details: 'Purpose defines the intended outcome without describing how to achieve it.\n\nIt helps evaluate ideas and decisions later.\n\nKeep it short, human-centered, and focused on impact.',
      },
      {
        name: 'Known / Assumed / Unknown',
        description: 'What do we know, believe, or need to learn?',
        details: 'This tool separates facts from assumptions and open questions.\n\nIt reveals where exploration has the highest value.\n\nRevisit it as learning progresses.',
      },
      {
        name: 'Design Space & Constraints',
        description: 'What boundaries shape the work?',
        details: 'Design space and constraints describe conditions such as time, budget, technology, ethics, or context.\n\nConstraints focus exploration and prevent unrealistic directions.\n\nThey enable more meaningful creativity.',
      },
    ],
  },
  {
    title: 'Exploration & Learning Tools',
    tools: [
      {
        name: 'Exploration Questions',
        description: 'What do we need to learn next?',
        details: 'Exploration questions guide learning and focus effort.\n\nGood questions are open, specific, and centered on uncertainty.\n\nThey are not tasks or solution ideas.',
      },
      {
        name: 'Exploration Loops',
        description: 'Structured cycles for learning through exploration.',
        details: 'Exploration loops are contained learning cycles focused on one question at a time.\n\nThey support inquiry, testing, and reflection without forcing early commitment.\n\nThe goal is insight, not progress.',
      },
      {
        name: 'Artifacts',
        description: 'Material that makes thinking visible.',
        details: 'Artifacts include sketches, photos, notes, documents, references, or prototypes.\n\nThey externalize ideas and learning over time.\n\nArtifacts are learning material, not final deliverables.',
      },
    ],
  },
  {
    title: 'Decision & Reflection Tools',
    tools: [
      {
        name: 'Decisions Log',
        description: 'Document key choices with context and rationale',
        details: 'The Decisions Log captures why you made specific choices:\n\n• What was decided\n• Why it was decided\n• What alternatives were considered\n• Supporting artifacts\n\nDecisions are not just outcomes—they are learning moments. Documenting them helps you understand your process, communicate with stakeholders, and reflect on what worked.',
      },
      {
        name: 'Timeline',
        description: 'Visual history of your project evolution',
        details: 'The Timeline shows your project journey:\n\n• Phase changes and transitions\n• Exploration loops and their outcomes\n• Key decisions and when they were made\n• Artifacts created along the way\n\nThe timeline helps you see patterns, understand pacing, and communicate progress. It is a narrative tool that shows how learning accumulated over time.',
      },
      {
        name: 'Time & Cost Tracking',
        description: 'Track hours and expenses within each loop',
        details: 'Time and Cost Tracking helps you understand resource investment:\n\n• Log hours spent on each loop\n• Record costs and expenses\n• See totals across the project\n\nThis data supports realistic planning, helps justify decisions, and provides transparency for stakeholders. It is integrated into your PDF exports.',
      },
    ],
  },
  {
    title: 'Supporting Tools (Outside the App)',
    tools: [
      {
        name: 'PDF Export',
        description: 'Generate professional project reports',
        details: 'PDF Export creates formatted reports from your project data:\n\n• Executive Overview: Summary, phase, key decisions\n• Design Process: Framing, loops, and learning\n• Timeline: Visual history of your work\n• Costs: Time and expense breakdown\n\nExports are designed for stakeholder communication, documentation, and archiving. They translate your process into a clear narrative.',
      },
      {
        name: 'Sketching & Prototyping',
        description: 'External tools for building and testing',
        details: 'Design in Motion does not replace your design tools—it structures how you use them:\n\n• Sketch on paper or in Figma\n• Build prototypes in code or no-code tools\n• Test with users in person or remotely\n\nThe app captures artifacts and decisions from these activities. Your external tools remain your workspace; the app is your process layer.',
      },
      {
        name: 'Collaboration & Feedback',
        description: 'External channels for team input and critique',
        details: 'Collaboration happens outside the app:\n\n• Share artifacts via Files or iCloud\n• Discuss with your team in person or online\n• Gather feedback through your preferred channels\n\nThe app is designed for individual reflection and documentation. It supports collaboration by creating clear records you can share, but it is not a real-time collaboration platform.',
      },
    ],
  },
];

export default function ToolsScreen() {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  console.log('ToolsScreen rendered');

  const handleToggleTool = (categoryTitle: string, toolName: string) => {
    const key = `${categoryTitle}-${toolName}`;
    console.log('User tapped tool card:', toolName, 'in category:', categoryTitle);
    setExpandedTool(expandedTool === key ? null : key);
  };

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
          {toolCategories.map((category, categoryIndex) => (
            <React.Fragment key={category.title}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              
              <View style={styles.cardsContainer}>
                {category.tools.map((tool, toolIndex) => {
                  const key = `${category.title}-${tool.name}`;
                  const isExpanded = expandedTool === key;
                  
                  return (
                    <React.Fragment key={tool.name}>
                      <TouchableOpacity
                        style={styles.toolCard}
                        onPress={() => handleToggleTool(category.title, tool.name)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.toolHeader}>
                          <View style={styles.toolTextContainer}>
                            <Text style={styles.toolName}>{tool.name}</Text>
                            <Text style={styles.toolDescription}>{tool.description}</Text>
                          </View>
                          <IconSymbol
                            ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
                            android_material_icon_name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                            size={24}
                            color={colors.textSecondary}
                          />
                        </View>
                        
                        {isExpanded && (
                          <View style={styles.toolDetails}>
                            <Text style={styles.toolDetailsText}>{tool.details}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      
                      {toolIndex < category.tools.length - 1 && (
                        <View style={styles.cardDivider} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
              
              {categoryIndex < toolCategories.length - 1 && (
                <View style={styles.categorySpacer} />
              )}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  cardsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  toolCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  toolDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  toolDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  toolDetailsText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    letterSpacing: 0.1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  categorySpacer: {
    height: 32,
  },
  bottomSpacer: {
    height: 40,
  },
});
