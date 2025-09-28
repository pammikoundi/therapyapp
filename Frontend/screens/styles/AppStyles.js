import { StyleSheet } from 'react-native';
import { LoginStyles } from '../LoginSignupScreen/styles';

export const Colors = {
  primary: '#007AFF',
  textSecondary: '#666666',
  background: '#F5F5F5',
  border: '#E0E0E0',
  white: '#FFFFFF',
};

export const ChatStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  startSessionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  startSessionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.textSecondary, marginRight: 8 },
  statusActive: { backgroundColor: '#4CAF50' },
  endSessionButton: { position: 'absolute', right: 15, top: 15, backgroundColor: '#FF6B6B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  endSessionButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  messagesContainer: { flex: 1 },
  messagesContent: { padding: 12, paddingBottom: 20 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 12, marginBottom: 10 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  aiMessage: { alignSelf: 'flex-start', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  messageText: { fontSize: 16, lineHeight: 20 },
  userMessageText: { color: '#fff' },
  aiMessageText: { color: '#222' },
  messageTime: { fontSize: 10, color: Colors.textSecondary, marginTop: 6 },
  userMessageTime: { textAlign: 'right' },
  aiMessageTime: { textAlign: 'left' },

  inputContainer: { padding: 12, backgroundColor: Colors.white },
  textInputContainer: { flexDirection: 'row', alignItems: 'center' },
  textInput: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, backgroundColor: '#F5F5F5' },
  sendButton: { marginLeft: 8, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  sendButtonDisabled: { backgroundColor: '#CCC' },
  sendButtonText: { color: '#fff', fontWeight: '600' },

  // audio controls placeholders
  audioControlsContainer: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  micButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  micButtonActive: { backgroundColor: '#FF6B6B' },
  micButtonDisabled: { backgroundColor: Colors.textSecondary },
  micButtonText: { fontSize: 28 },
  stopSpeechButton: { marginLeft: 12, backgroundColor: '#FF9800', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  stopSpeechButtonText: { color: '#fff' },

  transcriptBubble: { opacity: 0.8 },
  transcriptText: { fontStyle: 'italic' },
});

export { LoginStyles };
export default ChatStyles;
