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

      // Fetch user data from users table
      const { data: userData, error: userError } = await ctx.supabase
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
            name: authData.user.user_metadata?.name || 
                  authData.user.user_metadata?.full_name || 
                  authData.user.email?.split('@')[0] || 
                  'Utilisateur',
            phone: authData.user.user_metadata?.phone || null,
            role: 'buyer',
            verified: false,
            country: 'SN',
            region: authData.user.user_metadata?.region || null,
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
            // If insert fails, return basic profile as fallback
            return {
              user: {
                ...basicProfile,
                created_at: authData.user.created_at,
                updated_at: new Date().toISOString(),
              },
              token: authData.session.access_token,
            };
          }
          
          return {
            user: newUserData,
            token: authData.session.access_token,
          };
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des données utilisateur',
        });
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