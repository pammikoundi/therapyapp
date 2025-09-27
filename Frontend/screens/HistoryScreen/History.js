import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { HistoryStyles } from '../styles/AppStyles';

const HistoryScreen = ({ navigation }) => {
  const [chatSessions, setChatSessions] = useState([]);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = () => {
    // Mock data - replace with actual storage/API call
    const mockSessions = [
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
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMoodEmoji = (mood) => {
    const moodEmojis = {
      'Happy': '😊',
      'Reflective': '🤔',
      'Anxious': '😰',
      'Sad': '😔',
      'Calm': '😌',
    };
    return moodEmojis[mood] || '😐';
  };

  const renderChatSession = ({ item }) => (
    <TouchableOpacity
      style={HistoryStyles.sessionCard}
      onPress={() => viewSession(item)}
    >
      <View style={HistoryStyles.sessionThumbnail}>
        <Text style={HistoryStyles.thumbnailText}>{getMoodEmoji(item.mood)}</Text>
      </View>
      <View style={HistoryStyles.sessionDetails}>
        <Text style={HistoryStyles.sessionDate}>{formatDate(item.date)}</Text>
        <Text style={HistoryStyles.sessionSummary}>{item.summary}</Text>
        <Text style={HistoryStyles.sessionStats}>
          {item.messageCount} messages • {item.duration} • {item.mood}
        </Text>
      </View>
      <TouchableOpacity style={HistoryStyles.viewButton}>
        <Text style={HistoryStyles.viewButtonText}>View</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const viewSession = (session) => {
    // Handle viewing a specific chat session
    console.log('Viewing session:', session.id);
    // You could navigate to a detailed chat view here
  };

  return (
    <SafeAreaView style={HistoryStyles.container}>
      <View style={HistoryStyles.header}>
        <Text style={HistoryStyles.headerTitle}>Chat History</Text>
        <Text style={HistoryStyles.headerSubtitle}>Your conversations with Alex</Text>
      </View>

      {chatSessions.length > 0 ? (
        <FlatList
          data={chatSessions}
          renderItem={renderChatSession}
          keyExtractor={(item) => item.id}
          style={HistoryStyles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={HistoryStyles.emptyState}>
          <Text style={HistoryStyles.emptyStateText}>
            No conversations yet. Start chatting with Alex to see your history here!
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default HistoryScreen;