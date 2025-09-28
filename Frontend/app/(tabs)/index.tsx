import LiveAudioChatScreen from '../../screens/ChatScreen/Chat';
import { useNavigation } from '@react-navigation/native';

// Serve the existing LiveAudioChatScreen at the root route '/'
export default function ChatRouteWrapper() {
  const navigation = useNavigation();
  // Pass navigation into the existing screen component
  // cast to any to avoid TypeScript prop inference issues
  return <LiveAudioChatScreen navigation={navigation as any} />;
}