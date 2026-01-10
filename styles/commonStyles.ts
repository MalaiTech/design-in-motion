
import { StyleSheet } from 'react-native';

// Bauhaus Design System Colors
export const colors = {
  // Base colors
  background: '#FAFAF7',
  text: '#111111',
  textSecondary: '#555555',
  divider: '#DDDDDD',
  primaryButton: '#1d6a89',
  
  // Phase colors
  framingPrimary: '#1E4DD8',
  framingSurface: '#EAF0FF',
  
  explorationPrimary: '#F2C94C',
  explorationSurface: '#FFF6D8',
  
  pilotPrimary: '#6B7280',
  pilotSurface: '#EEF2F5',
  
  deliveryPrimary: '#4B5563',
  deliverySurface: '#E6E6E6',
  
  finishPrimary: '#D32F2F',
  finishSurface: '#FDECEC',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
  },
  textSecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    width: '100%',
  },
  button: {
    backgroundColor: colors.primaryButton,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 0, // Flat geometric Bauhaus style
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 0, // Flat geometric Bauhaus style
    padding: 16,
    marginBottom: 12,
  },
});
