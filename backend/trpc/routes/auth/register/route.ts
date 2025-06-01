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
    if (ctx.supabase) {
      try {
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
          console.error('Auth signup error:', authError);
          throw new Error(`Erreur lors de la création du compte: ${authError.message}`);
        }

        if (!authData.user) {
          throw new Error('Erreur lors de la création du compte');
        }

        // 2. Wait a moment for the trigger to potentially create the profile
        await new Promise(resolve => setTimeout(resolve, 100));

        // 3. Check if profile already exists (created by trigger)
        const { data: existingUser } = await ctx.supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        let userData;
        
        if (existingUser) {
          // Update existing profile with registration data
          const { data: updatedUser, error: updateError } = await ctx.supabase
            .from('users')
            .update({
              name: input.name,
              phone: input.phone,
              role: input.role,
              country: input.country,
              region: input.region,
              city: input.city,
              coordinates: input.coordinates ? `POINT(${input.coordinates.longitude} ${input.coordinates.latitude})` : null,
              metadata: input.operatingAreas ? { operatingAreas: input.operatingAreas } : {},
              updated_at: new Date().toISOString(),
            })
            .eq('id', authData.user.id)
            .select()
            .single();

          if (updateError) {
            console.error('Profile update error:', updateError);
            throw new Error(`Erreur lors de la mise à jour du profil: ${updateError.message}`);
          }
          
          userData = updatedUser;
        } else {
          // Create new profile if trigger didn't work
          const { data: newUser, error: userError } = await ctx.supabase
            .from('users')
            .insert([{
              id: authData.user.id,
              name: input.name,
              email: input.email,
              phone: input.phone,
              role: input.role,
              country: input.country,
              region: input.region,
              city: input.city,
              coordinates: input.coordinates ? `POINT(${input.coordinates.longitude} ${input.coordinates.latitude})` : null,
              verified: false,
              metadata: input.operatingAreas ? { operatingAreas: input.operatingAreas } : {},
              settings: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }])
            .select()
            .single();

          if (userError) {
            console.error('Profile creation error:', userError);
            throw new Error(`Erreur lors de la création du profil: ${userError.message}`);
          }
          
          userData = newUser;
        }

        return {
          user: userData,
          token: authData.session?.access_token,
          message: "Compte créé avec succès"
        };
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    }
    
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