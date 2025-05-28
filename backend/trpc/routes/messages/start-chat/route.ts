import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { getOrCreateChat, getUserInfo } from "../store";

export default protectedProcedure
  .input(z.object({
    otherUserId: z.string(),
  }))
  .mutation(({ input, ctx }) => {
    const userId = ctx.user?.id || '1';
    
    // Get or create chat ID
    const chatId = getOrCreateChat(userId, input.otherUserId);
    
    // Get other user info
    const otherUser = getUserInfo(input.otherUserId);

    return {
      chatId,
      otherUser,
    };
  });