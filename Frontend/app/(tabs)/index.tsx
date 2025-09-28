import LiveAudioChatScreen from '../../screens/ChatScreen/Chat';
import { useNavigation } from '@react-navigation/native';

export default function ChatRouteWrapper() {
  const navigation = useNavigation();
  return <LiveAudioChatScreen navigation={navigation as any} />;
}