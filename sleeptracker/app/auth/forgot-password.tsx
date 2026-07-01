import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleReset = async () => {
    try {
      await resetPassword(email);
      Alert.alert('Success', 'Password reset email sent!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Reset failed');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, textAlign: 'center', marginBottom: 30 }}>Reset Password</Text>
      
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, marginBottom: 20, borderRadius: 5 }}
      />
      
      <TouchableOpacity 
        onPress={handleReset}
        style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 5, marginBottom: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>Send Reset Email</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ textAlign: 'center', color: '#007AFF' }}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
} 