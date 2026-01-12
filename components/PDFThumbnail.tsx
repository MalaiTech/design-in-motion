
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Pdf from 'react-native-pdf';

interface PDFThumbnailProps {
  uri: string;
  width: number;
  height: number;
}

export default function PDFThumbnail({ uri, width, height }: PDFThumbnailProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    console.log('PDFThumbnail rendering for URI:', uri);
  }, [uri]);

  const handleLoadComplete = () => {
    console.log('PDF loaded successfully');
    setLoading(false);
    setError(false);
  };

  const handleError = (err: any) => {
    console.error('PDF loading error:', err);
    setLoading(false);
    setError(true);
  };

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

  return (
    <View style={[styles.container, { width, height }]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
        </View>
      )}
      <Pdf
        source={{ uri }}
        page={1}
        horizontal={false}
        enablePaging={false}
        onLoadComplete={handleLoadComplete}
        onError={handleError}
        style={[styles.pdf, { width, height }]}
        trustAllCerts={false}
        spacing={0}
        fitPolicy={0}
        enableAntialiasing={true}
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
    overflow: 'hidden',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  pdf: {
    backgroundColor: '#FFFFFF',
  },
});
