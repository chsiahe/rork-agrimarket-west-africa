import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { router, Stack } from 'expo-router';
import { MessageCircle, Plus } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useState } from 'react';
import { ChatListItem } from '@/types/chat';

export default function MessagesScreen() {
  const { user } = useAuthStore();
  const currentUserId = user?.id || '1';
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    data: chats, 
    isLoading, 
    error,
    refetch 
  } = trpc.messages.list.useQuery({
    userId: currentUserId
  }, {
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatLastMessageTime = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date();
    const [hours, minutes] = timestamp.split(':');
    messageTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const diffInHours = Math.abs(now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return timestamp;
    } else {
      return messageTime.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const renderChatItem = ({ item }: { item: ChatListItem }) => (
    <TouchableOpacity 
      style={styles.messageItem}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <Image
        source={item.otherUser.avatar}
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.userName}>{item.otherUser.name}</Text>
          {item.lastMessage && (
            <Text style={styles.time}>
              {formatLastMessageTime(item.lastMessage.timestamp)}
            </Text>
          )}
        </View>
        <View style={styles.messagePreview}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage ? (
              <>
                {item.lastMessage.senderId === currentUserId && (
                  <Text style={styles.youPrefix}>Vous: </Text>
                )}
                {item.lastMessage.content}
              </>
            ) : (
              'Aucun message'
            )}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !chats) {
    return (
      <>
        <Stack.Screen options={{ title: 'Messages' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Messages' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur lors du chargement</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <>
        <Stack.Screen 
          options={{ 
            title: 'Messages',
            headerRight: () => (
              <TouchableOpacity style={styles.headerButton}>
                <Plus size={24} color={colors.primary} />
              </TouchableOpacity>
            ),
          }} 
        />
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>Aucun message</Text>
          <Text style={styles.emptyText}>
            Vos conversations apparaîtront ici.{'\n'}
            Contactez un vendeur pour commencer à discuter.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Messages',
          headerRight: () => (
            <TouchableOpacity style={styles.headerButton}>
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  headerButton: {
    padding: 8,
  },
  messageItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  messageContent: {
    flex: 1,
    marginLeft: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 8,
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textLight,
    flex: 1,
  },
  youPrefix: {
    fontWeight: '500',
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});