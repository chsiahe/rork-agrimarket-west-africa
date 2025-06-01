import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { TRPCError } from "@trpc/server";

export default publicProcedure
  .input(z.object({
    firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    country: z.string().min(2, "Pays requis"),
    regionId: z.string().optional(),
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
    if (!ctx.supabase) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Service de base de données non disponible',
      });
    }

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await ctx.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            first_name: input.firstName,
            last_name: input.lastName,
            phone: input.phone,
            role: input.role,
            country: input.country,
            region_id: input.regionId,
            city: input.city,
          }
        }
      });

      if (authError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Erreur lors de la création du compte: ${authError.message}`,
        });
      }

      if (!authData.user) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la création du compte',
        });
      }

      // Wait a moment for the trigger to potentially create the profile
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create user profile data
      const profileData = {
        id: authData.user.id,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        role: input.role,
        country: input.country,
        region_id: input.regionId,
        city: input.city,
        coordinates: input.coordinates ? 
          `POINT(${input.coordinates.longitude} ${input.coordinates.latitude})` : null,
        verified: false,
        metadata: input.operatingAreas ? { operatingAreas: input.operatingAreas } : {},
        settings: {},
      };

      // Try to insert or update user profile
      const { data: userData, error: userError } = await ctx.supabase
        .from('users')
        .upsert([profileData], { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (userError) {
        // If profile creation fails, return basic user data
        const fallbackUser = {
          id: authData.user.id,
          email: input.email,
          first_name: input.firstName,
          last_name: input.lastName,
          phone: input.phone,
          role: input.role,
          country: input.country,
          region_id: input.regionId,
          city: input.city,
          verified: false,
          metadata: input.operatingAreas ? { operatingAreas: input.operatingAreas } : {},
          settings: {},
          created_at: authData.user.created_at,
          updated_at: new Date().toISOString(),
        };

        return {
          user: fallbackUser,
          token: authData.session?.access_token,
          message: "Compte créé avec succès"
        };
      }

      return {
        user: userData,
        token: authData.session?.access_token,
        message: "Compte créé avec succès"
      };

    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Une erreur inattendue est survenue lors de l\'inscription',
      });
    }
  });