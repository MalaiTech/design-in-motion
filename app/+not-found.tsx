
import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Page Not Found',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }} 
      />
      <View style={styles.container}>
        <IconSymbol 
          ios_icon_name="exclamationmark.triangle" 
          android_material_icon_name="warning" 
          size={64} 
          color={colors.secondary} 
        />
        
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.description}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        
        <Link href="/" style={styles.link}>
          <View style={styles.linkButton}>
            <IconSymbol 
              ios_icon_name="house.fill" 
              android_material_icon_name="home" 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.linkText}>Return to Projects</Text>
          </View>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  link: {
    marginTop: 16,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
