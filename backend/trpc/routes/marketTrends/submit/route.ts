import { protectedProcedure } from "../create-context";
import { z } from 'zod';
import { MarketTrendSubmission } from "@/types/marketTrend";
import { Context } from "../create-context";

export const submitMarketPrice = protectedProcedure
  .input(
    z.object({
      category: z.string(),
      city: z.string(),
      region: z.string(),
      country: z.string(),
      price: z.number().positive(),
      unit: z.string(),
    })
  )
  .mutation(async ({ ctx, input }: { ctx: Context; input: { category: string; city: string; region: string; country: string; price: number; unit: string } }) => {
    try {
      if (!ctx.supabase) {
        throw new Error("Database connection not available");
      }

      const submission: MarketTrendSubmission = {
        userId: ctx.user.id,
        category: input.category,
        city: input.city,
        region: input.region,
        country: input.country,
        price: input.price,
        unit: input.unit,
        createdAt: new Date().toISOString(),
      };

      const { data, error } = await ctx.supabase
        .from('market_trends')
        .insert([submission])
        .select();

      if (error) {
        throw new Error(`Failed to submit market price: ${error.message}`);
      }

      return {
        success: true,
        data: data?.[0],
      };
    } catch (error) {
      console.error("Error in submitMarketPrice:", error);
      throw new Error(error instanceof Error ? error.message : 'Failed to submit market price');
    }
  });