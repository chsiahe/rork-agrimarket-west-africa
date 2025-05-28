import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { TRPCError } from "@trpc/server";
import { User } from "@/types/user";

// Mock user storage (in a real app, this would be a database)
let mockUsers: Record<string, User> = {
  '1': {
    id: '1',
    name: 'Amadou Diallo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    phone: '+221 77 123 45 67',
    email: 'amadou.diallo@example.com',
    role: 'farmer',
    location: {
      country: 'Sénégal',
      region: 'Dakar',
      city: 'Dakar',
      coordinates: {
        latitude: 14.6928,
        longitude: -17.4467
      }
    },
    operatingAreas: {
      regions: ['Dakar', 'Thiès'],
      maxDeliveryDistance: 100,
      deliveryZones: ['Marché Sandaga', 'Marché Kermel']
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
  '2': {
    id: '2',
    name: 'Fatou Sow',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786',
    phone: '+221 77 987 65 43',
    email: 'fatou.sow@example.com',
    role: 'buyer',
    location: {
      country: 'Sénégal',
      region: 'Thiès',
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
  }
};

export default publicProcedure
  .input(z.object({
    userId: z.string().optional(),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    country: z.string().min(2),
    region: z.string().min(2),
    city: z.string().min(2),
    avatar: z.string().url().optional(),
    operatingAreas: z.object({
      regions: z.array(z.string()),
      maxDeliveryDistance: z.number(),
      deliveryZones: z.array(z.string())
    }).optional(),
  }))
  .mutation(({ input }) => {
    // In a real app, you would get the user ID from the authentication context
    const userId = input.userId || '1';
    
    const existingUser = mockUsers[userId];
    
    if (!existingUser) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Utilisateur non trouvé',
      });
    }

    // Check if email is already taken by another user
    const emailExists = Object.values(mockUsers).some(
      user => user.email === input.email && user.id !== userId
    );
    
    if (emailExists) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Cette adresse email est déjà utilisée',
      });
    }

    // Update user data
    const updatedUser: User = {
      ...existingUser,
      name: input.name,
      email: input.email,
      phone: input.phone,
      location: {
        country: input.country,
        region: input.region,
        city: input.city,
        coordinates: existingUser.location.coordinates, // Keep existing coordinates
      },
      avatar: input.avatar || existingUser.avatar,
      operatingAreas: input.operatingAreas || existingUser.operatingAreas,
    };

    // Update the mock storage
    mockUsers[userId] = updatedUser;

    return updatedUser;
  });