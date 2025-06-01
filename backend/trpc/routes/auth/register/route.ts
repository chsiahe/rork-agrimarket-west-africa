import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  .input(z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    firstName: z.string().min(1, 'Le prénom est requis'),
    lastName: z.string().min(1, 'Le nom est requis'),
    phone: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.supabase) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Service de base de données non disponible',
      });
    }

    try {
      // Check if email already exists
      const { data: existingUser } = await ctx.supabase
        .from('users')
        .select('id')
        .eq('email', input.email)
        .single();

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Cet email est déjà utilisé',
        });
      }

      // Create auth user
      const { data: authData, error: signUpError } = await ctx.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            first_name: input.firstName,
            last_name: input.lastName,
            phone: input.phone,
            role: 'buyer',
          },
        },
      });

      if (signUpError || !authData.user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: signUpError?.message || 'Erreur lors de la création du compte',
        });
      }

      // Get the created user profile
      const { data: userData, error: userError } = await ctx.supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userData) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération du profil',
        });
      }

      return {
        user: userData,
        token: authData.session?.access_token || '',
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Une erreur inattendue est survenue',
      });
    }
  });