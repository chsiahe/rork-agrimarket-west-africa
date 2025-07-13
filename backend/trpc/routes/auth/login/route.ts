import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { TRPCError } from "@trpc/server";

export default publicProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.supabase) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Service de base de données non disponible',
      });
    }

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (authError) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Email ou mot de passe incorrect',
        });
      }

      if (!authData.user || !authData.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Email ou mot de passe incorrect',
        });
      }

      // Try to fetch user data from users table
      let userData = null;
      try {
        const { data: fetchedUserData, error: userError } = await ctx.supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (userError) {
          // If user profile doesn't exist, create it
          if (userError.code === 'PGRST116') {
            const basicProfile = {
              id: authData.user.id,
              email: input.email,
              first_name: authData.user.user_metadata?.first_name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'Utilisateur',
              last_name: authData.user.user_metadata?.last_name || '',
              phone: authData.user.user_metadata?.phone || null,
              role: (authData.user.user_metadata?.role as any) || 'buyer',
              verified: false,
              country: authData.user.user_metadata?.country || 'SN',
              region_id: authData.user.user_metadata?.region_id || null,
              city: authData.user.user_metadata?.city || null,
              coordinates: null,
              metadata: authData.user.user_metadata || {},
              settings: {},
            };
            
            const { data: newUserData, error: insertError } = await ctx.supabase
              .from('users')
              .insert([basicProfile])
              .select()
              .single();
              
            if (insertError) {
              console.error('Failed to create user profile:', insertError);
              // If insert fails, return basic profile as fallback
              userData = {
                ...basicProfile,
                created_at: authData.user.created_at,
                updated_at: new Date().toISOString(),
              };
            } else {
              userData = newUserData;
            }
          } else {
            console.error('Error fetching user data:', userError);
            // Create a fallback user profile from auth data
            userData = {
              id: authData.user.id,
              email: input.email,
              first_name: authData.user.user_metadata?.first_name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'Utilisateur',
              last_name: authData.user.user_metadata?.last_name || '',
              phone: authData.user.user_metadata?.phone || null,
              role: (authData.user.user_metadata?.role as any) || 'buyer',
              verified: false,
              country: authData.user.user_metadata?.country || 'SN',
              region_id: authData.user.user_metadata?.region_id || null,
              city: authData.user.user_metadata?.city || null,
              coordinates: null,
              metadata: authData.user.user_metadata || {},
              settings: {},
              created_at: authData.user.created_at,
              updated_at: new Date().toISOString(),
            };
          }
        } else {
          userData = fetchedUserData;
        }
      } catch (dbError) {
        console.error('Database error during login:', dbError);
        // Create a fallback user profile from auth data
        userData = {
          id: authData.user.id,
          email: input.email,
          first_name: authData.user.user_metadata?.first_name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'Utilisateur',
          last_name: authData.user.user_metadata?.last_name || '',
          phone: authData.user.user_metadata?.phone || null,
          role: (authData.user.user_metadata?.role as any) || 'buyer',
          verified: false,
          country: authData.user.user_metadata?.country || 'SN',
          region_id: authData.user.user_metadata?.region_id || null,
          city: authData.user.user_metadata?.city || null,
          coordinates: null,
          metadata: authData.user.user_metadata || {},
          settings: {},
          created_at: authData.user.created_at,
          updated_at: new Date().toISOString(),
        };
      }

      return {
        user: userData,
        token: authData.session.access_token,
      };

    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Une erreur inattendue est survenue lors de la connexion',
      });
    }
  });