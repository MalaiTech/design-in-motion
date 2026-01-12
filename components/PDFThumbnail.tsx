
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface PDFThumbnailProps {
  uri: string;
  width: number;
  height: number;
}

export default function PDFThumbnail({ uri, width, height }: PDFThumbnailProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // For now, we'll show a placeholder since PDF rendering is complex
    // In a production app, you'd use a library like react-native-pdf or generate thumbnails on the backend
    setLoading(false);
  }, [uri]);

  if (loading) {
    return (
      <View style={[styles.container, { width, height }]}>
        <ActivityIndicator size="small" color={colors.textSecondary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { width, height }]}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle"
          android_material_icon_name="error"
          size={24}
          color={colors.textSecondary}
        />
      </View>
    );
  }

  // Show PDF icon placeholder
  // Note: Full PDF rendering would require additional native modules
  return (
    <View style={[styles.container, { width, height }]}>
      <IconSymbol
        ios_icon_name="doc.fill"
        android_material_icon_name="description"
        size={32}
        color={colors.textSecondary}
      />
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
  },
});
