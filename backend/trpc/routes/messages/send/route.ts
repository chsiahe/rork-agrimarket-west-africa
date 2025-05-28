import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { addMessage, getOrCreateChat } from "../store";

export default protectedProcedure
  .input(z.object({
    receiverId: z.string(),
    content: z.string().min(1).max(1000),
    chatId: z.string().optional(),
  }))
  .mutation(({ input, ctx }) => {
    const senderId = ctx.user?.id || '1'; // In real app, get from authenticated user
    
    // Get or create chat ID
    const chatId = input.chatId || getOrCreateChat(senderId, input.receiverId);
    
    // Add the message
    const newMessage = addMessage({
      chatId,
      senderId,
      receiverId: input.receiverId,
      content: input.content,
      read: false,
    });

    return {
      success: true,
      message: newMessage,
    };
  });