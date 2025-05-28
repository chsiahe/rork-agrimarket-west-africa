import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { TRPCError } from "@trpc/server";

export default publicProcedure
  .input(z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    password: z.string().min(6),
    city: z.string().min(2),
    role: z.enum(['farmer', 'buyer', 'cooperative', 'distributor']),
  }))
  .mutation(({ input }) => {
    // Check if user already exists (mock check)
    if (input.email === 'amadou@example.com' || input.email === 'fatou@example.com') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Un utilisateur avec cet email existe déjà',
      });
    }

    // Get avatar based on role
    const getAvatarByRole = (role: string) => {
      switch (role) {
        case 'farmer':
          return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d';
        case 'buyer':
          return 'https://images.unsplash.com/photo-1494790108755-2616b612b786';
        case 'cooperative':
          return 'https://images.unsplash.com/photo-1560250097-0b93528c311a';
        case 'distributor':
          return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e';
        default:
          return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d';
      }
    };

    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      name: input.name,
      email: input.email,
      phone: input.phone,
      avatar: getAvatarByRole(input.role),
      role: input.role,
      location: {
        city: input.city,
        coordinates: {
          latitude: 14.6928,
          longitude: -17.4467
        }
      },
      verified: false,
      rating: 0,
      totalRatings: 0,
      totalSales: 0,
      totalPurchases: 0,
      joinedAt: new Date().toISOString(),
      listings: [],
      reviews: [],
      bio: '',
      languages: ['Français'],
      socialMedia: {},
      businessInfo: undefined
    };

    // Generate mock JWT token
    const token = `mock-jwt-token-${newUser.id}-${Date.now()}`;

    return {
      user: newUser,
      token,
    };
  });