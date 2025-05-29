import { publicProcedure } from "../../create-context";
import { z } from 'zod';
import { MarketTrendAggregate } from "@/types/marketTrend";
import type { Context } from "../../create-context";

export const getMarketTrends = publicProcedure
  .input(
    z.object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional(),
      limitCategories: z.number().default(5),
      days: z.number().default(30),
    })
  )
  .query(async ({ ctx, input }: { ctx: Context; input: { country?: string; region?: string; city?: string; limitCategories: number; days: number } }) => {
    try {
      if (!ctx.supabase) {
        // Mock data fallback
        return generateMockTrends(input.city || input.region || input.country || 'Dakar');
      }

      const now = new Date();
      const pastDate = new Date(now.setDate(now.getDate() - input.days)).toISOString();

      let query = ctx.supabase
        .from('market_trends')
        .select('*')
        .gte('createdAt', pastDate);

      if (input.country) {
        query = query.eq('country', input.country);
      }
      if (input.region) {
        query = query.eq('region', input.region);
      }
      if (input.city) {
        query = query.eq('city', input.city);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Database error:", error);
        throw new Error(`Failed to fetch market trends: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Aggregate data by category and city
      const aggregatedData: MarketTrendAggregate[] = [];
      const groupedByCategoryCity: Record<string, any[]> = {};

      data.forEach((entry: any) => {
        const key = `${entry.category}-${entry.city}`;
        if (!groupedByCategoryCity[key]) {
          groupedByCategoryCity[key] = [];
        }
        groupedByCategoryCity[key].push(entry);
      });

      Object.entries(groupedByCategoryCity).forEach(([key, entries]) => {
        const category = key.split('-')[0];
        const city = key.split('-')[1];
        const prices = entries.map(e => e.price);
        const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const unit = entries[0].unit || 'kg';

        // Generate data points for chart (group by date)
        const dataPoints = generateDataPoints(entries, input.days);

        aggregatedData.push({
          category,
          city,
          averagePrice: Math.round(averagePrice),
          unit,
          dataPoints,
          submissions: entries.length,
        });
      });

      // Sort by number of submissions to show most reliable data
      return aggregatedData
        .sort((a, b) => b.submissions - a.submissions)
        .slice(0, input.limitCategories);
    } catch (error) {
      console.error("Error in getMarketTrends:", error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch market trends');
    }
  });

// Helper to generate data points for chart
function generateDataPoints(entries: any[], days: number) {
  const sortedEntries = entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const dataPoints = [];
  
  // Group by day or show as is based on range
  if (days > 7) {
    const dailyAverages: Record<string, { sum: number; count: number }> = {};
    
    sortedEntries.forEach((entry: any) => {
      const date = entry.createdAt.split('T')[0]; // YYYY-MM-DD
      if (!dailyAverages[date]) {
        dailyAverages[date] = { sum: 0, count: 0 };
      }
      dailyAverages[date].sum += entry.price;
      dailyAverages[date].count += 1;
    });
    
    for (const [date, data] of Object.entries(dailyAverages)) {
      dataPoints.push({
        date,
        price: Math.round(data.sum / data.count)
      });
    }
  } else {
    sortedEntries.forEach((entry: any) => {
      const date = new Date(entry.createdAt).toISOString().split('T')[0];
      dataPoints.push({
        date,
        price: Math.round(entry.price)
      });
    });
  }
  
  return dataPoints;
}

// Mock data for when database is not available
function generateMockTrends(location: string): MarketTrendAggregate[] {
  const now = new Date();
  const baseDate = now.toISOString().split('T')[0].slice(0, 8); // YYYY-MM
  
  return [
    {
      category: 'Fruits',
      city: location,
      averagePrice: 800,
      unit: 'kg',
      submissions: 12,
      dataPoints: [
        { date: `${baseDate}-01`, price: 750 },
        { date: `${baseDate}-05`, price: 820 },
        { date: `${baseDate}-10`, price: 780 },
        { date: `${baseDate}-15`, price: 850 },
        { date: `${baseDate}-20`, price: 800 }
      ]
    },
    {
      category: 'Légumes',
      city: location,
      averagePrice: 500,
      unit: 'kg',
      submissions: 15,
      dataPoints: [
        { date: `${baseDate}-01`, price: 480 },
        { date: `${baseDate}-05`, price: 520 },
        { date: `${baseDate}-10`, price: 490 },
        { date: `${baseDate}-15`, price: 510 },
        { date: `${baseDate}-20`, price: 500 }
      ]
    },
    {
      category: 'Céréales',
      city: location,
      averagePrice: 300,
      unit: 'kg',
      submissions: 8,
      dataPoints: [
        { date: `${baseDate}-01`, price: 280 },
        { date: `${baseDate}-05`, price: 310 },
        { date: `${baseDate}-10`, price: 290 },
        { date: `${baseDate}-15`, price: 320 },
        { date: `${baseDate}-20`, price: 300 }
      ]
    }
  ];
}