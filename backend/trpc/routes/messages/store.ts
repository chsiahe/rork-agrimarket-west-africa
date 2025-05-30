// In-memory message store (in production, this would be a database)
import { Message, Chat } from '@/types/chat';

interface MessageStore {
  messages: Message[];
  chats: Map<string, Chat>;
}

const store: MessageStore = {
  messages: [],
  chats: new Map(),
};

// Helper function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Helper function to get or create chat between two users
export function getOrCreateChat(userId1: string, userId2: string): string {
  const chatId = [userId1, userId2].sort().join('-');
  
  if (!store.chats.has(chatId)) {
    const newChat: Chat = {
      id: chatId,
      participants: [userId1, userId2],
      unreadCount: 0,
    };
    store.chats.set(chatId, newChat);
  }
  
  return chatId;
}

// Add a new message
export function addMessage(message: Omit<Message, 'id' | 'timestamp'>): Message {
  const newMessage: Message = {
    ...message,
    id: generateId(),
    timestamp: new Date().toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
  };
  
  store.messages.push(newMessage);
  
  // Update chat's last message and unread count
  const chat = store.chats.get(message.chatId);
  if (chat) {
    chat.lastMessage = newMessage;
    // Increment unread count for receiver
    if (message.senderId !== message.receiverId) {
      chat.unreadCount += 1;
    }
  }
  
  return newMessage;
}

// Get messages for a specific chat
export function getMessagesForChat(chatId: string, limit: number = 50, offset: number = 0): { messages: Message[], hasMore: boolean } {
  const chatMessages = store.messages
    .filter(msg => msg.chatId === chatId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(offset, offset + limit);
  
  const hasMore = store.messages.filter(msg => msg.chatId === chatId).length > offset + limit;
  
  return {
    messages: chatMessages,
    hasMore
  };
}

// Get all chats for a user
export function getChatsForUser(userId: string): Chat[] {
  const userChats = Array.from(store.chats.values())
    .filter(chat => chat.participants.includes(userId))
    .sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
    });
  
  return userChats;
}

// Mark messages as read
export function markMessagesAsRead(chatId: string, userId: string): void {
  store.messages
    .filter(msg => msg.chatId === chatId && msg.receiverId === userId && !msg.read)
    .forEach(msg => {
      msg.read = true;
    });
  
  // Reset unread count for this chat
  const chat = store.chats.get(chatId);
  if (chat) {
    chat.unreadCount = 0;
  }
}

// Get user info (mock data for now)
export function getUserInfo(userId: string) {
  const users = {
    '1': { id: '1', name: 'Vous', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
    '2': { id: '2', name: 'Fatou Sow', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop' },
    '3': { id: '3', name: 'Moussa Ba', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
    '4': { id: '4', name: 'Aminata Diallo', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  };
  
  return users[userId as keyof typeof users] || { id: userId, name: 'Utilisateur', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' };
}

// Initialize with some sample data
export function initializeSampleData() {
  if (store.messages.length === 0) {
    // Create some sample chats and messages
    const chat1Id = getOrCreateChat('1', '2');
    const chat2Id = getOrCreateChat('1', '3');
    
    addMessage({
      chatId: chat1Id,
      senderId: '2',
      receiverId: '1',
      content: "Bonjour, est-ce que le maïs est toujours disponible ?",
      read: true,
    });
    
    addMessage({
      chatId: chat1Id,
      senderId: '1',
      receiverId: '2',
      content: "Oui, il est disponible. Quelle quantité voulez-vous ?",
      read: true,
    });
    
    addMessage({
      chatId: chat1Id,
      senderId: '2',
      receiverId: '1',
      content: "J'aimerais 50kg. Quel est votre meilleur prix ?",
      read: false,
    });
    
    addMessage({
      chatId: chat2Id,
      senderId: '3',
      receiverId: '1',
      content: "Le motoculteur est-il toujours disponible?",
      read: true,
    });
    
    addMessage({
      chatId: chat2Id,
      senderId: '1',
      receiverId: '3',
      content: "Oui, il est disponible. Voulez-vous le voir ?",
      read: false,
    });
  }
}