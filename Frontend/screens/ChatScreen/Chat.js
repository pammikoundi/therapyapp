import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { router } from 'expo-router';
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
  const isLatchedRef = useRef(false); // Track continuous mode state
  const ttsCompletionCallbackRef = useRef(null); // Hook for TTS completion
  const ttsTimeoutRef = useRef(null); // Timeout for TTS completion fallback
  const audioContextRef = useRef(null); // Web Audio API context
  const analyserRef = useRef(null); // Audio analyser for output detection
  const audioMonitoringRef = useRef(false); // Flag to track if we're monitoring audio
  const silenceTimeoutRef = useRef(null); // Timeout for silence detection
  const isWeb = Platform.OS === 'web';

  // Helper to update isLatched state and ref together
  const setIsLatchedState = (value) => {
    console.log('Setting isLatched to:', value);
    setIsLatched(value);
    isLatchedRef.current = value;
  };

  // TTS Completion Hook System
  const setTTSCompletionCallback = useCallback((callback) => {
    console.log('Setting TTS completion callback');
    ttsCompletionCallbackRef.current = callback;
  }, []);

  // Define stopAudioOutputMonitoring first
  const stopAudioOutputMonitoring = useCallback(() => {
    console.log('Stopping audio output monitoring');
    audioMonitoringRef.current = false;
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const triggerTTSCompletion = useCallback(() => {
    console.log('TTS completion triggered');
    
    // Stop audio monitoring
    stopAudioOutputMonitoring();
    
    // Clear any existing timeout
    if (ttsTimeoutRef.current) {
      clearTimeout(ttsTimeoutRef.current);
      ttsTimeoutRef.current = null;
    }
    
    // Clear TTS state
    setIsSpeaking(false);
    pauseRecognitionRef.current = false;
    
    // Execute the callback if it exists
    if (ttsCompletionCallbackRef.current) {
      console.log('Executing TTS completion callback');
      try {
        ttsCompletionCallbackRef.current();
      } catch (e) {
        console.error('TTS completion callback error:', e);
      }
      // Clear the callback after execution
      ttsCompletionCallbackRef.current = null;
    }
  }, [stopAudioOutputMonitoring]);

  // Fallback timeout in case TTS events don't fire
  const setTTSFallbackTimeout = useCallback((duration = 3000) => {
    console.log('Setting TTS fallback timeout for', duration + 'ms');
    
    // Clear any existing timeout
    if (ttsTimeoutRef.current) {
      clearTimeout(ttsTimeoutRef.current);
    }
    
    ttsTimeoutRef.current = setTimeout(() => {
      console.log('TTS fallback timeout triggered');
      triggerTTSCompletion();
    }, duration);
  }, [triggerTTSCompletion]);

  // Audio Output Monitoring Functions
  const initializeAudioMonitoring = useCallback(async () => {
    if (!isWeb) return;
    
    try {
      console.log('Initializing audio output monitoring');
      
      // Create or reuse audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Resume context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create analyser for monitoring audio output
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      // Connect to destination (speakers) to monitor output
      const destination = audioContext.destination;
      
      // Create a gain node to tap into the audio output
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1.0;
      
      // Connect: destination <- gainNode <- analyser
      gainNode.connect(destination);
      analyser.connect(gainNode);
      
      analyserRef.current = analyser;
      
      console.log('Audio output monitoring initialized');
    } catch (e) {
      console.error('Failed to initialize audio monitoring:', e);
    }
  }, [isWeb]);
  
  const startAudioOutputMonitoring = useCallback(() => {
    if (!isWeb || !analyserRef.current) return;
    
    console.log('Starting audio output monitoring');
    audioMonitoringRef.current = true;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    let consecutiveSilenceCount = 0;
    const silenceThreshold = 20; // Audio level threshold
    const silenceFramesNeeded = 20; // Number of consecutive silent frames
    
    const checkAudioOutput = () => {
      if (!audioMonitoringRef.current) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average audio level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      if (average < silenceThreshold) {
        consecutiveSilenceCount++;
        if (consecutiveSilenceCount >= silenceFramesNeeded) {
          console.log('Audio output silence detected - TTS likely finished');
          stopAudioOutputMonitoring();
          
          // Wait a bit more to ensure complete silence, then trigger completion
          setTimeout(() => {
            if (isSpeaking) {
              console.log('Audio monitoring confirms TTS completion');
              triggerTTSCompletion();
            }
          }, 200);
          return;
        }
      } else {
        consecutiveSilenceCount = 0; // Reset silence counter
      }
      
      // Continue monitoring
      requestAnimationFrame(checkAudioOutput);
    };
    
    // Start monitoring
    requestAnimationFrame(checkAudioOutput);
    
    // Fallback timeout in case audio monitoring fails
    silenceTimeoutRef.current = setTimeout(() => {
      console.log('Audio monitoring timeout - forcing TTS completion');
      stopAudioOutputMonitoring();
      if (isSpeaking) {
        triggerTTSCompletion();
      }
    }, 10000); // 10 second max timeout
    
  }, [isWeb, isSpeaking, triggerTTSCompletion, stopAudioOutputMonitoring]);

  // Initialize TTS and Voice Recognition
  useEffect(() => {
    // Web platform: use Web Speech API for STT and TTS
    if (isWeb) {
      // Initialize audio monitoring for better TTS completion detection
      initializeAudioMonitoring();
      
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
        console.log('Native TTS finished (first handler) - clearing pause and triggering completion');
        setIsSpeaking(false);
        // Clear pause flag to allow recognition to restart
        pauseRecognitionRef.current = false;
        
        // Use TTS completion hook
        triggerTTSCompletion();
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

  // Cleanup when component unmounts or page is exited
  useEffect(() => {
    return () => {
      console.log('Chat component unmounting - performing cleanup');
      
      try {
        // Stop all TTS immediately
        if (ttsRef.current && ttsRef.current.stop) {
          ttsRef.current.stop();
        }
        if (isWeb && window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        
        // Stop all speech recognition
        const rec = webRecognitionRef.current;
        if (rec && rec.stop) {
          rec.stop();
        }
        webRecognitionRef.current = null;
        
        if (voiceRef.current && voiceRef.current.stop) {
          voiceRef.current.stop();
        }
        
        // Clear TTS completion callbacks and timeouts
        if (ttsCompletionCallbackRef.current) {
          ttsCompletionCallbackRef.current = null;
        }
        if (ttsTimeoutRef.current) {
          clearTimeout(ttsTimeoutRef.current);
          ttsTimeoutRef.current = null;
        }
        
        // Stop audio monitoring
        stopAudioOutputMonitoring();
        
        // Close audio context
        if (audioContextRef.current) {
          try {
            audioContextRef.current.close();
            audioContextRef.current = null;
          } catch (e) {
            console.log('Error closing audio context:', e);
          }
        }
        
        // Disable continuous mode
        setIsLatchedState(false);
        
        // Stop any pending restart attempts
        pauseRecognitionRef.current = true;
        restartAttemptsRef.current = 0;
        
        console.log('Chat cleanup completed');
        
      } catch (e) {
        console.error('Error during chat cleanup:', e);
      }
    };
  }, [setIsLatchedState]);

  // Handle page visibility changes and beforeunload events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('Page hidden - pausing audio processes');
        // Pause recognition when page is hidden
        pauseRecognitionRef.current = true;
        
        // Stop current recognition
        try {
          const rec = webRecognitionRef.current;
          if (rec && rec.stop) {
            rec.stop();
          }
          if (voiceRef.current && voiceRef.current.stop) {
            voiceRef.current.stop();
          }
        } catch (e) {
          console.log('Error stopping recognition on visibility change:', e);
        }
      }
    };

    const handleBeforeUnload = (e) => {
      console.log('Page unloading - stopping all audio');
      
      // Stop TTS immediately
      try {
        if (ttsRef.current && ttsRef.current.stop) {
          ttsRef.current.stop();
        }
        if (isWeb && window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch (error) {
        console.log('Error stopping TTS on unload:', error);
      }
    };

    // Add event listeners for web platforms
    if (isWeb) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isWeb]);

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

  // Attempt to restart recognition with longer delays to prevent rapid cycling
  const attemptRestartRecognition = () => {
    try {
      if (pauseRecognitionRef.current) {
        console.log('Skipping restart - recognition is paused');
        return;
      }
      if (!isSessionActive) {
        console.log('Skipping restart - session not active');
        return;
      }
      if (isListening) {
        console.log('Skipping restart - already listening');
        return;
      }

      const now = Date.now();
      const attempts = restartAttemptsRef.current || 0;
      
      // Much longer delays to prevent rapid cycling
      const delay = Math.min(1000 * Math.pow(1.5, attempts), 5000); // 1s, 1.5s, 2.25s, ... cap 5s

      // prevent too-frequent restarts - much longer cooldown
      if (lastRestartRef.current && now - lastRestartRef.current < 2000) {
        console.log('Skipping restart - too soon since last attempt');
        return;
      }

      console.log('Scheduling restart attempt', attempts + 1, 'with delay', delay + 'ms');
      restartAttemptsRef.current = attempts + 1;
      
      setTimeout(() => {
        try {
          console.log('Executing restart attempt', attempts + 1);
          
          // Check conditions again before restarting
          if (!isSessionActive || isListening || isSpeaking) {
            console.log('Aborting restart - conditions changed');
            return;
          }
          
          startListening();
          restartAttemptsRef.current = 0; // Reset on successful start
          lastRestartRef.current = Date.now();
        } catch (e) {
          console.error('Restart attempt failed', e);
        }
      }, delay);
      
      // Stop trying after 3 attempts
      if (attempts >= 2) {
        console.log('Maximum restart attempts reached, stopping');
        restartAttemptsRef.current = 0;
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
      console.log('AI processing complete - clearing pause flag (TTS handlers will restart if needed)');
      pauseRecognitionRef.current = false;
      
      // Don't restart here - let TTS completion handlers handle it to avoid conflicts
      // This prevents multiple competing restart mechanisms
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

          // enable latched live mic first so TTS completion handlers know to restart mic
          setIsLatchedState(true);
          
          // Speak welcome message if TTS is available
          try {
            // Disable automatic mic restart after welcome message to prevent loops
            await speakMessage(welcomeMessage.text);
            console.log('Welcome message TTS completed - NOT auto-starting mic to prevent loops');
          } catch (error) {
            console.log('TTS not available, continuing without audio');
            // If TTS fails, start listening immediately since we set isLatched
            try {
              await startListening();
            } catch (e) {
              console.log('Could not start listening after TTS failure:', e);
            }
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
    console.log('endSession called - FORCED SESSION END - sessionId:', sessionId);
    
    // IMMEDIATE STATE CLEANUP - stop everything now
    console.log('Forcing immediate state cleanup');
    setIsProcessing(false); // Clear processing flag immediately
    setIsSpeaking(false);   // Clear speaking flag immediately
    setIsListening(false);  // Clear listening flag immediately
    
    // Stop all audio and recognition immediately
    const cleanupAudio = () => {
      try {
        console.log('Performing aggressive audio cleanup');
        
        // Stop TTS aggressively
        if (ttsRef.current && ttsRef.current.stop) {
          ttsRef.current.stop();
          // Stop again after short delay
          setTimeout(() => {
            try { if (ttsRef.current && ttsRef.current.stop) ttsRef.current.stop(); } catch (e) {}
          }, 50);
        }
        
        if (isWeb && window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          window.speechSynthesis.cancel(); // Call twice
          setTimeout(() => {
            try { window.speechSynthesis.cancel(); } catch (e) {}
          }, 50);
        }
        
        // Stop speech recognition aggressively
        const rec = webRecognitionRef.current;
        if (rec && rec.stop) {
          rec.stop();
          setTimeout(() => {
            try { if (rec && rec.stop) rec.stop(); } catch (e) {}
          }, 50);
        }
        webRecognitionRef.current = null;
        
        if (voiceRef.current && voiceRef.current.stop) {
          voiceRef.current.stop();
          setTimeout(() => {
            try { if (voiceRef.current && voiceRef.current.stop) voiceRef.current.stop(); } catch (e) {}
          }, 50);
        }
        
        // Clear ALL TTS completion callbacks and timeouts
        if (ttsCompletionCallbackRef.current) ttsCompletionCallbackRef.current = null;
        if (ttsTimeoutRef.current) {
          clearTimeout(ttsTimeoutRef.current);
          ttsTimeoutRef.current = null;
        }
        
        // Disable continuous mode and pause recognition
        setIsLatchedState(false);
        pauseRecognitionRef.current = true;
        
        console.log('Audio cleanup completed');
        
      } catch (e) {
        console.error('Error during audio cleanup:', e);
      }
    };
    
    // Cleanup audio immediately
    cleanupAudio();
    
    // If there's no session id, just navigate to statistics
    if (!sessionId) {
      console.log('No session ID, navigating to statistics');
      setIsSessionActive(false);
      // Navigate to statistics page using expo-router
      try {
        console.log('No sessionId - trying router.replace');
        router.replace('/(tabs)/statistics');
        console.log('Successfully navigated without sessionId');
      } catch (routerError) {
        console.error('No sessionId - router error:', routerError);
        // Try push as fallback
        try {
          router.push('/(tabs)/statistics');
        } catch (pushError) {
          console.error('No sessionId - push error:', pushError);
          // Fallback to traditional navigation
          if (navigation.navigate) {
            navigation.navigate('Statistics');
          } else if (navigation.goBack) {
            navigation.goBack();
          }
        }
      }
      return;
    }

    try {
      // Don't set isProcessing(true) - we want to allow forced session end
      console.log('Calling session close API for session:', sessionId);
      
      const response = await fetch(`${API_BASE_URL}/session/close?session_id=${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Session close response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Session ended successfully:', data);
        
        // Optional: Show session summary if available
        if (data.summary) {
          console.log('Session summary:', data.summary);
          // You could show this in a modal or alert if desired
        }
      } else {
        console.error('Session close failed with status:', response.status);
        const errorText = await response.text();
        console.error('Session close error response:', errorText);
      }
      
    } catch (error) {
      console.error('Error ending session:', error);
      // Don't show alert - just log and continue to navigation
    }
    
    // Always cleanup state and navigate
    setIsSessionActive(false);
    setSessionId(null);
    setIsProcessing(false);
    
    // Navigate to statistics page using expo-router
    console.log('Attempting to navigate to statistics page');
    try {
      console.log('Trying router.replace with /(tabs)/statistics');
      router.replace('/(tabs)/statistics');
      console.log('Successfully called router.replace');
    } catch (routerError) {
      console.error('Router.replace error:', routerError);
      
      // Try router.push as fallback
      try {
        console.log('Trying router.push as fallback');
        router.push('/(tabs)/statistics');
        console.log('Successfully called router.push');
      } catch (pushError) {
        console.error('Router.push error:', pushError);
        
        // Try different path formats
        try {
          console.log('Trying router.push with /statistics');
          router.push('/statistics');
        } catch (pathError) {
          console.error('Alternative path error:', pathError);
          
          // Final fallback to traditional navigation
          try {
            console.log('Using traditional navigation fallback');
            if (navigation.navigate) {
              navigation.navigate('Statistics');
            } else if (navigation.replace) {
              navigation.replace('Statistics');
            } else if (navigation.goBack) {
              navigation.goBack();
            } else {
              console.error('No navigation method available');
            }
          } catch (navError) {
            console.error('Traditional navigation error:', navError);
          }
        }
      }
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

        // Ensure latched mode is active so mic will restart after TTS
        setIsLatchedState(true);
        
        // Speak AI response if TTS is available
        try {
          // Disable automatic mic restart after AI response to prevent loops
          await speakMessage(aiData.response);
          console.log('AI response TTS completed - NOT auto-starting mic to prevent loops');
        } catch (error) {
          console.log('TTS not available for AI response');
          // If TTS fails, start listening immediately since we set isLatched
          try {
            await startListening();
          } catch (e) {
            console.log('Could not start listening after AI TTS failure:', e);
          }
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
const speakMessage = async (text, onComplete = null) => {
  try {
    console.log('Attempting to speak:', text);
    
    // AGGRESSIVE SPEECH RECOGNITION STOPPING BEFORE TTS
    console.log('Aggressively stopping all speech recognition before TTS');
    try {
      // Stop web recognition multiple times
      const rec = webRecognitionRef.current;
      if (rec && rec.stop) {
        rec.stop();
        // Wait and stop again
        setTimeout(() => {
          try {
            if (rec && rec.stop) rec.stop();
          } catch (e) {}
        }, 50);
      }
      webRecognitionRef.current = null;
      
      // Stop native recognition multiple times
      if (voiceRef.current && voiceRef.current.stop) {
        await voiceRef.current.stop();
        // Wait a bit and stop again
        await new Promise(resolve => setTimeout(resolve, 100));
        try {
          await voiceRef.current.stop();
        } catch (e) {}
      }
      
      // Update UI state immediately
      setIsListening(false);
      stopMicrophoneAnimation();
      
      // Set pause flag to prevent automatic restarts
      pauseRecognitionRef.current = true;
      
      // Wait additional time to ensure recognition is fully stopped
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (e) {
      console.error('Error stopping recognition before TTS:', e);
    }
    
    // Set up TTS completion callback if provided
    if (onComplete) {
      setTTSCompletionCallback(onComplete);
    }
    
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
            console.log('Web TTS started - beginning audio output monitoring');
            setIsSpeaking(true);
            
            // Start monitoring actual audio output
            startAudioOutputMonitoring();
          };
          
          utterance.onend = () => {
            console.log('Web TTS onend event fired (may be unreliable)');
            // Don't immediately trigger completion - let audio monitoring handle it
            // Audio monitoring will detect when speakers actually stop outputting sound
          };
          
          utterance.onerror = (error) => {
            console.log('Web TTS error:', error);
            setIsSpeaking(false);
            stopAudioOutputMonitoring();
            // Clear pause flag
            pauseRecognitionRef.current = false;
            triggerTTSCompletion();
          };
          
          webUtteranceRef.current = utterance;
          // pause recognition while speaking
          try {
            pauseRecognitionRef.current = true;
            const rec = webRecognitionRef.current;
            if (rec && rec.stop) try { rec.stop(); } catch (e) {}
          } catch (e) {}

          window.speechSynthesis.speak(utterance);
          console.log('Web TTS initiated - audio monitoring will detect completion');
          
          // Reduced fallback timeout since audio monitoring is more reliable
          if (onComplete) {
            setTTSFallbackTimeout(8000); // 8 second fallback (longer since we're using audio monitoring)
          }
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
        
        // Set fallback timeout for native TTS
        if (onComplete) {
          setTTSFallbackTimeout(5000); // 5 second fallback
        }
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
      console.log('Native TTS finished - restarting microphone if session is active and latched');
      setIsSpeaking(false);
      pauseRecognitionRef.current = false;
      
      // Use TTS completion hook
      console.log('Native TTS finished (second handler) - clearing pause and triggering completion');
      setIsSpeaking(false);
      // Clear pause flag to allow recognition to restart
      pauseRecognitionRef.current = false;
      triggerTTSCompletion();
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
    console.log('startListening called - isSpeaking:', isSpeaking, 'isListening:', isListening);
    
    // AGGRESSIVE AUDIO CLEANUP BEFORE STARTING SPEECH RECOGNITION
    console.log('Performing aggressive audio cleanup before starting speech recognition');
    try {
      // Stop native TTS multiple times to ensure it stops
      if (ttsRef.current && ttsRef.current.stop) {
        await ttsRef.current.stop();
        // Wait a bit and stop again
        await new Promise(resolve => setTimeout(resolve, 100));
        await ttsRef.current.stop();
      }
      
      // Stop web TTS aggressively
      if (isWeb && window && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.cancel(); // Call twice
        // Wait and cancel again
        setTimeout(() => {
          try {
            window.speechSynthesis.cancel();
          } catch (e) {}
        }, 100);
      }
      
      // Clear any TTS completion callbacks and timeouts
      if (ttsCompletionCallbackRef.current) {
        ttsCompletionCallbackRef.current = null;
      }
      if (ttsTimeoutRef.current) {
        clearTimeout(ttsTimeoutRef.current);
        ttsTimeoutRef.current = null;
      }
      
      // Update UI state
      setIsSpeaking(false);
      
      // Wait additional time to ensure all audio is cleared
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (e) {
      console.error('Error stopping TTS before speech recognition:', e);
    }
    
    try {
      if (isWeb) {
        console.log('Starting web speech recognition');
        
        // Check for speech recognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          console.error('Speech recognition not supported in this browser');
          Alert.alert('Microphone Unsupported', 'Speech recognition is not supported in this browser. Please use the text input instead.');
          return;
        }
        
        // Check if we're in a secure context (required for speech recognition)
        if (!window.isSecureContext && location.protocol !== 'http:') {
          console.error('Speech recognition requires a secure context (HTTPS)');
          Alert.alert('Secure Connection Required', 'Speech recognition requires a secure connection (HTTPS). Please use text input instead.');
          return;
        }

        console.log('Creating SpeechRecognition instance');
        console.log('User agent:', navigator.userAgent);
        console.log('Language:', navigator.language);
        
        const recognition = new SpeechRecognition();
        console.log('SpeechRecognition instance created successfully');
        
        // Check default language
        console.log('Default recognition.lang:', recognition.lang);
        
        // Try to set language to something simple first
        console.log('Setting language to navigator.language:', navigator.language);
        try {
          recognition.lang = navigator.language || 'en-US';
          console.log('Language set successfully to:', recognition.lang);
        } catch (e) {
          console.error('Error setting language:', e);
          console.log('Trying with en-US');
          try {
            recognition.lang = 'en-US';
            console.log('en-US set successfully');
          } catch (e2) {
            console.error('Error setting en-US:', e2);
            console.log('Using default language');
          }
        }
        
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.maxAlternatives = 1;
        
        console.log('Web speech recognition configured with final lang:', recognition.lang);

        recognition.onstart = () => {
          console.log('Web speech recognition started');
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
          
          // Don't keep retrying if language is not supported
          if (e.error === 'language-not-supported') {
            console.error('Language not supported, disabling continuous mode');
            setIsLatchedState(false); // Disable continuous mode to prevent infinite restarts
            Alert.alert('Language Not Supported', 'Your browser does not support speech recognition for English. Please use the text input instead.');
            return;
          }
          
          // For other errors, show generic error
          Alert.alert('Speech Recognition Error', 'Please try speaking again or use text input.');
        };
        webOnErrorRef.current = _onError;
        recognition.onerror = _onError;

        const _onEnd = () => {
          console.log('Web speech recognition ended - isLatched:', isLatched, 'isSpeaking:', isSpeaking);
          
          // Don't immediately restart - wait for user input or TTS completion to trigger restart
          setIsListening(false);
          stopMicrophoneAnimation();
          
          // Only restart if we're not currently speaking (TTS) and we have processed a message
          // The TTS completion handlers will restart listening when appropriate
        };
        webOnEndRef.current = _onEnd;
        recognition.onend = _onEnd;

        webRecognitionRef.current = recognition;
        console.log('Calling recognition.start() with lang:', recognition.lang);
        
        try {
          recognition.start();
          console.log('recognition.start() called successfully');
        } catch (e) {
          console.error('Error calling recognition.start():', e);
          setIsListening(false);
          stopMicrophoneAnimation();
          Alert.alert('Microphone Error', 'Unable to start speech recognition. Please use text input instead.');
          return;
        }
        
        return;
      }

      console.log('Attempting to start native voice recognition');
      const V = voiceRef.current;
      if (V && V.start) {
        console.log('Starting native voice recognition with en-US');
        await V.start('en-US');
        console.log('Native voice recognition started successfully');
      } else {
        console.error('Native voice not available - V:', !!V, 'V.start:', !!(V && V.start));
        // native voice not available
        Alert.alert('Microphone Unsupported', 'Voice recognition is not available on this platform.');
      }
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
      stopMicrophoneAnimation();
      
      // If speech recognition fails completely, disable continuous mode
      if (isWeb) {
        console.log('Disabling continuous mode due to web speech recognition failure');
        setIsLatchedState(false);
      }
      
      Alert.alert('Microphone Error', 'Speech recognition is not working. Please use the text input to continue your conversation.');
    }
  };

  const stopListening = async (disableContinuous = false) => {
    try {
      console.log('stopListening called - disableContinuous:', disableContinuous);
      
      // Optionally disable continuous mode
      if (disableContinuous) {
        console.log('Disabling continuous mode');
        setIsLatchedState(false);
      }
      
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
    console.log('Manual toggle pressed - current state: isListening=', isListening, 'isLatched=', isLatched);
    
    if (isListening) {
      // If currently listening, aggressively stop everything
      console.log('Manual stop - aggressively stopping all audio processes');
      
      // Aggressively stop any TTS that might be playing
      try {
        if (isWeb && window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          window.speechSynthesis.cancel(); // Call twice
          setTimeout(() => {
            try { window.speechSynthesis.cancel(); } catch (e) {}
          }, 100);
        }
        if (ttsRef.current && ttsRef.current.stop) {
          ttsRef.current.stop();
          setTimeout(() => {
            try { ttsRef.current.stop(); } catch (e) {}
          }, 100);
        }
      } catch (e) {
        console.log('Error stopping TTS on manual toggle:', e);
      }
      
      // Clear all TTS completion callbacks
      if (ttsCompletionCallbackRef.current) {
        ttsCompletionCallbackRef.current = null;
      }
      if (ttsTimeoutRef.current) {
        clearTimeout(ttsTimeoutRef.current);
        ttsTimeoutRef.current = null;
      }
      
      // Stop listening and disable continuous mode
      stopListening(true); // true = disable continuous mode
      
    } else {
      // If not listening, start listening and enable continuous mode
      console.log('Manual start - enabling continuous listening');
      setIsLatchedState(true); // Enable continuous mode
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
             isProcessing ? 'Processing...' : 
             isLatched ? 'Ready - will listen after responses' : 'Tap mic to start or type below'}
          </Text>
        </View>
        <TouchableOpacity 
          style={ChatStyles.endSessionButton}
          onPress={() => {
            console.log('End Session button pressed - forcing session end');
            // Always allow ending session, even if processing
            console.log('Calling endSession function (forced)');
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
                  <Text style={ChatStyles.micButtonText}>
                    {isListening ? '🎤' : '🎙️'}
                  </Text>
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
                  <Text style={ChatStyles.micButtonText}>
                    {isListening ? '🎤' : '🎙️'}
                  </Text>
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