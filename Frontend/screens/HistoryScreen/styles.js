export const HistoryStyles = StyleSheet.create({
  // ... (keep existing styles and add these)
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  sessionThumbnail: {
    width: 50,
    height: 50,
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
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