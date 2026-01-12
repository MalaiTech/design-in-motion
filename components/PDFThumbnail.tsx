
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface PDFThumbnailProps {
  uri: string;
  width: number;
  height: number;
}

export default function PDFThumbnail({ uri, width, height }: PDFThumbnailProps) {
  // Web fallback - show PDF icon placeholder
  return (
    <View style={[styles.container, { width, height }]}>
      <IconSymbol
        ios_icon_name="doc.text"
        android_material_icon_name="description"
        size={32}
        color={colors.textSecondary}
      />
      <Text style={styles.label}>PDF</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
