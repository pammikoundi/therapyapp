import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { HistoryStyles } from './styles';
import Config from '../../app/config';

const HistoryScreen = ({ navigation }) => {
  const [chatSessions, setChatSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`${Config.API_BASE}/history/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response received:', responseText);
        throw new Error('Server returned invalid response format');
      }
      
      const data = await response.json();

      // Backend returns { history: [ ... ] }
      const sessions = Array.isArray(data.history) ? data.history : [];

      const formattedSessions = sessions.map((s) => ({
        id: String(s.session_id),
        createdAt: s.created_at,
        date: s.created_at ? new Date(s.created_at) : new Date(),
        status: s.status,
        // placeholders for UI fields we don't have from backend
        // keep messageCount null when unknown so UI doesn't misleadingly show 0
        messageCount: typeof s.message_count === 'number' ? s.message_count : null,
        duration: s.duration || '',
        mood: s.mood || s.status || 'Unknown',
        summary: s.summary || `${s.status || ''}`,
      }));

      setChatSessions(formattedSessions);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      
      if (error.message.includes('invalid response format')) {
        Alert.alert('Server Error', 'The server is not responding correctly. Please contact support.');
      } else if (error.message.includes('Failed to fetch')) {
        Alert.alert('Connection Error', 'Unable to connect to the server. Please check your internet connection.');
      } else {
        Alert.alert('Error', 'Unable to load chat history. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
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

  const viewSession = async (session) => {
    try {
      setSessionLoading(true);
      // backend expects session_id query param
      const response = await fetch(`${Config.API_BASE}/history/session?session_id=${encodeURIComponent(session.id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Session API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON session response received:', responseText);
        throw new Error('Server returned invalid response format');
      }
      
      const sessionData = await response.json();

      // show session in modal instead of depending on navigation route
      setSelectedSession(sessionData);
      setModalVisible(true);
      // update messageCount in the list if we got history
      if (sessionData && Array.isArray(sessionData.history)) {
        setChatSessions((prev) =>
          prev.map((s) =>
            s.id === String(sessionData.session_id)
              ? { ...s, messageCount: sessionData.history.length }
              : s
          )
        );
      }
    } catch (error) {
      console.error('Failed to fetch session details:', error);
      
      if (error.message.includes('invalid response format')) {
        Alert.alert('Server Error', 'The server is not responding correctly for session details.');
      } else {
        Alert.alert('Error', 'Unable to load this session. Please try again.');
      }
    }
    finally {
      setSessionLoading(false);
    }
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
          {item.messageCount === null ? 'Tap to view' : `${item.messageCount} messages`}
          {item.duration ? ` • ${item.duration}` : ''}
          {item.mood ? ` • ${item.mood}` : ''}
        </Text>
      </View>
      <TouchableOpacity style={HistoryStyles.viewButton} onPress={() => viewSession(item)}>
        <Text style={HistoryStyles.viewButtonText}>View</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={HistoryStyles.container}>
      <View style={HistoryStyles.header}>
        <Text style={HistoryStyles.headerTitle}>Chat History</Text>
        <Text style={HistoryStyles.headerSubtitle}>Your conversations with Alex</Text>
      </View>

      {loading ? (
        <View style={HistoryStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#888" />
        </View>
      ) : chatSessions.length > 0 ? (
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

      {/* Session modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={HistoryStyles.container}>
          <View style={HistoryStyles.header}>
            <Text style={HistoryStyles.headerTitle}>Session</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[HistoryStyles.viewButtonText, { fontSize: 16 }]}>Close</Text>
            </TouchableOpacity>
          </View>

          {sessionLoading ? (
            <View style={HistoryStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#888" />
            </View>
          ) : selectedSession ? (
            <ScrollView style={{ padding: 16 }}>
              <Text style={{ marginBottom: 8, color: '#666' }}>
                Session ID: {selectedSession.session_id}
              </Text>
              <Text style={{ marginBottom: 12, fontWeight: '600' }}>
                Started: {new Date(selectedSession.created_at).toLocaleString()}
              </Text>

              {Array.isArray(selectedSession.history) && selectedSession.history.length > 0 ? (
                selectedSession.history.map((m, idx) => (
                  <View key={`${m.time || idx}`} style={{ marginBottom: 12 }}>
                    <Text style={{ fontWeight: '600' }}>{m.role}</Text>
                    <Text style={{ color: '#333', marginTop: 4 }}>{m.text}</Text>
                    <Text style={{ color: '#999', marginTop: 4, fontSize: 12 }}>{new Date(m.time).toLocaleString()}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: '#666' }}>No messages in this session.</Text>
              )}
            </ScrollView>
          ) : (
            <View style={HistoryStyles.emptyState}>
              <Text style={HistoryStyles.emptyStateText}>No session selected.</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default HistoryScreen;