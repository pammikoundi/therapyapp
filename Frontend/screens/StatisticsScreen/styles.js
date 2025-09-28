import { StyleSheet } from 'react-native';

const Colors = {
  backgroundCard: '#FFFFFF',
  backgroundPrimary: '#F9FAFB',
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
  sm: 8,
  xs: 4,
};

const Typography = {
  body: 16,
  bodySmall: 14,
  caption: 12,
  weightSemiBold: '600',
};

export const StatisticsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundCard,
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
  scrollView: {
    flex: 1,
  },
  statsGrid: {
    padding: Spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statTitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 20,
    fontWeight: Typography.weightSemiBold,
    color: Colors.textPrimary,
    marginTop: 6,
  },
  statSubtitle: {
    fontSize: Typography.caption,
    color: Colors.textLight,
    marginTop: 6,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.weightSemiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E6E6E6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  moodContainer: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  moodTrend: {
    fontSize: Typography.body,
    fontWeight: Typography.weightSemiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  moodDescription: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  moodCountsContainer: {
    marginTop: Spacing.md,
  },
  moodCountsTitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  moodCount: {
    fontSize: Typography.bodySmall,
    color: Colors.textPrimary,
  },
  moodScore: {
    marginTop: Spacing.sm,
    fontSize: Typography.bodySmall,
    color: Colors.textPrimary,
  },
  achievementsList: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  achievement: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  errorContainer: {
    margin: Spacing.md,
  },
  errorText: {
    fontSize: Typography.bodySmall,
    color: '#CC0000',
  },
});