import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack } from 'expo-router';
import { colors } from '@/constants/colors';
import { Send, ArrowLeft } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/stores/auth-store';
import { router } from 'expo-router';

export default function ChatScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuthStore();
  const currentUserId = user?.id || '1';
  const flatListRef = useRef<FlatList>(null);

  // Get messages for this chat
  const { 
    data: messagesData, 
    isLoading, 
    error,
    refetch 
  } = trpc.messages.get.useQuery({
    chatId: chatId || '',
    limit: 50,
    offset: 0,
    markAsRead: true,
  }, {
    enabled: !!chatId,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time feel
  });

  // Send message mutation
  const sendMessageMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      setMessage('');
      setIsSending(false);
      refetch(); // Refetch messages after sending
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    },
    onError: (error: any) => {
      setIsSending(false);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message. Veuillez réessayer.');
      console.error('Send message error:', error);
    },
  });

  // Get other user info from messages
  const otherUser = messagesData?.messages.length > 0 
    ? messagesData.messages.find((msg: Message) => msg.senderId !== currentUserId)?.senderId
    : null;

  const handleSendMessage = async () => {
    if (!message.trim() || isSending || !chatId) return;

    setIsSending(true);
    
    // Extract other user ID from chat ID (format: userId1-userId2)
    const participants = chatId.split('-');
    const receiverId = participants.find(id => id !== currentUserId);
    
    if (!receiverId) {
      Alert.alert('Erreur', 'Impossible de déterminer le destinataire');
      setIsSending(false);
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        receiverId,
        content: message.trim(),
        chatId,
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.senderId === currentUserId;

    return (
      <View style={[
        styles.messageContainer,
        isMine ? styles.myMessage : styles.theirMessage
      ]}>
        <Text style={[
          styles.messageText,
          isMine ? styles.myMessageText : styles.theirMessageText
        ]}>
          {item.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp,
            isMine ? styles.myTimestamp : styles.theirTimestamp
          ]}>
            {item.timestamp}
          </Text>
          {isMine && (
            <Text style={styles.readStatus}>
              {item.read ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erreur lors du chargement des messages</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Conversation',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messagesData?.messages || []}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          inverted
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Écrivez votre message..."
            placeholderTextColor={colors.textLight}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
            editable={!isSending}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!message.trim() || isSending) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!message.trim() || isSending}
          >
            <Send size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  errorText: {
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: colors.white,
  },
  theirMessageText: {
    color: colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirTimestamp: {
    color: colors.textLight,
  },
  readStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    color: colors.text,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.textLight,
  },
});