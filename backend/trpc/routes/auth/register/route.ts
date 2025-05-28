import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { TRPCError } from "@trpc/server";
import { User } from "@/types/user";

// Mock user storage (in a real app, this would be a database)
let mockUsers: Record<string, User> = {};
let userIdCounter = 1;

export default publicProcedure
  .input(z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    password: z.string().min(6),
    country: z.string().min(2),
    region: z.string().min(2),
    city: z.string().min(2),
    role: z.enum(['farmer', 'buyer', 'cooperative', 'distributor']),
    operatingAreas: z.object({
      regions: z.array(z.string()),
      maxDeliveryDistance: z.number(),
      deliveryZones: z.array(z.string())
    }).optional(),
  }))
  .mutation(({ input }) => {
    // Check if email already exists
    const emailExists = Object.values(mockUsers).some(
      user => user.email === input.email
    );
    
    if (emailExists) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Cette adresse email est déjà utilisée',
      });
    }

    // Create new user
    const userId = userIdCounter.toString();
    userIdCounter++;

    const newUser: User = {
      id: userId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role,
      location: {
        country: input.country,
        region: input.region,
        city: input.city,
        coordinates: {
          latitude: 14.6928, // Default coordinates (Dakar)
          longitude: -17.4467
        }
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
      socialMedia: {},
      businessInfo: undefined,
    };

    // Store user
    mockUsers[userId] = newUser;

    // Generate mock token
    const token = `mock_token_${userId}_${Date.now()}`;

    return {
      user: newUser,
      token
    };
  });