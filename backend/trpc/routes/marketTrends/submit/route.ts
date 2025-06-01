import { protectedProcedure } from "../../../create-context";
import { z } from 'zod';
import { MarketTrendSubmission } from "@/types/marketTrend";
import type { Context } from "../../../create-context";

export const submitMarketPrice = protectedProcedure
  .input(
    z.object({
      categoryId: z.string(),
      category: z.string().optional(),
      productName: z.string().optional(),
      city: z.string(),
      regionId: z.string().optional(),
      region: z.string().optional(),
      country: z.string(),
      price: z.number().positive(),
      unitCode: z.string(),
    })
  )
  .mutation(async ({ ctx, input }: { ctx: Context; input: { categoryId: string; category?: string; productName?: string; city: string; regionId?: string; region?: string; country: string; price: number; unitCode: string } }) => {
    try {
      if (!ctx.supabase) {
        throw new Error("Database connection not available");
      }

      // Since we're using protectedProcedure, ctx.user should exist, but let's add a check
      if (!ctx.user) {
        throw new Error("User not authenticated");
      }

      const submission: MarketTrendSubmission = {
        userId: ctx.user.id,
        categoryId: input.categoryId,
        category: input.category || '',
        productName: input.productName || input.category || '', // Use productName if provided, otherwise use category
        city: input.city,
        regionId: input.regionId,
        region: input.region || '',
        country: input.country,
        price: input.price,
        unitCode: input.unitCode,
        createdAt: new Date().toISOString(),
      };

      const { data, error } = await ctx.supabase
        .from('market_trends')
        .insert([{
          user_id: submission.userId,
          category_id: submission.categoryId,
          product_name: submission.productName,
          price: submission.price,
          unit_code: submission.unitCode,
          country: submission.country,
          region_id: submission.regionId,
          city: submission.city,
          created_at: submission.createdAt,
        }])
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