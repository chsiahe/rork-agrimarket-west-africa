import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { router } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';

export default function MessagesScreen() {
  const { user } = useAuthStore();
  const currentUserId = user?.id || '1';
  
  const { data: chats, isLoading } = trpc.messages.list.useQuery({
    userId: currentUserId
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MessageCircle size={48} color={colors.textLight} />
        <Text style={styles.emptyTitle}>Aucun message</Text>
        <Text style={styles.emptyText}>
          Vos conversations apparaîtront ici
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
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
              <Text style={styles.userName}>{item.otherUser.name}</Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage?.content}
              </Text>
            </View>
            <View style={styles.messageRight}>
              <Text style={styles.time}>{item.lastMessage?.timestamp}</Text>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  messageItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  messageRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  time: {
    fontSize: 12,
    color: colors.textLight,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});