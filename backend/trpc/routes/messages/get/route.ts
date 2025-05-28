import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { getMessagesForChat, markMessagesAsRead, initializeSampleData } from "../store";

export default protectedProcedure
  .input(z.object({
    chatId: z.string(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
    markAsRead: z.boolean().default(true),
  }))
  .query(({ input, ctx }) => {
    // Initialize sample data if needed
    initializeSampleData();
    
    const userId = ctx.user?.id || '1';
    
    // Get messages for the chat
    const result = getMessagesForChat(input.chatId, input.limit, input.offset);
    
    // Mark messages as read if requested
    if (input.markAsRead) {
      markMessagesAsRead(input.chatId, userId);
    }
    
    return result;
  });