
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
        name: 'Decisions',
        description: 'What was decided and why?',
        details: 'Decisions record conscious choices made at a specific moment.\n\nThey are traceable commitments, not final conclusions.\n\nRecording decisions prevents repeated debates.',
      },
      {
        name: 'Timeline',
        description: 'How the project evolved over time.',
        details: 'The timeline shows framing, exploration, artifacts, and decisions in sequence.\n\nIt reveals shifts, learning moments, and patterns.\n\nUse it to understand the story of the work.',
      },
    ],
  },
  {
    title: 'Supporting Tools (Outside the App)',
    tools: [
      {
        name: 'Sketching',
        description: 'Fast visual thinking.',
        details: 'Sketching helps explore ideas before they are fully formed.\n\nIts value lies in speed and openness, not quality.\n\nUse sketching early and often.',
      },
      {
        name: 'Prototyping',
        description: 'Testing assumptions through making.',
        details: 'Prototypes turn ideas into something that can be explored or tested.\n\nThey can be rough or incomplete.\n\nTheir purpose is learning, not validation.',
      },
      {
        name: 'Conversations',
        description: 'Learning through dialogue.',
        details: 'Conversations introduce perspectives you cannot generate alone.\n\nThey surface assumptions and blind spots.\n\nCapture insights as questions, not conclusions.',
      },
      {
        name: 'Reflection',
        description: 'Turning activity into insight.',
        details: 'Reflection makes sense of what was learned.\n\nWithout reflection, exploration remains activity without direction.\n\nUse it at the end of loops, phases, and projects.',
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
