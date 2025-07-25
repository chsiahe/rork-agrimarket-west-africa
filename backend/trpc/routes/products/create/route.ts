import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { addProductToStore } from "../get/route";

const createProductSchema = z.object({
  title: z.string().min(1),
  price: z.number().positive(),
  negotiable: z.boolean(),
  quantity: z.number().positive(),
  unitCode: z.string(),
  location: z.object({
    country: z.string(),
    regionId: z.string().optional(),
    region: z.string(),
    city: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }),
  categoryId: z.string(),
  category: z.string().optional(),
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

export default protectedProcedure
  .input(createProductSchema)
  .mutation(async ({ input, ctx }) => {
    // Generate unique ID for the product
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create new product with unique ID
    const newProduct = {
      id: productId,
      ...input,
      seller: {
        id: ctx.user.id,
        name: ctx.user.name || `${ctx.user.firstName || 'User'} ${ctx.user.lastName || ''}`,
        avatar: ctx.user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        location: `${ctx.user.location.city}, ${ctx.user.location.region || 'N/A'}`,
        verified: ctx.user.verified,
        rating: ctx.user.rating,
        joinedAt: ctx.user.joinedAt,
        phone: ctx.user.phone || '',
      },
      statistics: {
        views: 0,
        favorites: 0,
        inquiries: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real application with Supabase, you would:
    if (ctx.supabase) {
      const { data, error } = await ctx.supabase
        .from('products')
        .insert([{
          id: productId,
          title: input.title,
          description: input.description,
          price: input.price,
          negotiable: input.negotiable,
          quantity: input.quantity,
          unit_code: input.unitCode,
          category_id: input.categoryId,
          condition: input.condition,
          images: input.images,
          country: input.location.country,
          region_id: input.location.regionId,
          city: input.location.city,
          coordinates: input.location.coordinates ? 
            `POINT(${input.location.coordinates.longitude} ${input.location.coordinates.latitude})` : null,
          delivery_modes: input.delivery.modes,
          free_delivery: input.delivery.freeDelivery,
          delivery_fees: input.delivery.deliveryFees,
          allow_calls: input.allowCalls,
          start_date: input.availability.startDate,
          end_date: input.availability.endDate,
          status: 'active',
          seller_id: ctx.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la création du produit: ${error.message}`);
      }

      return data;
    }
    

    // For now, add to mock store
    addProductToStore(newProduct);

    return newProduct;
  });