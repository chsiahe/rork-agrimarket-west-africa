import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { User } from "@/types/user";

export default publicProcedure
  .input(z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    country: z.string().min(2, "Pays requis"),
    region: z.string().min(2, "Région requise"),
    city: z.string().min(2, "Ville requise"),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    role: z.enum(['farmer', 'buyer', 'cooperative', 'distributor']),
    operatingAreas: z.object({
      regions: z.array(z.string()),
      maxDeliveryDistance: z.number(),
      deliveryZones: z.array(z.string())
    }).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    // In a real application with Supabase, you would:
    /*
    if (ctx.supabase) {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await ctx.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
            phone: input.phone,
          }
        }
      });

      if (authError) {
        throw new Error(`Erreur lors de la création du compte: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte');
      }

      // 2. Create user profile in users table
      const { data: userData, error: userError } = await ctx.supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          name: input.name,
          email: input.email,
          phone: input.phone,
          role: input.role,
          location_country: input.country,
          location_region: input.region,
          location_city: input.city,
          location_coordinates: input.coordinates,
          operating_areas: input.operatingAreas,
          verified: false,
          rating: 0,
          total_ratings: 0,
          total_sales: 0,
          total_purchases: 0,
          joined_at: new Date().toISOString(),
          listings: [],
          reviews: [],
        }])
        .select()
        .single();

      if (userError) {
        throw new Error(`Erreur lors de la création du profil: ${userError.message}`);
      }

      return {
        user: userData,
        token: authData.session?.access_token,
        message: "Compte créé avec succès"
      };
    }
    */
    
    // For now, create a mock user
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: input.name,
      email: input.email,
      phone: input.phone,
      avatar: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop`,
      role: input.role,
      location: {
        country: input.country,
        region: input.region,
        city: input.city,
        coordinates: input.coordinates
      },
      operatingAreas: input.operatingAreas,
      verified: false,
      rating: 0,
      totalRatings: 0,
      totalSales: 0,
      totalPurchases: 0,
      joinedAt: new Date().toISOString(),
      listings: [],
      reviews: [],
      bio: undefined,
      languages: ['Français'],
      socialMedia: undefined,
      businessInfo: undefined,
    };

    // Generate a simple token (in real app, use JWT)
    const token = newUser.id;

    return {
      user: newUser,
      token,
      message: "Compte créé avec succès"
    };
  });