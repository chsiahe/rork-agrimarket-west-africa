import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export default publicProcedure
  .input(z.object({
    chatId: z.string(),
    senderId: z.string(),
    receiverId: z.string(),
    content: z.string().min(1)
  }))
  .mutation(({ input }) => {
    // In a real app, this would save to database
    const newMessage = {
      id: Math.random().toString(36).substr(2, 9),
      ...input,
      timestamp: new Date().toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      read: false
    };

    return newMessage;
  });