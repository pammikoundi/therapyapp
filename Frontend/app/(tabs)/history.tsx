import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

interface ChatSession {
  id: string;
  date: Date;
  messageCount: number;
  duration: string;
  mood: string;
  summary: string;
}

export default function HistoryScreen() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    // Mock data
    const mockSessions: ChatSession[] = [
      {
        id: '1',
        date: new Date(2024, 0, 15),
        messageCount: 12,
        duration: '15 min',
        mood: 'Reflective',
        summary: 'Discussed work stress and coping strategies'
      },
      {
        id: '2',
        date: new Date(2024, 0, 14),
        messageCount: 8,
        duration: '10 min',
        mood: 'Anxious',
        summary: 'Talked about upcoming presentation anxiety'
      },
      {
        id: '3',
        date: new Date(2024, 0, 13),
        messageCount: 15,
        duration: '20 min',
        mood: 'Happy',
        summary: 'Shared good news about family visit'
      },
    ];
    setChatSessions(mockSessions);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: Record<string, string> = {
      'Happy': '😊',
      'Reflective': '🤔',
      'Anxious': '😰',
      'Sad': '😔',
      'Calm': '😌',
    };
    return moodEmojis[mood] || '😐';
  };

  const renderChatSession = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      onPress={() => console.log('View session:', item.id)}
    >
      <View style={{
        width: 50,
        height: 50,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 24 }}>{getMoodEmoji(item.mood)}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#333333',
        }}>
          {formatDate(item.date)}
        </Text>
        <Text style={{
          fontSize: 14,
          color: '#666666',
          marginTop: 4,
        }}>
          {item.summary}
        </Text>
        <Text style={{
          fontSize: 12,
          color: '#999999',
          marginTop: 4,
        }}>
          {item.messageCount} messages • {item.duration} • {item.mood}
        </Text>
      </View>
      <TouchableOpacity style={{ justifyContent: 'center', paddingHorizontal: 12 }}>
        <Text style={{
          color: '#007AFF',
          fontSize: 14,
          fontWeight: '600',
        }}>
          View
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <View style={{
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#333333',
        }}>
          Chat History
        </Text>
        <Text style={{
          fontSize: 14,
          color: '#666666',
          marginTop: 4,
        }}>
          Your conversations with Alex
        </Text>
      </View>

      {chatSessions.length > 0 ? (
        <FlatList
          data={chatSessions}
          renderItem={renderChatSession}
          keyExtractor={(item) => item.id}
          style={{ flex: 1, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <Text style={{
            fontSize: 16,
            color: '#666666',
            textAlign: 'center',
          }}>
            No conversations yet. Start chatting with Alex to see your history here!
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}