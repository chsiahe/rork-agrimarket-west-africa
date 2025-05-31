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
        message: 'Database connection not available',
      });
    }

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (authError) {
        console.error('Auth error for email:', input.email, 'Error:', authError.message);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Email ou mot de passe incorrect: ' + authError.message,
        });
      }

      if (!authData.user || !authData.session) {
        console.error('No user or session returned for email:', input.email);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Email ou mot de passe incorrect - no user data returned',
        });
      }

      // Fetch additional user data from your users table
      const { data: userData, error: userError } = await ctx.supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error('User data fetch error for user ID:', authData.user.id, 'Error:', userError.message);
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Utilisateur non trouvé dans la base de données: ' + userError.message,
        });
      }

      console.log('Successful login for email:', input.email);
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
        message: 'Une erreur inattendue est survenue lors de la connexion: ' + String(error),
      });
    }
  });