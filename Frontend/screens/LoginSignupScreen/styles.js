import { StyleSheet } from 'react-native';

const Colors = {
  backgroundCard: '#FFFFFF',
  backgroundPrimary: '#F0F0F0',
  textPrimary: '#000000',
  textSecondary: '#666666',
  textLight: '#999999',
  primary: '#007AFF',
};

const Spacing = {
  lg: 16,
  md: 12,
  sm: 8,
  xs: 4,
};

const Typography = {
  body: 16,
  bodySmall: 14,
  caption: 12,
  weightSemiBold: '600',
};

export const LoginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: Typography.weightSemiBold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  disclaimer: {
    fontSize: Typography.caption,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});