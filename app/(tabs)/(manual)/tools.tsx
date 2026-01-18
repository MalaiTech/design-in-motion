
import { IconSymbol } from '@/components/IconSymbol';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { colors } from '@/styles/commonStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Tool {
  name: string;
  description: string;
  details: string;
}

interface ToolCategory {
  title: string;
  tools: Tool[];
}

interface ToolCardProps {
  tool: Tool;
  categoryTitle: string;
  isExpanded: boolean;
  onToggle: () => void;
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
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  toolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  toolHeaderContent: {
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
    color: colors.textSecondary,
    lineHeight: 20,
  },
  toolDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  toolDetailsText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  bottomSpacer: {
    height: 40,
  },
});

const ToolCard: React.FC<ToolCardProps> = ({ tool, categoryTitle, isExpanded, onToggle }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, fadeAnim, tool.name]);

  const handleToggle = () => {
    console.log(`User toggled ${tool.name} in ${categoryTitle}`);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <View style={styles.toolCard}>
      <TouchableOpacity
        style={styles.toolHeader}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={styles.toolHeaderContent}>
          <Text style={styles.toolName}>{tool.name}</Text>
          <Text style={styles.toolDescription}>{tool.description}</Text>
        </View>
        <IconSymbol
          ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
          android_material_icon_name={isExpanded ? 'expand-less' : 'expand-more'}
          size={24}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <Animated.View style={[styles.toolDetails, { opacity: fadeAnim }]}>
          <Text style={styles.toolDetailsText}>{tool.details}</Text>
        </Animated.View>
      )}
    </View>
  );
};

export default function ToolsScreen() {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const handleToggleTool = (categoryTitle: string, toolName: string) => {
    const toolKey = `${categoryTitle}-${toolName}`;
    setExpandedTool(expandedTool === toolKey ? null : toolKey);
  };

  const toolCategories: ToolCategory[] = [
    {
      title: 'Thinking & Framing Tools',
      tools: [
        {
          name: 'Certainty Mapping',
          description: 'Separate what you know from what you need to learn',
          details: 'Certainty Mapping helps you distinguish between facts, assumptions, and unknowns. By categorizing information into "What we know," "What we think," and "What we need to learn," you can identify gaps in understanding and prioritize exploration efforts. This tool prevents premature decisions and ensures you are building on solid ground.',
        },
        {
          name: 'Design Space Definition',
          description: 'Define boundaries and possibilities for exploration',
          details: 'Design Space Definition establishes the scope and constraints of your project. It helps you articulate what is in scope, what is out of scope, and what areas are open for exploration. This tool creates clarity around the problem space and prevents scope creep while maintaining creative freedom within defined boundaries.',
        },
        {
          name: 'Exploration Questions',
          description: 'Frame questions that guide meaningful inquiry',
          details: 'Exploration Questions are carefully crafted inquiries that drive your investigation. Good questions are specific, actionable, and focused on learning rather than confirming assumptions. This tool helps you move from vague curiosity to targeted exploration, ensuring each loop has clear learning objectives.',
        },
      ],
    },
    {
      title: 'Exploration & Learning Tools',
      tools: [
        {
          name: 'Exploration Loops (EBCA)',
          description: 'Structured cycles of learning and reflection',
          details: 'Exploration Loops follow the EBCA framework: Explore (gather information), Build (create prototypes or tests), Check (evaluate results), and Adapt (refine understanding). Each loop is a complete cycle of inquiry that builds on previous learning. Loops can be quick sketches or extended investigations, depending on what you need to learn.',
        },
        {
          name: 'Artifact Collection',
          description: 'Capture and organize visual evidence of your process',
          details: 'Artifact Collection involves gathering photos, sketches, documents, and other materials that document your exploration. These artifacts serve as evidence of your thinking, support decision-making, and create a visual narrative of your project. The app helps you organize artifacts by phase, loop, or decision point.',
        },
        {
          name: 'Next Questions',
          description: 'Identify what to explore in the next loop',
          details: 'Next Questions emerge from completed exploration loops. After checking results and adapting your understanding, you identify new questions that need investigation. This tool ensures continuous learning and helps you plan subsequent loops based on what you have discovered.',
        },
      ],
    },
    {
      title: 'Decision & Reflection Tools',
      tools: [
        {
          name: 'Decision Documentation',
          description: 'Record choices and their rationale',
          details: 'Decision Documentation captures what you decided, why you decided it, and what alternatives you considered. This creates a decision trail that can be reviewed later and helps communicate your reasoning to stakeholders. The app prompts you to document decisions at key moments in the process.',
        },
        {
          name: 'Timeline View',
          description: 'See your project evolution over time',
          details: 'Timeline View provides a chronological overview of your project, showing phase changes, exploration loops, decisions, and key artifacts. This temporal perspective helps you understand how your thinking evolved and identify patterns in your process. It is valuable for reflection and for explaining your journey to others.',
        },
        {
          name: 'Time & Cost Tracking',
          description: 'Monitor resources invested in exploration',
          details: 'Time & Cost Tracking helps you understand the investment required for different types of exploration. By logging hours and expenses per loop, you can make informed decisions about how much exploration is appropriate and communicate the value of learning to stakeholders.',
        },
      ],
    },
    {
      title: 'Supporting Tools (Outside the App)',
      tools: [
        {
          name: 'Sketching & Prototyping',
          description: 'Create quick representations of ideas',
          details: 'Use paper, digital tools, or physical materials to quickly externalize ideas. Sketches and prototypes are thinking tools that help you explore possibilities and communicate concepts. Capture these as artifacts in the app to document your exploration.',
        },
        {
          name: 'User Research',
          description: 'Gather insights from people who will use your design',
          details: 'Conduct interviews, observations, or usability tests to understand user needs and validate assumptions. Document findings as artifacts and use them to inform exploration questions and decisions. The app helps you organize research materials by loop or phase.',
        },
        {
          name: 'Collaborative Workshops',
          description: 'Engage stakeholders in exploration activities',
          details: 'Run workshops to align on framing, generate ideas, or evaluate options. Use the app to prepare workshop materials and document outcomes. Collaborative exploration often surfaces insights that individual work misses.',
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Practical Supports Inside the App</Text>
          
          <Text style={styles.introText}>
            Design in Motion provides structured tools to support your exploration process. Each tool serves a specific purpose in helping you frame problems, conduct exploration loops, and document decisions.
          </Text>

          {toolCategories.map((category, categoryIndex) => (
            <View key={categoryIndex} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              {category.tools.map((tool, toolIndex) => (
                <ToolCard
                  key={toolIndex}
                  tool={tool}
                  categoryTitle={category.title}
                  isExpanded={expandedTool === `${category.title}-${tool.name}`}
                  onToggle={() => handleToggleTool(category.title, tool.name)}
                />
              ))}
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}
