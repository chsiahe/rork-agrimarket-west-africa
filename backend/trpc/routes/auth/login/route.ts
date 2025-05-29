import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { TRPCError } from "@trpc/server";

// Mock users database
const mockUsers = [
  {
    id: '1',
    name: 'Amadou Diallo',
    email: 'amadou@example.com',
    phone: '+221 77 123 45 67',
    password: 'password123', // In real app, this would be hashed
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    role: 'farmer' as const,
    location: {
      city: 'Dakar',
      coordinates: {
        latitude: 14.6928,
        longitude: -17.4467
      }
    },
    verified: true,
    rating: 4.8,
    totalRatings: 48,
    totalSales: 48,
    totalPurchases: 12,
    joinedAt: '2024-01-15T10:00:00Z',
    listings: ['1', '2', '3'],
    reviews: [],
    bio: 'Agriculteur passionné depuis 15 ans',
    languages: ['Français', 'Wolof'],
    socialMedia: {
      facebook: 'amadou.diallo',
      whatsapp: '+221771234567'
    },
    businessInfo: {
      companyName: 'Ferme Diallo',
      registrationNumber: 'SN123456789',
      description: 'Production de légumes biologiques'
    }
  },
  {
    id: '2',
    name: 'Fatou Sall',
    email: 'fatou@example.com',
    phone: '+221 77 987 65 43',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786',
    role: 'buyer' as const,
    location: {
      city: 'Thiès',
      coordinates: {
        latitude: 14.7886,
        longitude: -16.9246
      }
    },
    verified: true,
    rating: 4.5,
    totalRatings: 32,
    totalSales: 0,
    totalPurchases: 32,
    joinedAt: '2024-02-10T10:00:00Z',
    listings: [],
    reviews: [],
    bio: 'Acheteuse de produits frais pour restaurants',
    languages: ['Français'],
    socialMedia: {},
    businessInfo: undefined
  },
  {
    id: '3',
    name: 'Coopérative Agricole de Kaolack',
    email: 'coop@example.com',
    phone: '+221 77 555 66 77',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
    role: 'cooperative' as const,
    location: {
      city: 'Kaolack',
      coordinates: {
        latitude: 14.1516,
        longitude: -16.0728
      }
    },
    verified: true,
    rating: 4.7,
    totalRatings: 25,
    totalSales: 156,
    totalPurchases: 0,
    joinedAt: '2024-01-20T10:00:00Z',
    listings: ['4', '5'],
    reviews: [],
    bio: 'Coopérative regroupant 50 agriculteurs locaux',
    languages: ['Français', 'Wolof', 'Pulaar'],
    socialMedia: {
      facebook: 'coop.kaolack',
      website: 'www.coopkaolack.sn'
    },
    businessInfo: {
      companyName: 'Coopérative Agricole de Kaolack',
      registrationNumber: 'COOP789123',
      description: 'Regroupement de producteurs agricoles'
    }
  },
  {
    id: '4',
    name: 'Distribution Sénégal',
    email: 'distrib@example.com',
    phone: '+221 77 888 99 00',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
    role: 'distributor' as const,
    location: {
      city: 'Saint-Louis',
      coordinates: {
        latitude: 16.0180,
        longitude: -16.4897
      }
    },
    verified: true,
    rating: 4.3,
    totalRatings: 18,
    totalSales: 0,
    totalPurchases: 89,
    joinedAt: '2024-02-05T10:00:00Z',
    listings: [],
    reviews: [],
    bio: 'Distributeur spécialisé dans les produits agricoles',
    languages: ['Français'],
    socialMedia: {
      linkedin: 'distribution-senegal'
    },
    businessInfo: {
      companyName: 'Distribution Sénégal SARL',
      registrationNumber: 'DIST456789',
      description: 'Distribution de produits agricoles'
    }
  }
];

export default publicProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }))
  .mutation(async ({ input, ctx }) => {
    // In a real application with Supabase, you would:
    if (ctx.supabase) {
      const { data, error } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Email ou mot de passe incorrect',
        });
      }

      if (!data.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Email ou mot de passe incorrect',
        });
      }

      // Fetch additional user data from your users table
      const { data: userData, error: userError } = await ctx.supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Utilisateur non trouvé',
        });
      }

      return {
        user: userData,
        token: data.session?.access_token,
      };
    }
    
    // Fallback to mock data
    const user = mockUsers.find(u => u.email === input.email);
    
    if (!user || user.password !== input.password) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Generate mock JWT token
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token,
    };
  });