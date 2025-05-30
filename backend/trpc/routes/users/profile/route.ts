import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const mockUsers = {
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
    verified: true,
    rating: 4.8,
    totalRatings: 48,
    totalSales: 48,
    totalPurchases: 12,
    joinedAt: '2024-01-15T10:00:00Z',
    listings: ['1', '2', '3'],
    reviews: []
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
    reviews: []
  }
};

export default publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(({ input }) => {
    const user = mockUsers[input.userId as keyof typeof mockUsers];
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  });