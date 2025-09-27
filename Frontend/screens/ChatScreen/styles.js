export const ChatStyles = StyleSheet.create({
  container: {
    ...CommonStyles.container,
  },
  header: {
    ...CommonStyles.header,
    alignItems: 'center',
  },
  headerTitle: {
    ...CommonStyles.headerTitle,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  messagesContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.light,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  messageText: {
    fontSize: Typography.body,
    lineHeight: 20,
  },
  userMessageText: {
    color: Colors.textWhite,
  },
  aiMessageText: {
    color: Colors.textPrimary,
  },
  messageTime: {
    fontSize: Typography.caption,
    marginTop: Spacing.xs,
  },
  userMessageTime: {
    color: Colors.textWhite,
    opacity: 0.8,
    textAlign: 'right',
  },
  aiMessageTime: {
    color: Colors.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundPrimary,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.borderMedium,
  },
  sendButtonText: {
    color: Colors.textWhite,
    fontWeight: Typography.weightSemiBold,
    fontSize: Typography.body,
  },
});