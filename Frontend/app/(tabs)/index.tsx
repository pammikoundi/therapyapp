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
} from 'react-native';

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm Alex, your AI therapy companion. How are you feeling today?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef(null);

  // ... rest of your chat logic

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <View style={{ 
        paddingHorizontal: 20, 
        paddingVertical: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333333' }}>
          Alex - AI Therapist
        </Text>
        <Text style={{ fontSize: 14, color: '#666666', marginTop: 4 }}>
          Always here to listen
        </Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1, padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View key={message.id} style={[
              {
                maxWidth: '80%',
                padding: 12,
                borderRadius: 10,
                marginBottom: 12,
              },
              message.isUser ? {
                alignSelf: 'flex-end',
                backgroundColor: '#007AFF',
              } : {
                alignSelf: 'flex-start',
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E0E0E0',
              }
            ]}>
              <Text style={{
                fontSize: 16,
                lineHeight: 20,
                color: message.isUser ? '#FFFFFF' : '#333333',
              }}>
                {message.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          padding: 16,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#E0E0E0',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 16,
              backgroundColor: '#F5F5F5',
              maxHeight: 100,
            }}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Share your thoughts..."
            multiline
          />
          <TouchableOpacity 
            style={{
              backgroundColor: inputText.trim() ? '#007AFF' : '#CCCCCC',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 10,
              marginLeft: 12,
            }}
            onPress={() => {
              if (!inputText.trim()) return;
              // Add send message logic
              setInputText('');
            }}
            disabled={!inputText.trim()}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}