import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { addProductToStore } from "../list/route";

const createProductSchema = z.object({
  title: z.string().min(1),
  price: z.number().positive(),
  negotiable: z.boolean(),
  quantity: z.number().positive(),
  unit: z.string(),
  location: z.object({
    country: z.string(),
    region: z.string(),
    city: z.string(),
  }),
  category: z.string(),
  description: z.string(),
  condition: z.enum(['new', 'fresh', 'used', 'needs_repair']),
  images: z.array(z.string()).min(1).max(5),
  availability: z.object({
    startDate: z.string(),
    endDate: z.string().optional(),
    duration: z.string().optional(),
  }),
  delivery: z.object({
    modes: z.array(z.enum(['local', 'regional', 'pickup'])).min(1),
    freeDelivery: z.boolean(),
    deliveryFees: z.number().optional(),
  }),
  allowCalls: z.boolean(),
});

export default publicProcedure
  .input(createProductSchema)
  .mutation(({ input }) => {
    // Create new product with unique ID
    const newProduct = {
      id: Math.random().toString(36).substr(2, 9),
      ...input,
      seller: {
        id: '1', // Current user ID - in real app this would come from auth context
        name: 'Amadou Diallo',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        verified: true,
        allowCalls: input.allowCalls
      },
      statistics: {
        views: 0,
        contacts: 0
      },
      createdAt: new Date().toISOString()
    };

    // Add to global products store
    addProductToStore(newProduct);

    return newProduct;
  });