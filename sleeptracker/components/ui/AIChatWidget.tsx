import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

import { Colors } from '../../constants/Colors';
import { aiChatService, ChatMessage } from '../../services/aiChatService';

const { width } = Dimensions.get('window');

interface AIChatWidgetProps {
  style?: any;
}

export function AIChatWidget({ style }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      text: '🌙 Merhaba! Ben uyku asistanınız. Size nasıl yardımcı olabilirim?',
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([welcomeMessage]);
    
    // Load quick suggestions
    setQuickSuggestions(aiChatService.getQuickSuggestions());
    
    // Start pulse animation
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleOpenChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(true);
    pulseAnim.stopAnimation();
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    startPulseAnimation();
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    setInputText('');
    setIsLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Get AI response
      const response = await aiChatService.processMessage(messageText, messages);
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Üzgünüm, şu anda bir sorun yaşıyorum. Lütfen tekrar deneyin.',
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const ChatBubble = ({ message }: { message: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      message.isUser ? styles.userMessageContainer : styles.aiMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        message.isUser ? styles.userBubble : styles.aiBubble
      ]}>
        <Text style={[
          styles.messageText,
          message.isUser ? styles.userMessageText : styles.aiMessageText
        ]}>
          {message.text}
        </Text>
      </View>
      <Text style={styles.messageTime}>
        {message.timestamp.toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );

  const QuickSuggestion = ({ text }: { text: string }) => (
    <TouchableOpacity
      style={styles.suggestionButton}
      onPress={() => handleSendMessage(text)}
    >
      <Text style={styles.suggestionText}>{text}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      {/* Mini Widget */}
      <TouchableOpacity
        style={[styles.widget, style]}
        onPress={handleOpenChat}
        activeOpacity={0.8}
      >
                 <LinearGradient
           colors={Colors.gradients.deepSleep as any}
           style={styles.widgetGradient}
           start={{ x: 0, y: 0 }}
           end={{ x: 1, y: 1 }}
         >
          <Animated.View style={[
            styles.widgetContent,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <Ionicons name="chatbubble-ellipses" size={16} color={Colors.neutral[100]} />
            <Text style={styles.widgetText}>Uyku Asistanı</Text>
            <View style={styles.onlineIndicator} />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Full Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseChat}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
                     <LinearGradient
             colors={Colors.gradients.night as any}
             style={styles.chatContainer}
           >
            {/* Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.avatarContainer}>
                                     <LinearGradient
                     colors={Colors.gradients.deepSleep as any}
                     style={styles.avatar}
                   >
                    <Ionicons name="sparkles" size={20} color={Colors.neutral[100]} />
                  </LinearGradient>
                  <View style={styles.onlineIndicatorHeader} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Uyku Asistanı AI</Text>
                  <Text style={styles.headerSubtitle}>Her zaman burada 🌙</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseChat}
              >
                <Ionicons name="close" size={24} color={Colors.neutral[100]} />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map(message => (
                <ChatBubble key={message.id} message={message} />
              ))}
              
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingBubble}>
                    <View style={styles.typingIndicator}>
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                    </View>
                  </View>
                </View>
              )}

              {/* Quick Suggestions */}
              {messages.length <= 1 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Hızlı sorular:</Text>
                  {quickSuggestions.map((suggestion, index) => (
                    <QuickSuggestion key={index} text={suggestion} />
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Uyku hakkında soru sorun..."
                  placeholderTextColor={Colors.neutral[400]}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    { opacity: inputText.trim() ? 1 : 0.5 }
                  ]}
                  onPress={() => handleSendMessage()}
                  disabled={!inputText.trim() || isLoading}
                >
                  <Ionicons name="send" size={20} color={Colors.neutral[100]} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Widget styles
  widget: {
    position: 'absolute',
    top: hp(2),
    right: wp(4),
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  widgetGradient: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  widgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  widgetText: {
    color: Colors.neutral[100],
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff88',
    marginLeft: 4,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(6),
    paddingBottom: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicatorHeader: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00ff88',
    borderWidth: 2,
    borderColor: Colors.dark.background,
  },
  headerTitle: {
    color: Colors.neutral[100],
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: Colors.neutral[400],
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Messages styles
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: wp(5),
    paddingBottom: hp(2),
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: Colors.primary[600],
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: Colors.neutral[100],
  },
  aiMessageText: {
    color: Colors.neutral[100],
  },
  messageTime: {
    color: Colors.neutral[500],
    fontSize: 10,
    marginTop: 4,
    marginHorizontal: 4,
  },

  // Loading styles
  loadingContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  loadingBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neutral[400],
    marginHorizontal: 2,
  },

  // Suggestions styles
  suggestionsContainer: {
    marginTop: 20,
  },
  suggestionsTitle: {
    color: Colors.neutral[300],
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  suggestionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionText: {
    color: Colors.neutral[200],
    fontSize: 14,
  },

  // Input styles
  inputContainer: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(3),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    color: Colors.neutral[100],
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
}); 