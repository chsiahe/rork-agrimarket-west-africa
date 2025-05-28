import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { getOrCreateChat, getUserInfo } from "../store";

export default protectedProcedure
  .input(z.object({
    otherUserId: z.string(),
  }))
  .mutation(({ input, ctx }) => {
    const userId = ctx.user?.id || '1'; // In real app, get from authenticated user
    
    // Create or get existing chat
    const chatId = getOrCreateChat(userId, input.otherUserId);
    const otherUser = getUserInfo(input.otherUserId);
    
    return {
      chatId,
      otherUser,
    };
  });