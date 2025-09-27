const AudioChatStyles = {
  // Center container for session start
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },

  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },

  startSessionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  startSessionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Status indicators
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
    marginRight: 8,
  },

  statusActive: {
    backgroundColor: '#4CAF50',
  },

  endSessionButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },

  endSessionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Audio controls
  audioControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },

  micButtonActive: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
  },

  micButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    shadowColor: Colors.textSecondary,
  },

  micButtonText: {
    fontSize: 30,
  },

  stopSpeechButton: {
    marginLeft: 20,
    backgroundColor: '#FF9800',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },

  stopSpeechButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Transcript styles
  transcriptBubble: {
    opacity: 0.7,
    borderStyle: 'dashed',
  },

  transcriptText: {
    fontStyle: 'italic',
  },

  // Enhanced header
  header: {
    ...ChatStyles.header, // Extend existing header styles
    paddingBottom: 15,
  },

  headerTitle: {
    ...ChatStyles.headerTitle, // Extend existing title styles
    fontSize: 20,
  },

  headerSubtitle: {
    ...ChatStyles.headerSubtitle, // Extend existing subtitle styles
    fontSize: 14,
  },
};

// Merge with existing ChatStyles
const EnhancedChatStyles = {
  ...ChatStyles,
  ...AudioChatStyles,
};

export default EnhancedChatStyles;