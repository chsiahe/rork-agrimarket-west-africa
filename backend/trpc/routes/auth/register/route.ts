import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { User } from "@/types/user";

export default publicProcedure
  .input(z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    country: z.string().min(2, "Pays requis"),
    region: z.string().min(2, "Région requise"),
    city: z.string().min(2, "Ville requise"),
    role: z.enum(['farmer', 'buyer', 'cooperative', 'distributor']),
    operatingAreas: z.object({
      regions: z.array(z.string()),
      maxDeliveryDistance: z.number(),
      deliveryZones: z.array(z.string())
    }).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    // In a real application, you would:
    // 1. Hash the password
    // 2. Check if email already exists
    // 3. Save user to database
    // 4. Generate JWT token
    
    // For now, create a mock user
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: input.name,
      email: input.email,
      phone: input.phone,
      avatar: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop`,
      role: input.role,
      location: {
        country: input.country,
        region: input.region,
        city: input.city,
        coordinates: {
          latitude: 14.6928, // Default to Dakar coordinates
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
      socialMedia: undefined,
      businessInfo: undefined,
    };

    // Generate a simple token (in real app, use JWT)
    const token = newUser.id;

    return {
      user: newUser,
      token,
      message: "Compte créé avec succès"
    };
  });