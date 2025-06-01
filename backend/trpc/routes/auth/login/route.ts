import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { TRPCError } from "@trpc/server";

export default publicProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }))
  .mutation(async ({ input, ctx }) => {
    // Check if we have Supabase client
    if (!ctx.supabase) {
      console.error('Supabase client not available during login attempt for email:', input.email);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Service de base de données non disponible',
      });
    }

    try {
      console.log('Attempting login for email:', input.email);

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (authError) {
        console.error('Auth error for email:', input.email, 'Error:', authError.message);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Email ou mot de passe incorrect',
        });
      }

      if (!authData.user || !authData.session) {
        console.error('No user or session returned for email:', input.email);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Email ou mot de passe incorrect',
        });
      }

      console.log('Auth successful for user ID:', authData.user.id);

      // Fetch additional user data from your users table
      let userData = null;
      try {
        const { data: fetchedUser, error: userError } = await ctx.supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (userError) {
          console.error('User data fetch error for user ID:', authData.user.id, 'Error:', userError.message);
          
          // If no user found, create a basic profile
          if (userError.code === 'PGRST116') { // No rows returned
            console.log('No user profile found, creating basic profile for user ID:', authData.user.id);
            
            const basicProfile = {
              id: authData.user.id,
              email: input.email,
              name: authData.user.user_metadata?.name || 
                    authData.user.user_metadata?.full_name || 
                    authData.user.email?.split('@')[0] || 
                    'Utilisateur',
              phone: authData.user.user_metadata?.phone || '',
              role: 'buyer',
              verified: false,
              country: 'SN',
              region: authData.user.user_metadata?.region || null,
              city: authData.user.user_metadata?.city || null,
              coordinates: null,
              metadata: authData.user.user_metadata || {},
              settings: {},
              created_at: authData.user.created_at,
              updated_at: new Date().toISOString(),
            };
            
            try {
              const { data: newUserData, error: insertError } = await ctx.supabase
                .from('users')
                .insert([basicProfile])
                .select()
                .single();
                
              if (insertError) {
                console.error('Error creating user profile during login:', insertError.message);
                // Use basic profile as fallback
                userData = basicProfile;
              } else {
                console.log('User profile created successfully during login');
                userData = newUserData;
              }
            } catch (createError) {
              console.error('Failed to create user profile during login:', createError);
              // Use basic profile as fallback
              userData = basicProfile;
            }
          } else {
            // Other database error
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Erreur lors de la récupération des données utilisateur',
            });
          }
        } else {
          userData = fetchedUser;
          console.log('User data fetched successfully for user ID:', authData.user.id);
        }
      } catch (error) {
        console.error('Unexpected error fetching user data:', error);
        
        // Create fallback user data from auth info
        userData = {
          id: authData.user.id,
          email: input.email,
          name: authData.user.user_metadata?.name || 
                authData.user.user_metadata?.full_name || 
                authData.user.email?.split('@')[0] || 
                'Utilisateur',
          phone: authData.user.user_metadata?.phone || '',
          role: 'buyer',
          verified: false,
          country: 'SN',
          region: authData.user.user_metadata?.region || null,
          city: authData.user.user_metadata?.city || null,
          coordinates: null,
          metadata: authData.user.user_metadata || {},
          settings: {},
          created_at: authData.user.created_at,
          updated_at: new Date().toISOString(),
        };
      }

      console.log('Login successful for email:', input.email);
      
      // Return user data and session token
      return {
        user: userData,
        token: authData.session.access_token,
      };

    } catch (error) {
      console.error('Unexpected login error for email:', input.email, 'Error:', error);
      
      // If it's already a TRPC error, rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      // Otherwise wrap in a TRPC error
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Une erreur inattendue est survenue lors de la connexion',
      });
    }
  });