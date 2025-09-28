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
  // live conversation latch (one-click to start a continuous listen session)
  const [isLatched, setIsLatched] = useState(false);
  
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
  const webVoiceRef = useRef(null);
  const webOnResultRef = useRef(null);
  const webOnErrorRef = useRef(null);
  const webOnEndRef = useRef(null);
  const voiceRef = useRef(null);
  const pauseRecognitionRef = useRef(false);
  const pendingRestartRef = useRef(false);
  const restartAttemptsRef = useRef(0);
  const lastRestartRef = useRef(0);
  const isWeb = Platform.OS === 'web';

  // Initialize TTS and Voice Recognition
  useEffect(() => {
    // Web platform: use Web Speech API for STT and TTS
    if (isWeb) {
      // Nothing synchronous needed here; initializeVoice will set up recognition instance
      initializeVoice();
      // choose a high-quality web voice if available
      try {
        const pickWebVoice = () => {
          try {
            const voices = window.speechSynthesis.getVoices() || [];
            // prefer voices with Google/Neural/WaveNet in name and en-US
            let chosen = voices.find(v => /google|neural|wave(net)?/i.test(v.name) && /en[-_]?US|en/i.test(v.lang));
            if (!chosen) chosen = voices.find(v => /en[-_]?US|en/i.test(v.lang));
            if (!chosen && voices.length > 0) chosen = voices[0];
            webVoiceRef.current = chosen || null;
          } catch (e) {
            webVoiceRef.current = null;
          }
        };

        // voices may load asynchronously
        if (window.speechSynthesis && window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.onvoiceschanged = pickWebVoice;
        }
        pickWebVoice();
      } catch (e) {
        webVoiceRef.current = null;
      }

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

      const onTtsStart = () => {
        setIsSpeaking(true);
        pauseRecognitionRef.current = true;
        // stop any ongoing recognition
        try {
          if (isWeb) {
            const rec = webRecognitionRef.current;
            if (rec && rec.stop) try { rec.stop(); } catch (e) {}
          } else {
            if (voiceRef.current && voiceRef.current.stop) voiceRef.current.stop();
          }
        } catch (e) {}
      };

      const onTtsFinish = () => {
        setIsSpeaking(false);
        pauseRecognitionRef.current = false;
        // resume recognition if session is active
        try {
          if (isSessionActive) attemptRestartRecognition();
        } catch (e) {}
      };

      const onTtsCancel = () => {
        setIsSpeaking(false);
        pauseRecognitionRef.current = false;
      };

      ttsHandlersRef.current = { onTtsStart, onTtsFinish, onTtsCancel };

      NativeTts.getInitStatus && NativeTts.getInitStatus()
        .then(() => {
          try {
            NativeTts.setDefaultLanguage && NativeTts.setDefaultLanguage('en-US');
            NativeTts.setDefaultRate && NativeTts.setDefaultRate(0.5);
            NativeTts.setDefaultPitch && NativeTts.setDefaultPitch(1.0);
            // try to pick a higher quality native voice when available
            try {
              if (NativeTts.voices) {
                NativeTts.voices().then((vs) => {
                  const list = Array.isArray(vs) ? vs : [];
                  let preferred = list.find(v => /neo|neural|google|wave(net)?/i.test(v.name) && /en[-_]?US|en/i.test(v.language || v.lang || ''));
                  if (!preferred) preferred = list.find(v => /en[-_]?US|en/i.test(v.language || v.lang || ''));
                  if (preferred && NativeTts.setDefaultVoice) {
                    NativeTts.setDefaultVoice(preferred.id || preferred.voiceId || preferred.name);
                  }
                }).catch(() => {});
              }
            } catch (e) {
              // ignore voice selection errors
            }
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

  // Attempt to restart recognition with a small exponential backoff to avoid tight restart loops
  const attemptRestartRecognition = () => {
    try {
      if (pauseRecognitionRef.current) return;
      if (!isSessionActive) return;

      const now = Date.now();
      const attempts = restartAttemptsRef.current || 0;
      const delay = Math.min(200 * Math.pow(2, attempts), 2000); // 200ms, 400ms, 800ms, ... cap 2000ms

      // prevent too-frequent restarts
      if (lastRestartRef.current && now - lastRestartRef.current < 150) return;

      restartAttemptsRef.current = attempts + 1;
      setTimeout(async () => {
        try {
          if (isWeb) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
              const r = new SpeechRecognition();
              r.lang = 'en-US';
              r.interimResults = true;
              r.continuous = true;
              r.maxAlternatives = 1;
              r.onstart = () => { setIsListening(true); animateMicrophone(); };
              // use persisted handlers if available
              r.onresult = webOnResultRef.current || ((e) => {});
              r.onerror = webOnErrorRef.current || ((e) => {});
              r.onend = webOnEndRef.current || ((e) => {});
              webRecognitionRef.current = r;
              try { r.start(); }
              catch (e) { console.error('Failed to start restarted web recognition', e); }
            }
          } else {
            const V = voiceRef.current;
            if (V && V.start) {
              try { await V.start('en-US'); }
              catch (e) { console.error('Failed to start restarted native voice', e); }
            }
          }
          // success — reset attempts
          restartAttemptsRef.current = 0;
          lastRestartRef.current = Date.now();
        } catch (e) {
          console.error('AttemptRestartRecognition failed', e);
        }
      }, delay);
      // If we've retried several times without success, as a fallback call startListening()
      if ((restartAttemptsRef.current || 0) >= 3) {
        try {
          console.log('Fallback: calling startListening directly after multiple attempts');
          startListening();
          restartAttemptsRef.current = 0;
          lastRestartRef.current = Date.now();
        } catch (e) {
          console.error('Fallback startListening failed', e);
        }
      }
    } catch (e) {
      console.error('attemptRestartRecognition error', e);
    }
  };

  // Voice Recognition Event Handlers
  const onSpeechStart = () => {
    setIsListening(true);
    animateMicrophone();
    // frontend STT handled by react-native-voice (onSpeechResults/onSpeechPartialResults)
  };

  const onSpeechEnd = () => {
    // If paused by TTS, do not auto-restart here; speakMessage will resume when done
    stopMicrophoneAnimation();
    if (pauseRecognitionRef.current) {
      setIsListening(false);
      return;
    }

    // If latched, automatically restart listening to maintain a continuous conversation
    if (isLatched) {
      // restart after a short pause to avoid race conditions
      setTimeout(async () => {
        try {
          const V = voiceRef.current;
          if (V && V.start) {
            await V.start('en-US');
            setIsListening(true);
            animateMicrophone();
          }
        } catch (e) {
          console.error('Failed to restart native voice after end:', e);
        }
      }, 300);
    } else {
      setIsListening(false);
    }
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
    // pulsing disabled per user request — keep static scale
    try { micAnimation.setValue(1); } catch (e) { /* ignore */ }
  };

  const stopMicrophoneAnimation = () => {
    micAnimation.stopAnimation();
    micAnimation.setValue(1);
  };

  // Pause mic while AI is processing/thinking, and resume afterward when appropriate
  const pauseMicForProcessing = async () => {
    try {
      console.log('Pausing mic for AI processing');
      pauseRecognitionRef.current = true;
      if (isWeb) {
        const rec = webRecognitionRef.current;
        if (rec && rec.stop) {
          try { rec.stop(); } catch (e) { console.error('Error stopping web recognition for processing pause', e); }
        }
        // clear reference so restart helper will recreate
        webRecognitionRef.current = null;
      } else {
        const V = voiceRef.current;
        if (V && V.stop) {
          try { await V.stop(); } catch (e) { console.error('Error stopping native voice for processing pause', e); }
        }
      }
    } catch (e) {
      console.error('pauseMicForProcessing error', e);
    }
    setIsListening(false);
    stopMicrophoneAnimation();
  };

  const resumeMicAfterProcessing = () => {
    try {
      console.log('Resuming mic after AI processing');
      pauseRecognitionRef.current = false;
      if (isLatched) {
        const delay = AUTO_RESTART_AFTER_PROCESSING_MS || AUTO_RESTART_AFTER_MS || 600;
        setTimeout(() => {
          try {
            attemptRestartRecognition();
          } catch (err) {
            console.error('Error attempting restart after processing', err);
          }
        }, delay);
      }
    } catch (e) {
      console.error('resumeMicAfterProcessing error', e);
    }
  };

  useEffect(() => {
    // whenever processing state changes, pause/resume mic accordingly
    if (isProcessing) {
      pauseMicForProcessing();
    } else {
      resumeMicAfterProcessing();
    }
  }, [isProcessing]);

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
            text: "What would you like to talk about today?",
            isUser: false,
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);

          // Speak welcome message if TTS is available
          try {
            await speakMessage(welcomeMessage.text);
            // enable latched live mic so resume logic will re-open the mic after processing
            setIsLatched(true);
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
    // If there's no session id, still perform cleanup and close the screen
    if (!sessionId) {
      try {
        // stop any TTS or recognition
        try { if (ttsRef.current && ttsRef.current.stop) ttsRef.current.stop(); } catch (e) {}
        try { if (isWeb && window && window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
        try { const rec = webRecognitionRef.current; if (rec && rec.stop) rec.stop(); webRecognitionRef.current = null; } catch (e) {}
        try { if (voiceRef.current && voiceRef.current.stop) voiceRef.current.stop(); } catch (e) {}
      } catch (e) {}
      setIsSessionActive(false);
      navigation.goBack && navigation.goBack();
      return;
    }

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
      
      // cleanup audio resources
      try { if (ttsRef.current && ttsRef.current.stop) ttsRef.current.stop(); } catch (e) {}
      try { if (isWeb && window && window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
      try { const rec = webRecognitionRef.current; if (rec && rec.stop) rec.stop(); webRecognitionRef.current = null; } catch (e) {}
      try { if (voiceRef.current && voiceRef.current.stop) voiceRef.current.stop(); } catch (e) {}

      setIsSessionActive(false);
      setSessionId(null);
      navigation.goBack && navigation.goBack();
    } catch (error) {
      console.error('Error ending session:', error);
      Alert.alert('Error', 'There was an issue ending the session, but it will be closed automatically.');
      navigation.goBack && navigation.goBack();
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
const speakMessage = async (text) => {
  try {
    console.log('Attempting to speak:', text);
    
    if (isWeb) {
      try {
        if (window && window.speechSynthesis) {
          // Cancel any existing speech
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            // prefer chosen web voice if available
            try {
              if (webVoiceRef.current) {
                utterance.voice = webVoiceRef.current;
              }
            } catch (e) {
              // ignore
            }
            // slightly slower rate and natural pitch
            utterance.rate = 0.9;
            utterance.pitch = 1.05;
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
          // pause recognition while speaking
          try {
            pauseRecognitionRef.current = true;
            const rec = webRecognitionRef.current;
            if (rec && rec.stop) try { rec.stop(); } catch (e) {}
          } catch (e) {}

          utterance.onend = () => {
            console.log('Web TTS ended (utterance.onend) - pauseRecognitionRef, isSessionActive:', pauseRecognitionRef.current, isSessionActive);
            setIsSpeaking(false);
            pauseRecognitionRef.current = false;
            try {
              if (isSessionActive) {
                    console.log('Attempting immediate startListening() from web utterance.onend');
                    try {
                      (async () => {
                        try {
                          await startListening();
                          return;
                        } catch (e) {
                          console.error('Immediate startListening() failed on web:', e);
                        }
                      })();
                    } catch (e) {
                      console.error('Immediate startListening wrapper failed on web:', e);
                    }

                    console.log('Calling attemptRestartRecognition from web utterance.onend');
                    attemptRestartRecognition();
              }
            } catch (e) { console.error('Error in utterance.onend handler', e); }
          };

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
      try {
        // pause recognition
        pauseRecognitionRef.current = true;
        if (voiceRef.current && voiceRef.current.stop) {
          try { await voiceRef.current.stop(); } catch (e) {}
        }

        await ttsRef.current.speak(text);
        // speaking will emit events (tts-finish) which we listen to; resume there
      } catch (e) {
        console.error('Native TTS speak failed', e);
      }
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
      console.log('Native TTS finished (second handler) - clearing pause and attempting restart');
      setIsSpeaking(false);
      pauseRecognitionRef.current = false;
      try {
        if (isSessionActive) {
          console.log('Attempting immediate native startListening() from onTtsFinish');
          try {
            startListening();
            return;
          } catch (e) {
            console.error('Immediate startListening() failed on native:', e);
          }
          attemptRestartRecognition();
        }
      } catch (e) { console.error(e); }
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
          recognition.continuous = true; // keep capturing until user stops
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          animateMicrophone();
        };

        const _onResult = (event) => {
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
        webOnResultRef.current = _onResult;
        recognition.onresult = _onResult;

        const _onError = (e) => {
          console.error('Web recognition error', e);
          setIsListening(false);
          stopMicrophoneAnimation();
          Alert.alert('Speech Recognition Error', 'Please try speaking again.');
        };
        webOnErrorRef.current = _onError;
        recognition.onerror = _onError;

        const _onEnd = () => {
          // If latched (live conversation), restart recognition automatically
          if (isLatched) {
            try {
              // small delay then restart
              setTimeout(() => {
                try {
                  recognition.start();
                } catch (e) {
                  console.error('Failed to restart web recognition:', e);
                }
              }, 250);
            } catch (e) {
              console.error('Error restarting recognition onend:', e);
            }
          } else {
            setIsListening(false);
            stopMicrophoneAnimation();
          }
        };
        webOnEndRef.current = _onEnd;
        recognition.onend = _onEnd;

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
      // clear latched mode
      setIsLatched(false);
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
    // toggle latched live-conversation mode
    if (isLatched) {
      setIsLatched(false);
      stopListening();
    } else {
      setIsLatched(true);
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
            Start a live conversation with Looma, your AI therapist
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
        <Text style={ChatStyles.headerTitle}>Live Session with Looma</Text>
        <View style={ChatStyles.statusContainer}>
          <View style={[
            ChatStyles.statusIndicator, 
            isSessionActive && ChatStyles.statusActive
          ]} />
          <Text style={ChatStyles.headerSubtitle}>
            {isSpeaking ? 'Looma is speaking...' : 
             isListening ? 'Listening...' :
             isProcessing ? 'Processing...' : 'Tap mic to speak or type below'}
          </Text>
        </View>
        <TouchableOpacity 
          style={ChatStyles.endSessionButton}
          onPress={() => {
            if (isProcessing) {
              Alert.alert('Please wait', 'An operation is in progress. Please wait a moment.');
              return;
            }
            endSession();
          }}
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
                Looma is thinking...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input Section: compact toggle bar when closed, expanded input when open */}
        {!isInputOpen ? (
          <View style={ChatStyles.compactInputBar}>
            <View style={ChatStyles.compactInputBarRow}>
              <View>
                <TouchableOpacity
                  style={[
                    ChatStyles.micButton,
                    isListening && ChatStyles.micButtonActive,
                    (isSpeaking || isProcessing) && ChatStyles.micButtonDisabled
                  ]}
                  onPress={toggleListening}
                  disabled={isSpeaking || isProcessing}
                >
                  <Text style={ChatStyles.micButtonText}>{isLatched ? '📞' : (isListening ? '🎤' : '🎙️')}</Text>
                </TouchableOpacity>
              </View>

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
              <View>
                <TouchableOpacity 
                  style={[
                    ChatStyles.micButton,
                    isListening && ChatStyles.micButtonActive,
                    (isSpeaking || isProcessing) && ChatStyles.micButtonDisabled
                  ]}
                  onPress={toggleListening}
                  disabled={isSpeaking || isProcessing}
                >
                  <Text style={ChatStyles.micButtonText}>{isLatched ? '📞' : (isListening ? '🎤' : '🎙️')}</Text>
                </TouchableOpacity>
              </View>

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