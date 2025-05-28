import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { getChatsForUser, getUserInfo, initializeSampleData } from "../store";

export default protectedProcedure
  .input(z.object({ 
    userId: z.string().optional() 
  }))
  .query(({ input, ctx }) => {
    // Initialize sample data if needed
    initializeSampleData();
    
    const userId = input.userId || ctx.user?.id || '1'; // In real app, get from authenticated user
    
    // Get all chats for the user
    const chats = getChatsForUser(userId);
    
    // Transform chats to include other user info
    const transformedChats = chats.map(chat => {
      const otherUserId = chat.participants.find(id => id !== userId) || '';
      const otherUser = getUserInfo(otherUserId);
      
      return {
        id: chat.id,
        otherUser,
        lastMessage: chat.lastMessage ? {
          content: chat.lastMessage.content,
          timestamp: chat.lastMessage.timestamp,
          senderId: chat.lastMessage.senderId,
        } : null,
        unreadCount: chat.unreadCount,
      };
    });
    
    return transformedChats;
  });