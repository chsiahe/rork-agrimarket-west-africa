import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";

const mockChats = [
  {
    id: '1',
    otherUser: {
      id: '2',
      name: 'Fatou Sow',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop'
    },
    lastMessage: {
      content: 'Merci pour votre réponse rapide!',
      timestamp: '14:30'
    },
    unreadCount: 2
  },
  {
    id: '2',
    otherUser: {
      id: '3',
      name: 'Moussa Ba',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
    },
    lastMessage: {
      content: 'Le motoculteur est-il toujours disponible?',
      timestamp: '12:15'
    },
    unreadCount: 0
  }
];

export default protectedProcedure
  .input(z.object({ userId: z.string() }))
  .query(({ input, ctx }) => {
    // In a real app, you would fetch chats for the specific user
    return mockChats;
  });