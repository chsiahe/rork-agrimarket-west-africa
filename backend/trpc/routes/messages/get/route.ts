import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

const mockMessages = [
  {
    id: '1',
    senderId: '2',
    receiverId: '1',
    content: "Bonjour, est-ce que le maïs est toujours disponible ?",
    timestamp: "10:30",
    read: true,
  },
  {
    id: '2',
    senderId: '1',
    receiverId: '2',
    content: "Oui, il est disponible. Quelle quantité voulez-vous ?",
    timestamp: "10:32",
    read: true,
  },
  {
    id: '3',
    senderId: '2',
    receiverId: '1',
    content: "J'aimerais 50kg. Quel est votre meilleur prix ?",
    timestamp: "10:35",
    read: false,
  }
];

export default publicProcedure
  .input(z.object({
    chatId: z.string(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0)
  }))
  .query(({ input }) => {
    // In a real app, filter by chatId
    const messages = mockMessages.slice(input.offset, input.offset + input.limit);
    return {
      messages: messages.reverse(), // Most recent first
      hasMore: input.offset + input.limit < mockMessages.length
    };
  });