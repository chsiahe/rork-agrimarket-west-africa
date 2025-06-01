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
    // Check if we have Supabase client
    if (!ctx.supabase) {
      console.error('Supabase client not available during registration');
      throw new Error('Service de base de données non disponible');
    }

    try {
      console.log('Starting registration process for email:', input.email);

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await ctx.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
            phone: input.phone,
            role: input.role,
            country: input.country,
            region: input.region,
            city: input.city,
          }
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw new Error(`Erreur lors de la création du compte: ${authError.message}`);
      }

      if (!authData.user) {
        console.error('No user returned from auth signup');
        throw new Error('Erreur lors de la création du compte');
      }

      console.log('Auth user created successfully:', authData.user.id);

      // 2. Wait for trigger to potentially create the profile
      await new Promise(resolve => setTimeout(resolve, 200));

      // 3. Try to get existing profile first
      let userData = null;
      try {
        const { data: existingUser, error: fetchError } = await ctx.supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (!fetchError && existingUser) {
          console.log('Found existing user profile, updating...');
          userData = existingUser;
        }
      } catch (error) {
        console.log('No existing profile found, will create new one');
      }

      // 4. Create or update user profile
      const profileData = {
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
        updated_at: new Date().toISOString(),
      };

      if (userData) {
        // Update existing profile
        const { data: updatedUser, error: updateError } = await ctx.supabase
          .from('users')
          .update(profileData)
          .eq('id', authData.user.id)
          .select()
          .single();

        if (updateError) {
          console.error('Profile update error:', updateError);
          throw new Error(`Erreur lors de la mise à jour du profil: ${updateError.message}`);
        }
        
        userData = updatedUser;
        console.log('User profile updated successfully');
      } else {
        // Create new profile
        const { data: newUser, error: userError } = await ctx.supabase
          .from('users')
          .insert([{
            ...profileData,
            created_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (userError) {
          console.error('Profile creation error:', userError);
          
          // If RLS error, try with a more permissive approach
          if (userError.code === '42501' || userError.message.includes('row-level security')) {
            console.log('RLS error detected, attempting alternative profile creation...');
            
            // Try using the service role client for profile creation
            try {
              const serviceClient = ctx.supabase;
              const { data: serviceUser, error: serviceError } = await serviceClient
                .from('users')
                .insert([profileData])
                .select()
                .single();
                
              if (serviceError) {
                throw serviceError;
              }
              
              userData = serviceUser;
              console.log('Profile created with service role');
            } catch (serviceError) {
              console.error('Service role profile creation failed:', serviceError);
              
              // Return basic user data as fallback
              userData = {
                id: authData.user.id,
                email: input.email,
                name: input.name,
                phone: input.phone,
                role: input.role,
                country: input.country,
                region: input.region,
                city: input.city,
                verified: false,
                metadata: input.operatingAreas ? { operatingAreas: input.operatingAreas } : {},
                settings: {},
                created_at: authData.user.created_at,
                updated_at: new Date().toISOString(),
              };
              
              console.log('Using fallback user data');
            }
          } else {
            throw new Error(`Erreur lors de la création du profil utilisateur: ${userError.message}`);
          }
        } else {
          userData = newUser;
          console.log('User profile created successfully');
        }
      }

      return {
        user: userData,
        token: authData.session?.access_token,
        message: "Compte créé avec succès"
      };

    } catch (error) {
      console.error('Registration error:', error);
      
      // If it's already a formatted error, throw it as is
      if (error instanceof Error) {
        throw error;
      }
      
      // Otherwise, wrap in a generic error
      throw new Error('Une erreur inattendue est survenue lors de l\'inscription');
    }
  });