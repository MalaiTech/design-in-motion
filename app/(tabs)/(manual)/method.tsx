
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors } from '@/styles/commonStyles';

export default function MethodScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>How Design in Motion Works</Text>
          
          <View style={styles.section}>
            <Text style={styles.paragraph}>
              Design in Motion is built around a structured yet flexible approach to creative development. 
              The method recognizes that good design emerges through cycles of exploration, reflection, and refinement.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.subheading}>Core Principles</Text>
            <View style={styles.principleItem}>
              <View style={styles.bullet} />
              <Text style={styles.principleText}>
                <Text style={styles.bold}>Learn before deciding:</Text> Gather insights and test assumptions before committing to solutions
              </Text>
            </View>
            <View style={styles.principleItem}>
              <View style={styles.bullet} />
              <Text style={styles.principleText}>
                <Text style={styles.bold}>Make thinking visible:</Text> Document your process, decisions, and rationale as you go
              </Text>
            </View>
            <View style={styles.principleItem}>
              <View style={styles.bullet} />
              <Text style={styles.principleText}>
                <Text style={styles.bold}>Iterate with purpose:</Text> Each exploration loop builds on previous learning
              </Text>
            </View>
            <View style={styles.principleItem}>
              <View style={styles.bullet} />
              <Text style={styles.principleText}>
                <Text style={styles.bold}>Structure supports creativity:</Text> Clear frameworks enable better exploration
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.subheading}>The Process Flow</Text>
            <Text style={styles.paragraph}>
              Projects move through distinct phases, each with specific goals and tools. You begin by framing the opportunity, 
              then cycle through exploration loops to test and learn, before moving into pilot development and final delivery.
            </Text>
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
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 32,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  principleItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingLeft: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text,
    marginTop: 9,
    marginRight: 12,
  },
  principleText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  bold: {
    fontWeight: '600',
    color: colors.text,
  },
  bottomSpacer: {
    height: 40,
  },
});
