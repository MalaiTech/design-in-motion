
import { StyleSheet } from 'react-native';

export const colors = {
  background: '#FAFAF7',
  text: '#111111',
  textSecondary: '#555555',
  divider: '#DDDDDD',
  primary: '#1d6a89',
  primaryButton: '#1d6a89',
  
  // Phase colors
  phaseFraming: '#1E4DD8',
  phaseExploration: '#F2C94C',
  phaseFinish: '#D32F2F',
  
  // Phase surfaces
  surfaceFraming: '#EAF0FF',
  surfaceExploration: '#FFF6D8',
  surfacePilot: '#EEF2F5',
  surfaceDelivery: '#E6E6E6',
  surfaceFinish: '#FDECEC',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  text: {
    fontSize: 16,
    color: colors.text,
  },
  textSecondary: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
