import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export default publicProcedure
  .input(z.object({
    token: z.string(),
  }))
  .mutation(({ input }) => {
    // In a real app, you would invalidate the token here
    // For now, we just return success
    return {
      success: true,
      message: 'Déconnexion réussie',
    };
  });