import { StyleSheet, Platform } from 'react-native';

// Unified color scheme (improved palette)
export const Colors = {
  primary: '#5B6CEA',    // soft indigo
  primaryLight: '#7F92F7',
  primaryDark: '#3946B1',
  accent: '#00BFA6',     // teal accent
  accentWarm: '#FF8A65', // warm orange
  success: '#4CAF50',
  warning: '#FFB74D',
  error: '#E53935',

  background: '#F6F8FF',
  backgroundCard: '#FFFFFF',
  surface: '#F2F4FF',

  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  muted: '#BDBFC9',
  border: '#E6E8FF',

  white: '#FFFFFF',
};

export const Typography = {
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,

  weightLight: '300',
  weightRegular: '400',
  weightMedium: '500',
  weightSemiBold: '600',
  weightBold: '700',
};

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
export const BorderRadius = { sm: 6, md: 10, lg: 16, full: 9999 };

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};

// Chat styles (merged)
export const ChatStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  welcomeTitle: { fontSize: 24, fontWeight: '700', color: Colors.primary, textAlign: 'center', marginBottom: 8 },
  welcomeSubtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },

  header: { paddingTop: 18, paddingHorizontal: 16, paddingBottom: 8, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 12, color: Colors.textSecondary },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.muted, marginRight: 8 },
  statusActive: { backgroundColor: Colors.success },
  endSessionButton: { position: 'absolute', right: 15, top: 15, backgroundColor: Colors.accentWarm, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  endSessionButtonText: { color: Colors.white, fontSize: 12, fontWeight: '600' },

  messagesContainer: { flex: 1 },
  messagesContent: { padding: 12, paddingBottom: 20 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 12, marginBottom: 10 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderRadius: 12 },
  aiMessage: { alignSelf: 'flex-start', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  messageText: { fontSize: 16, lineHeight: 20 },
  userMessageText: { color: Colors.white },
  aiMessageText: { color: Colors.textPrimary },
  messageTime: { fontSize: 10, color: Colors.textTertiary, marginTop: 6 },

  inputContainer: { padding: 12, backgroundColor: Colors.white },
  compactInputBar: { position: 'absolute', left: 0, right: 0, bottom: Platform.OS === 'ios' ? 20 : 10, alignItems: 'center', zIndex: 30 },
  compactInputBarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  inputTopRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingBottom: 8 },
  inputCloseButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F3F6FF', borderRadius: 8 },
  inputCloseButtonText: { color: Colors.textSecondary, fontWeight: '600' },

  textInputContainer: { flexDirection: 'row', alignItems: 'center' },
  textInput: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, backgroundColor: Colors.surface },
  sendButton: { marginLeft: 8, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  sendButtonDisabled: { backgroundColor: Colors.muted },
  sendButtonText: { color: Colors.white, fontWeight: '600' },

  audioControlsContainer: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  audioControlsCenter: { justifyContent: 'center' },
  micButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  micButtonActive: { backgroundColor: Colors.error },
  micButtonDisabled: { backgroundColor: Colors.muted },
  micButtonText: { fontSize: 28 },
  stopSpeechButton: { marginLeft: 12, backgroundColor: Colors.accentWarm, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  stopSpeechButtonText: { color: Colors.white },

  transcriptBubble: { opacity: 0.9 },
  transcriptText: { fontStyle: 'italic', color: Colors.textSecondary },

  openMessageButton: { marginLeft: 12, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 24, justifyContent: 'center' },
  openMessageButtonText: { color: Colors.white, fontWeight: '700' },
});

// History styles
export const HistoryStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 12, color: Colors.textSecondary },
  sessionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: 12, marginHorizontal: 12, marginVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  sessionThumbnail: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  thumbnailText: { fontSize: 20 },
  sessionDetails: { flex: 1 },
  sessionDate: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  sessionSummary: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  sessionStats: { fontSize: 12, color: Colors.textTertiary, marginTop: 6 },
  viewButton: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  viewButtonText: { color: Colors.white, fontWeight: '600' },
  list: { paddingTop: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  emptyStateText: { color: Colors.textSecondary },
  loadingContainer: { padding: 24 },
});

// Settings styles
export const SettingsStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  profileSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: 20, paddingVertical: 20, marginTop: 16, marginHorizontal: 16, borderRadius: BorderRadius.md, ...Shadows.small },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  profileEmail: { fontSize: 14, color: Colors.textSecondary },
  section: { marginTop: 24, marginHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, textTransform: 'uppercase' },
  settingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.border, minHeight: 60 },
  logoutButton: { backgroundColor: Colors.accentWarm, marginHorizontal: 16, marginTop: 32, marginBottom: 32, paddingVertical: 16, borderRadius: BorderRadius.md, alignItems: 'center', ...Shadows.small },
  logoutText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});

// Login styles
export const LoginStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  header: { marginBottom: Spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.xs },
  disclaimer: { fontSize: Typography.caption, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.lg },
});

// Statistics/Common styles re-export
export const StatisticsStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, backgroundColor: Colors.white },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  headerSubtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.xs },
  statsGrid: { padding: Spacing.lg, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
  statTitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: 6 },
});

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ChatStyles,
  HistoryStyles,
  SettingsStyles,
  LoginStyles,
  StatisticsStyles,
};
