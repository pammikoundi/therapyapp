import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { ChatStyles, Colors } from '../styles/AppStyles';

const LiveAudioChatScreen = ({ navigation }) => {
  // Session management
  const [sessionId, setSessionId] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  // Audio states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Messages and UI
  const [messages, setMessages] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const scrollViewRef = useRef(null);
  
  // Animation for microphone button
  const micAnimation = useRef(new Animated.Value(1)).current;

  // Initialize TTS and Voice Recognition
  useEffect(() => {
    initializeTTS();
    initializeVoice();
    
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      Tts.stop();
    };
  }, []);

  const initializeTTS = async () => {
    try {
      // Configure TTS settings
      await Tts.setDefaultLanguage('en-US');
      await Tts.setDefaultRate(0.5);
      await Tts.setDefaultPitch(1.0);
      
      // Set up TTS event listeners
      Tts.addEventListener('tts-start', () => setIsSpeaking(true));
      Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
      Tts.addEventListener('tts-cancel', () => setIsSpeaking(false));
    } catch (error) {
      console.error('TTS initialization error:', error);
    }
  };

  const initializeVoice = async () => {
    try {
      // Set up Voice recognition event listeners
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
      Voice.onSpeechError = onSpeechError;
    } catch (error) {
      console.error('Voice initialization error:', error);
    }
  };

  // Voice Recognition Event Handlers
  const onSpeechStart = () => {
    setIsListening(true);
    animateMicrophone();
  };

  const onSpeechEnd = () => {
    setIsListening(false);
    stopMicrophoneAnimation();
  };

  const onSpeechResults = (event) => {
    if (event.value && event.value.length > 0) {
      const transcript = event.value[0];
      setCurrentTranscript(transcript);
      handleUserMessage(transcript);
    }
  };

  const onSpeechPartialResults = (event) => {
    if (event.value && event.value.length > 0) {
      setCurrentTranscript(event.value[0]);
    }
  };

  const onSpeechError = (error) => {
    console.error('Speech recognition error:', error);
    setIsListening(false);
    stopMicrophoneAnimation();
    Alert.alert('Speech Recognition Error', 'Please try speaking again.');
  };

  // Animation functions
  const animateMicrophone = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(micAnimation, {
          toValue: 1.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(micAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopMicrophoneAnimation = () => {
    micAnimation.stopAnimation();
    micAnimation.setValue(1);
  };

  // Session Management
  const startSession = async () => {
    try {
      const response = await fetch('/session/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`, // You'll need to pass this from auth
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (data.session_id) {
        setSessionId(data.session_id);
        setIsSessionActive(true);
        
        // Add welcome message
        const welcomeMessage = {
          id: '1',
          text: "Hello! I'm Alex, your AI therapy companion. I'm here to listen and support you. How are you feeling today?",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        
        // Speak welcome message
        await speakMessage(welcomeMessage.text);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      Alert.alert('Connection Error', 'Unable to start therapy session. Please try again.');
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    
    try {
      setIsProcessing(true);
      const response = await fetch(`/session/close?session_id=${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setIsSessionActive(false);
      setSessionId(null);
      
      // Show session summary if available
      if (data.summary) {
        Alert.alert(
          'Session Complete', 
          `Thank you for sharing. Here's a brief summary: ${data.summary.substring(0, 100)}...`
        );
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Message Handling
  const handleUserMessage = async (text) => {
    if (!sessionId || !text.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentTranscript('');
    setIsProcessing(true);

    try {
      // Send message to backend
      await fetch('/session/message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          text: text,
          role: 'user'
        }),
      });

      // Generate AI response
      const response = await fetch(`/session/generate-question?session_id=${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.response) {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Save AI response to backend
        await fetch('/session/message', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            text: data.response,
            role: 'generated'
          }),
        });

        // Speak AI response
        await speakMessage(data.response);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      Alert.alert('Processing Error', 'Unable to process your message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Audio Functions
  const speakMessage = async (text) => {
    try {
      await Tts.speak(text);
    } catch (error) {
      console.error('TTS error:', error);
    }
  };

  const startListening = async () => {
    if (isSpeaking) {
      await Tts.stop();
    }
    
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      Alert.alert('Microphone Error', 'Unable to access microphone. Please check permissions.');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // UI Helper Functions
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const MessageBubble = ({ message }) => (
    <View style={[
      ChatStyles.messageBubble,
      message.isUser ? ChatStyles.userMessage : ChatStyles.aiMessage
    ]}>
      <Text style={[
        ChatStyles.messageText,
        message.isUser ? ChatStyles.userMessageText : ChatStyles.aiMessageText
      ]}>
        {message.text}
      </Text>
      <Text style={[
        ChatStyles.messageTime,
        message.isUser ? ChatStyles.userMessageTime : ChatStyles.aiMessageTime
      ]}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );

  // Render different states
  if (!isSessionActive) {
    return (
      <SafeAreaView style={ChatStyles.container}>
        <View style={ChatStyles.centerContainer}>
          <Text style={ChatStyles.welcomeTitle}>AI Therapy Session</Text>
          <Text style={ChatStyles.welcomeSubtitle}>
            Start a live audio conversation with Alex, your AI therapist
          </Text>
          <TouchableOpacity 
            style={ChatStyles.startSessionButton}
            onPress={startSession}
          >
            <Text style={ChatStyles.startSessionButtonText}>Start Session</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={ChatStyles.container}>
      <View style={ChatStyles.header}>
        <Text style={ChatStyles.headerTitle}>Live Session with Alex</Text>
        <View style={ChatStyles.statusContainer}>
          <View style={[
            ChatStyles.statusIndicator, 
            isSessionActive && ChatStyles.statusActive
          ]} />
          <Text style={ChatStyles.headerSubtitle}>
            {isSpeaking ? 'Alex is speaking...' : 
             isListening ? 'Listening...' :
             isProcessing ? 'Processing...' : 'Tap mic to speak'}
          </Text>
        </View>
        <TouchableOpacity 
          style={ChatStyles.endSessionButton}
          onPress={endSession}
          disabled={isProcessing}
        >
          <Text style={ChatStyles.endSessionButtonText}>End Session</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={ChatStyles.messagesContainer}
          contentContainerStyle={ChatStyles.messagesContent}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {currentTranscript && (
            <View style={[ChatStyles.messageBubble, ChatStyles.userMessage, ChatStyles.transcriptBubble]}>
              <Text style={[ChatStyles.messageText, ChatStyles.userMessageText, ChatStyles.transcriptText]}>
                {currentTranscript}
              </Text>
            </View>
          )}
          
          {isProcessing && (
            <View style={[ChatStyles.messageBubble, ChatStyles.aiMessage]}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={[ChatStyles.messageText, ChatStyles.aiMessageText]}>
                Alex is thinking...
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={ChatStyles.audioControlsContainer}>
          <Animated.View style={{ transform: [{ scale: micAnimation }] }}>
            <TouchableOpacity 
              style={[
                ChatStyles.micButton,
                isListening && ChatStyles.micButtonActive,
                (isSpeaking || isProcessing) && ChatStyles.micButtonDisabled
              ]}
              onPress={toggleListening}
              disabled={isSpeaking || isProcessing}
            >
              <Text style={ChatStyles.micButtonText}>
                {isListening ? '🎤' : '🎙️'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          
          {isSpeaking && (
            <TouchableOpacity 
              style={ChatStyles.stopSpeechButton}
              onPress={() => Tts.stop()}
            >
              <Text style={ChatStyles.stopSpeechButtonText}>⏹️ Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LiveAudioChatScreen;