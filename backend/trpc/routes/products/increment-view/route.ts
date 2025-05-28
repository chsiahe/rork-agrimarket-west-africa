import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export default publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(({ input }) => {
    // In a real app, this would increment the view count in the database
    console.log(`Incrementing view count for product ${input.id}`);
    return { success: true };
  });