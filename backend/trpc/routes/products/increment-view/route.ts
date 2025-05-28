import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { getProductById, updateProductStats } from "../get/route";

export default publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(({ input }) => {
    const product = getProductById(input.id);
    
    if (!product) {
      throw new Error('Product not found');
    }

    // Increment view count
    const newViewCount = product.statistics.views + 1;
    updateProductStats(input.id, { views: newViewCount });

    return { success: true, views: newViewCount };
  });