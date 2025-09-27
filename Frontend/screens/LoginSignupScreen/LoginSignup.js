import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LoginStyles } from '../styles/AppStyles';

const LoginSignupScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuth = () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isLogin) {
      // Handle login - for demo, just navigate to main app
      console.log('Login:', { email, password });
      navigation.replace('Main');
    } else {
      // Handle signup
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      console.log('Signup:', { name, email, password });
      navigation.replace('Main');
    }
  };

  return (
    <SafeAreaView style={LoginStyles.container}>
      <View style={LoginStyles.content}>
        <Text style={LoginStyles.title}>
          {isLogin ? 'Welcome Back' : 'Join Alex'}
        </Text>
        <Text style={LoginStyles.subtitle}>
          Your AI therapy companion is here to listen and support you
        </Text>

        {!isLogin && (
          <TextInput
            style={LoginStyles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={LoginStyles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={LoginStyles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {!isLogin && (
          <TextInput
            style={LoginStyles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        )}

        <TouchableOpacity style={LoginStyles.button} onPress={handleAuth}>
          <Text style={LoginStyles.buttonText}>
            {isLogin ? 'Start Chatting' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={LoginStyles.switchText}>
            {isLogin
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>

        <Text style={LoginStyles.disclaimer}>
          Your conversations are private and secure
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default LoginSignupScreen;