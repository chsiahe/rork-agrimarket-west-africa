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
    joinedAt: '2024-01-15T10:00:00Z',
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
    joinedAt: '2024-02-10T10:00:00Z',
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
    joinedAt: '2024-01-20T10:00:00Z',
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
    joinedAt: '2024-02-05T10:00:00Z',
  }
];

export default publicProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }))
  .mutation(({ input }) => {
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