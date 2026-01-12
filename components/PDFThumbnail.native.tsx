
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
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
  const [pdfSource, setPdfSource] = useState<any>(null);

  useEffect(() => {
    console.log('PDFThumbnail - Original URI:', uri);
    console.log('PDFThumbnail - Platform:', Platform.OS);
    
    // Prepare the PDF source with proper configuration
    let source: any;
    
    // Handle different URI formats
    if (uri.startsWith('content://')) {
      // Android content URI - use as is
      source = { 
        uri: uri, 
        cache: true 
      };
      console.log('PDFThumbnail - Using Android content URI');
    } else if (uri.startsWith('file://')) {
      // Already has file:// prefix
      source = { 
        uri: uri, 
        cache: true 
      };
      console.log('PDFThumbnail - Using file:// URI');
    } else if (uri.startsWith('/')) {
      // Absolute path without file:// prefix - add it
      const fileUri = `file://${uri}`;
      source = { 
        uri: fileUri, 
        cache: true 
      };
      console.log('PDFThumbnail - Converted to file:// URI:', fileUri);
    } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
      // Remote URL
      source = { 
        uri: uri, 
        cache: true 
      };
      console.log('PDFThumbnail - Using remote URL');
    } else {
      // Relative or other format - try as is
      source = { 
        uri: uri, 
        cache: true 
      };
      console.log('PDFThumbnail - Using URI as is');
    }
    
    console.log('PDFThumbnail - Final source:', JSON.stringify(source));
    setPdfSource(source);
  }, [uri]);

  const handleLoadComplete = (numberOfPages: number, filePath: string) => {
    console.log('✅ PDF loaded successfully');
    console.log('   - Pages:', numberOfPages);
    console.log('   - Path:', filePath);
    setLoading(false);
    setError(false);
  };

  const handleError = (err: any) => {
    console.error('❌ PDF loading error:', err);
    console.error('   - URI:', uri);
    console.error('   - Source:', JSON.stringify(pdfSource));
    setLoading(false);
    setError(true);
  };

  const handleLoadProgress = (percent: number) => {
    console.log('PDF loading progress:', percent.toFixed(0) + '%');
  };

  if (!pdfSource) {
    return (
      <View style={[styles.container, { width, height }]}>
        <ActivityIndicator size="small" color={colors.textSecondary} />
      </View>
    );
  }

  if (error) {
    // Show PDF icon placeholder on error
    return (
      <View style={[styles.container, { width, height }]}>
        <IconSymbol
          ios_icon_name="doc.text"
          android_material_icon_name="description"
          size={24}
          color={colors.textSecondary}
        />
        <Text style={styles.errorLabel}>PDF</Text>
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
        source={pdfSource}
        page={1}
        horizontal={false}
        enablePaging={false}
        onLoadComplete={handleLoadComplete}
        onError={handleError}
        onLoadProgress={handleLoadProgress}
        style={[styles.pdf, { width, height }]}
        trustAllCerts={false}
        spacing={0}
        fitPolicy={0}
        enableAntialiasing={true}
        renderActivityIndicator={() => <View />}
        enableRTL={false}
        minScale={1.0}
        maxScale={1.0}
        singlePage={true}
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
    position: 'relative',
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
  errorLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
