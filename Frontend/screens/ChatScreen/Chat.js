import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { ChatStyles, Colors } from '../styles/AppStyles';

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm Alex, your AI therapy companion. I'm here to listen and support you. How are you feeling today?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef(null);

  const therapistResponses = [
    "That sounds really challenging. Can you tell me more about what you're experiencing?",
    "I hear you. It's completely normal to feel that way. What do you think might help you feel better?",
    "Thank you for sharing that with me. How long have you been feeling this way?",
    "It takes courage to talk about these feelings. What's been the most difficult part for you?",
    "I understand. Sometimes it helps to break things down. What's one small thing that might make today a little better?",
    "That's a lot to process. Remember, it's okay to take things one day at a time. What's been helping you cope?",
    "Your feelings are valid. Have you noticed any patterns in when you feel this way?",
    "I'm glad you're opening up about this. What would you say to a friend going through the same thing?",
    "That must be really tough. What does support look like for you right now?",
    "Thank you for trusting me with this. What's one thing you're grateful for today, even if it's small?"
  ];

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responseText = therapistResponses[Math.floor(Math.random() * therapistResponses.length)];
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

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

  return (
    <SafeAreaView style={ChatStyles.container}>
      <View style={ChatStyles.header}>
        <Text style={ChatStyles.headerTitle}>Alex - AI Therapist</Text>
        <Text style={ChatStyles.headerSubtitle}>Always here to listen</Text>
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
          
          {isTyping && (
            <View style={[ChatStyles.messageBubble, ChatStyles.aiMessage]}>
              <Text style={[ChatStyles.messageText, ChatStyles.aiMessageText]}>
                Alex is typing...
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={ChatStyles.inputContainer}>
          <TextInput
            style={ChatStyles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Share your thoughts..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[ChatStyles.sendButton, !inputText.trim() && ChatStyles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isTyping}
          >
            <Text style={ChatStyles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;