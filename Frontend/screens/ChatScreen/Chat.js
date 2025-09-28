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
  TextInput,
} from 'react-native';
import { ChatStyles, Colors } from '../styles/AppStyles';

const LiveAudioChatScreen = ({ navigation }) => {
  // Configuration
  const API_BASE_URL = 'https://therapyapp-backend-82022078425.us-central1.run.app';
  const userToken = 'authorization'; // Replace with actual token or remove if not needed
  
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
  const [textInput, setTextInput] = useState('');
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const scrollViewRef = useRef(null);
  const sessionCreatingRef = useRef(false);
  
  // Animation for microphone button
  const micAnimation = useRef(new Animated.Value(1)).current;
  const ttsRef = useRef(null);
  const ttsHandlersRef = useRef({});
  const webRecognitionRef = useRef(null);
  const webUtteranceRef = useRef(null);
  const voiceRef = useRef(null);
  const isWeb = Platform.OS === 'web';

  // Initialize TTS and Voice Recognition
  useEffect(() => {
    // Web platform: use Web Speech API for STT and TTS
    if (isWeb) {
      // Nothing synchronous needed here; initializeVoice will set up recognition instance
      initializeVoice();

      return () => {
        // cleanup web recognition
        try {
          const rec = webRecognitionRef.current;
          if (rec && rec.stop) {
            rec.stop();
          }
        } catch (e) {}

        try {
          // stop any speaking
          if (window && window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
        } catch (e) {}
      };
    }

    // Native platforms: try to require react-native-tts dynamically to avoid web bundling issues
    try {
      // eslint-disable-next-line global-require, import/no-extraneous-dependencies
      // only require on non-web platforms
      const NativeTts = require('react-native-tts');
      ttsRef.current = NativeTts;

      // load native voice module dynamically
      try {
        // eslint-disable-next-line global-require
        const NativeVoice = require('@react-native-voice/voice');
        voiceRef.current = NativeVoice;
      } catch (e) {
        console.log('Native voice module not available:', e);
        voiceRef.current = null;
      }

      const onTtsStart = () => setIsSpeaking(true);
      const onTtsFinish = () => setIsSpeaking(false);
      const onTtsCancel = () => setIsSpeaking(false);

      ttsHandlersRef.current = { onTtsStart, onTtsFinish, onTtsCancel };

      NativeTts.getInitStatus && NativeTts.getInitStatus()
        .then(() => {
          try {
            NativeTts.setDefaultLanguage && NativeTts.setDefaultLanguage('en-US');
            NativeTts.setDefaultRate && NativeTts.setDefaultRate(0.5);
            NativeTts.setDefaultPitch && NativeTts.setDefaultPitch(1.0);
          } catch (e) {
            console.log('TTS config failed', e);
          }
        })
        .catch((err) => console.log('TTS getInitStatus failed', err));

      NativeTts.addEventListener && NativeTts.addEventListener('tts-start', onTtsStart);
      NativeTts.addEventListener && NativeTts.addEventListener('tts-finish', onTtsFinish);
      NativeTts.addEventListener && NativeTts.addEventListener('tts-cancel', onTtsCancel);
    } catch (error) {
      console.log('Native TTS unavailable:', error);
      ttsRef.current = null;
    }

  // Initialize voice for native path
  initializeVoice();

    return () => {
      // Cleanup native Voice listeners if loaded
      try {
        const V = voiceRef.current;
        if (V && V.destroy) {
          V.destroy().then(() => {
            V.removeAllListeners && V.removeAllListeners();
          });
        }
      } catch (e) {
        // ignore
      }

      // Cleanup native TTS listeners and stop speaking
      try {
        const handlers = ttsHandlersRef.current || {};
        const NativeTts = ttsRef.current;
        if (NativeTts) {
          handlers.onTtsStart && NativeTts.removeEventListener && NativeTts.removeEventListener('tts-start', handlers.onTtsStart);
          handlers.onTtsFinish && NativeTts.removeEventListener && NativeTts.removeEventListener('tts-finish', handlers.onTtsFinish);
          handlers.onTtsCancel && NativeTts.removeEventListener && NativeTts.removeEventListener('tts-cancel', handlers.onTtsCancel);
          NativeTts.stop && NativeTts.stop();
        }
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, []);

  const initializeVoice = async () => {
    try {
      // Set up native Voice recognition event listeners if available
      const V = voiceRef.current;
      if (V) {
        V.onSpeechStart = onSpeechStart;
        V.onSpeechEnd = onSpeechEnd;
        V.onSpeechResults = onSpeechResults;
        V.onSpeechPartialResults = onSpeechPartialResults;
        V.onSpeechError = onSpeechError;
      }
    } catch (error) {
      console.error('Voice initialization error:', error);
    }
  };

  // Voice Recognition Event Handlers
  const onSpeechStart = () => {
    setIsListening(true);
    animateMicrophone();
    // frontend STT handled by react-native-voice (onSpeechResults/onSpeechPartialResults)
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
  const startSession = async (showWelcome = true) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`${API_BASE_URL}/session/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Session started:', data);
      
      if (data.session_id) {
        setSessionId(data.session_id);
        setIsSessionActive(true);

        // Optionally add welcome message (only when user explicitly starts session)
        if (showWelcome) {
          const welcomeMessage = {
            id: '1',
            text: "Hello! I'm Alex, companion. I'm here to listen and support you. What would you like to talk about today?",
            isUser: false,
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);

          // Speak welcome message if TTS is available
          try {
            await speakMessage(welcomeMessage.text);
          } catch (error) {
            console.log('TTS not available, continuing without audio');
          }
        }
      }
    } catch (error) {
      console.error('Error starting session:', error);
      Alert.alert('Connection Error', `Unable to start therapy session: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    
    try {
      setIsProcessing(true);
      const response = await fetch(`${API_BASE_URL}/session/close?session_id=${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Session ended:', data);
        
        // Show session summary if available
        if (data.summary) {
          Alert.alert(
            'Session Complete', 
            `Thank you for sharing. Here's a brief summary: ${data.summary.substring(0, 100)}...`
          );
        }
      }
      
      setIsSessionActive(false);
      setSessionId(null);
      navigation.goBack();
    } catch (error) {
      console.error('Error ending session:', error);
      Alert.alert('Error', 'There was an issue ending the session, but it will be closed automatically.');
      navigation.goBack();
    } finally {
      setIsProcessing(false);
    }
  };

  // Message Handling
  const handleUserMessage = async (text) => {
    if (!text || !text.trim()) return;

    // Ensure a session exists; lazily create on first message (without welcome TTS)
    if (!sessionId) {
      if (!sessionCreatingRef.current) {
        sessionCreatingRef.current = true;
        try {
          await startSession(false);
        } finally {
          sessionCreatingRef.current = false;
        }
      } else {
        // wait briefly for other create to finish
        let attempts = 0;
        while (!sessionId && attempts < 20) {
          // wait 200ms
          // eslint-disable-next-line no-await-in-loop
          await new Promise((res) => setTimeout(res, 200));
          attempts += 1;
        }
      }

      if (!sessionId) {
        Alert.alert('Connection Error', 'Unable to initialize session. Please try again.');
        return;
      }
    }

    const userMessage = {
      id: Date.now().toString(),
      text: text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentTranscript('');
    setTextInput('');
    setIsProcessing(true);

    try {
      // Send user message to backend
      const messageResponse = await fetch(`${API_BASE_URL}/session/message`, {
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

      if (!messageResponse.ok) {
        throw new Error(`Failed to save message: ${messageResponse.status}`);
      }

      const messageData = await messageResponse.json();
      console.log('Message saved:', messageData);

      // Generate AI response
      const aiResponse = await fetch(`${API_BASE_URL}/session/generate-question?session_id=${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!aiResponse.ok) {
        throw new Error(`Failed to generate response: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      console.log('AI response:', aiData);
      
      if (aiData.response) {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: aiData.response,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);

        // Speak AI response if TTS is available
        try {
          await speakMessage(aiData.response);
        } catch (error) {
          console.log('TTS not available for AI response');
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      Alert.alert('Processing Error', `Unable to process your message: ${error.message}`);
      
      // Add error message to chat
      const errorMessage = {
        id: (Date.now() + 2).toString(),
        text: "I'm sorry, I'm having trouble responding right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Audio Functions
  // Updated speakMessage function with better error handling and debugging
const speakMessage = async (text) => {
  try {
    console.log('Attempting to speak:', text); // Debug log
    
    if (isWeb) {
      try {
        if (window && window.speechSynthesis) {
          // Cancel any existing speech
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'en-US';
          utterance.rate = 0.8; // Slightly slower for better clarity
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          utterance.onstart = () => {
            console.log('Web TTS started');
            setIsSpeaking(true);
          };
          
          utterance.onend = () => {
            console.log('Web TTS ended');
            setIsSpeaking(false);
          };
          
          utterance.onerror = (error) => {
            console.log('Web TTS error:', error);
            setIsSpeaking(false);
          };
          
          webUtteranceRef.current = utterance;
          window.speechSynthesis.speak(utterance);
          console.log('Web TTS initiated');
          return;
        } else {
          console.log('Web Speech Synthesis not available');
        }
      } catch (e) {
        console.log('Web TTS failed:', e);
      }
      return;
    }

    // Native platforms
    if (ttsRef.current && ttsRef.current.speak) {
      console.log('Using native TTS');
      await ttsRef.current.speak(text);
    } else {
      console.log('Native TTS not available');
      // Fallback: show alert that TTS is not available
      Alert.alert('TTS Not Available', 'Text-to-speech is not available on this device.');
    }
  } catch (error) {
    console.error('TTS error:', error);
    // Don't throw error, just log it so the app continues working
    Alert.alert('TTS Error', 'Unable to speak the message, but you can still read it.');
  }
};

// Add a manual TTS test function (you can call this to test TTS)
const testTTS = () => {
  speakMessage("Hello, this is Alex testing text to speech functionality.");
};

// Enhanced TTS initialization for native platforms
useEffect(() => {
  // Web platform: use Web Speech API for STT and TTS
  if (isWeb) {
    initializeVoice();
    
    // Test if Web Speech Synthesis is available
    if (window && window.speechSynthesis) {
      console.log('Web Speech Synthesis is available');
    } else {
      console.log('Web Speech Synthesis is NOT available');
    }

    return () => {
      try {
        const rec = webRecognitionRef.current;
        if (rec && rec.stop) {
          rec.stop();
        }
      } catch (e) {}

      try {
        if (window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {}
    };
  }

  // Native platforms: try to require react-native-tts dynamically
  try {
    const NativeTts = require('react-native-tts');
    ttsRef.current = NativeTts;
    console.log('Native TTS loaded successfully');

    // Load native voice module dynamically
    try {
      const NativeVoice = require('@react-native-voice/voice');
      voiceRef.current = NativeVoice;
      console.log('Native Voice loaded successfully');
    } catch (e) {
      console.log('Native voice module not available:', e);
      voiceRef.current = null;
    }

    const onTtsStart = () => {
      console.log('Native TTS started');
      setIsSpeaking(true);
    };
    const onTtsFinish = () => {
      console.log('Native TTS finished');
      setIsSpeaking(false);
    };
    const onTtsCancel = () => {
      console.log('Native TTS cancelled');
      setIsSpeaking(false);
    };

    ttsHandlersRef.current = { onTtsStart, onTtsFinish, onTtsCancel };

    NativeTts.getInitStatus && NativeTts.getInitStatus()
      .then(() => {
        console.log('Native TTS initialized successfully');
        try {
          NativeTts.setDefaultLanguage && NativeTts.setDefaultLanguage('en-US');
          NativeTts.setDefaultRate && NativeTts.setDefaultRate(0.6); // Slightly slower
          NativeTts.setDefaultPitch && NativeTts.setDefaultPitch(1.0);
          console.log('Native TTS configured');
        } catch (e) {
          console.log('TTS config failed', e);
        }
      })
      .catch((err) => {
        console.log('TTS getInitStatus failed', err);
      });

    NativeTts.addEventListener && NativeTts.addEventListener('tts-start', onTtsStart);
    NativeTts.addEventListener && NativeTts.addEventListener('tts-finish', onTtsFinish);
    NativeTts.addEventListener && NativeTts.addEventListener('tts-cancel', onTtsCancel);
  } catch (error) {
    console.log('Native TTS unavailable:', error);
    ttsRef.current = null;
  }

  initializeVoice();

  return () => {
    // Cleanup native Voice listeners if loaded
    try {
      const V = voiceRef.current;
      if (V && V.destroy) {
        V.destroy().then(() => {
          V.removeAllListeners && V.removeAllListeners();
        });
      }
    } catch (e) {
      // ignore
    }

    // Cleanup native TTS listeners and stop speaking
    try {
      const handlers = ttsHandlersRef.current || {};
      const NativeTts = ttsRef.current;
      if (NativeTts) {
        handlers.onTtsStart && NativeTts.removeEventListener && NativeTts.removeEventListener('tts-start', handlers.onTtsStart);
        handlers.onTtsFinish && NativeTts.removeEventListener && NativeTts.removeEventListener('tts-finish', handlers.onTtsFinish);
        handlers.onTtsCancel && NativeTts.removeEventListener && NativeTts.removeEventListener('tts-cancel', handlers.onTtsCancel);
        NativeTts.stop && NativeTts.stop();
      }
    } catch (e) {
      // ignore cleanup errors
    }
  };
}, []);

  const startListening = async () => {
    if (isSpeaking) {
      try {
        if (ttsRef.current && ttsRef.current.stop) await ttsRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    try {
      if (isWeb) {
        // Web Speech API (SpeechRecognition)
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          Alert.alert('Microphone Unsupported', 'Speech recognition is not supported in this browser.');
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          animateMicrophone();
        };

        recognition.onresult = (event) => {
          let interim = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              finalTranscript += res[0].transcript;
            } else {
              interim += res[0].transcript;
            }
          }
          if (interim) setCurrentTranscript(interim);
          if (finalTranscript) {
            setCurrentTranscript(finalTranscript);
            handleUserMessage(finalTranscript);
          }
        };

        recognition.onerror = (e) => {
          console.error('Web recognition error', e);
          setIsListening(false);
          stopMicrophoneAnimation();
          Alert.alert('Speech Recognition Error', 'Please try speaking again.');
        };

        recognition.onend = () => {
          setIsListening(false);
          stopMicrophoneAnimation();
        };

        webRecognitionRef.current = recognition;
        recognition.start();
        return;
      }

      const V = voiceRef.current;
      if (V && V.start) {
        await V.start('en-US');
      } else {
        // native voice not available
        Alert.alert('Microphone Unsupported', 'Voice recognition is not available on this platform.');
      }
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      Alert.alert('Microphone Error', 'Unable to access microphone. You can still type your messages.');
    }
  };

  const stopListening = async () => {
    try {
      if (isWeb) {
        const rec = webRecognitionRef.current;
        if (rec && rec.stop) try { rec.stop(); } catch (e) {}
        webRecognitionRef.current = null;
        setIsListening(false);
        stopMicrophoneAnimation();
        return;
      }

      const V2 = voiceRef.current;
      if (V2 && V2.stop) {
        await V2.stop();
      }
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

  // frontend STT handled by react-native-voice (onSpeechResults/onSpeechPartialResults)

  // Text input handling
  const handleTextSubmit = () => {
    if (textInput.trim()) {
      handleUserMessage(textInput.trim());
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
            Start a live conversation with Alex, your AI therapist
          </Text>
          <TouchableOpacity 
            style={ChatStyles.startSessionButton}
            onPress={startSession}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={ChatStyles.startSessionButtonText}>Start Session</Text>
            )}
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
             isProcessing ? 'Processing...' : 'Tap mic to speak or type below'}
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

        {/* Input Section: compact toggle bar when closed, expanded input when open */}
        {!isInputOpen ? (
          <View style={ChatStyles.compactInputBar}>
            <View style={ChatStyles.compactInputBarRow}>
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
                  <Text style={ChatStyles.micButtonText}>{isListening ? '🎤' : '🎙️'}</Text>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={ChatStyles.openMessageButton}
                onPress={() => setIsInputOpen(true)}
              >
                <Text style={ChatStyles.openMessageButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={ChatStyles.inputContainer}>
            <View style={ChatStyles.inputTopRow}>
              <TouchableOpacity onPress={() => setIsInputOpen(false)} style={ChatStyles.inputCloseButton}>
                <Text style={ChatStyles.inputCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>

            {/* Text Input */}
            <View style={ChatStyles.textInputContainer}>
              <TextInput
                style={ChatStyles.textInput}
                placeholder="Type your message..."
                value={textInput}
                onChangeText={setTextInput}
                multiline
                maxLength={500}
                editable={!isProcessing}
              />
              <TouchableOpacity 
                style={[
                  ChatStyles.sendButton,
                  (!textInput.trim() || isProcessing) && ChatStyles.sendButtonDisabled
                ]}
                onPress={handleTextSubmit}
                disabled={!textInput.trim() || isProcessing}
              >
                <Text style={ChatStyles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>

            {/* Audio Controls with centered mic */}
            <View style={[ChatStyles.audioControlsContainer, ChatStyles.audioControlsCenter]}> 
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
                  <Text style={ChatStyles.micButtonText}>{isListening ? '🎤' : '🎙️'}</Text>
                </TouchableOpacity>
              </Animated.View>

              {isSpeaking && (
                <TouchableOpacity 
                  style={ChatStyles.stopSpeechButton}
                  onPress={() => {
                    try { if (ttsRef.current && ttsRef.current.stop) ttsRef.current.stop(); } catch (e) {}
                  }}
                >
                  <Text style={ChatStyles.stopSpeechButtonText}>⏹️ Stop</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LiveAudioChatScreen;