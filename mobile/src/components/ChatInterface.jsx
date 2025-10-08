import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const ChatInterface = ({ filters }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: t('chat.welcome', 'Hello! I\'m your crime analysis assistant. I can help you analyze crime patterns, trends, and provide insights based on your data. What would you like to know?'),
      timestamp: new Date(),
      thinking: null,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await axios.post(
        'http://192.168.0.111:5001/api/chat',
        {
          query: userMessage.content,
          filters: filters || {},
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          timeout: 30000,
        }
      );

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.response || t('chat.error', 'I apologize, but I couldn\'t generate a response. Please try again.'),
        thinking: response.data.thinking,
        timestamp: new Date(),
        error: response.data.error,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: t('chat.connectionError', 'I\'m sorry, I encountered an error while processing your request. Please check your connection and try again.'),
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    const isError = message.error;

    return (
      <View
        key={message.id}
        style={{
          flexDirection: 'row',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginVertical: 4,
          marginHorizontal: 16,
        }}
      >
        <View
          style={{
            maxWidth: '80%',
            padding: 12,
            borderRadius: 16,
            backgroundColor: isUser
              ? theme.colors.primary
              : isError
              ? '#fee2e2'
              : theme.colors.surface,
            borderWidth: isError ? 1 : 0,
            borderColor: isError ? '#fca5a5' : 'transparent',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: isUser
                ? theme.colors.onPrimary
                : isError
                ? '#dc2626'
                : theme.colors.onSurface,
              lineHeight: 22,
            }}
          >
            {message.content}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: isUser
                ? theme.colors.primaryContainer
                : theme.colors.onSurfaceVariant,
              marginTop: 4,
              alignSelf: 'flex-end',
            }}
          >
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View
          style={{
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.outline,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.colors.onSurface,
              textAlign: 'center',
            }}
          >
            {t('chat.title', 'Crime Analysis Assistant')}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            {t('chat.subtitle', 'Ask questions about your crime data')}
          </Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}

          {isLoading && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                marginVertical: 4,
                marginHorizontal: 16,
              }}
            >
              <View
                style={{
                  maxWidth: '80%',
                  padding: 12,
                  borderRadius: 16,
                  backgroundColor: theme.colors.surface,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.onSurfaceVariant,
                      marginLeft: 8,
                    }}
                  >
                    {t('chat.analyzing', 'Analyzing your data...')}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View
          style={{
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: theme.colors.outline,
            backgroundColor: theme.colors.surface,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <TextInput
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder={t('chat.placeholder', 'Ask about crime trends, patterns...')}
              multiline
              maxLength={500}
              style={{
                flex: 1,
                minHeight: 40,
                maxHeight: 100,
                padding: 12,
                marginRight: 12,
                borderWidth: 1,
                borderColor: theme.colors.outline,
                borderRadius: 20,
                backgroundColor: theme.colors.surfaceVariant,
                color: theme.colors.onSurface,
                fontSize: 16,
                textAlignVertical: 'top',
              }}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: !inputMessage.trim() || isLoading
                  ? theme.colors.surfaceVariant
                  : theme.colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: !inputMessage.trim() || isLoading
                    ? theme.colors.onSurfaceVariant
                    : theme.colors.onPrimary,
                }}
              >
                {isLoading ? '...' : '↑'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: 12,
              color: theme.colors.onSurfaceVariant,
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            {t('chat.hint', '💡 Try asking: "What\'s the trend in crime rates?"')}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatInterface;