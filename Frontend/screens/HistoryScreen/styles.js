import { StyleSheet } from 'react-native';

const Colors = {
  backgroundCard: '#FFFFFF',
  backgroundPrimary: '#F0F0F0',
  textPrimary: '#000000',
  textSecondary: '#666666',
  textLight: '#999999',
  primary: '#007AFF',
};

const BorderRadius = {
  lg: 12,
  md: 8,
};

const Spacing = {
  lg: 16,
  md: 12,
  xs: 4,
};

const Typography = {
  body: 16,
  bodySmall: 14,
  caption: 12,
  weightSemiBold: '600',
};

const Shadows = {
  medium: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.23)',
    elevation: 4,
  },
};

export const HistoryStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary || '#F5F5F5',
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundCard || '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: Typography.weightSemiBold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyStateText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  sessionThumbnail: {
    width: 50,
    height: 50,
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    fontSize: 24,
  },
  sessionDetails: {
    flex: 1,
    marginLeft: Spacing.lg,
    justifyContent: 'center',
  },
  sessionDate: {
    fontSize: Typography.body,
    fontWeight: Typography.weightSemiBold,
    color: Colors.textPrimary,
  },
  sessionSummary: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  sessionStats: {
    fontSize: Typography.caption,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  viewButton: {
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  viewButtonText: {
    color: Colors.primary,
    fontSize: Typography.bodySmall,
    fontWeight: Typography.weightSemiBold,
  },
});