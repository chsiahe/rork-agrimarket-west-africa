import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { Product } from "@/types/product";

// Mock products data
const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Tomates fraîches bio',
    description: 'Tomates cultivées sans pesticides, récoltées ce matin. Parfaites pour vos salades et sauces.',
    price: 1500,
    negotiable: true,
    quantity: 50,
    unit: 'kg',
    category: 'Légumes',
    condition: 'fresh',
    images: ['https://images.unsplash.com/photo-1546470427-e5ac89c8ba3a?w=400&h=300&fit=crop'],
    location: {
      country: 'SN',
      region: 'Dakar',
      city: 'Dakar',
      coordinates: {
        latitude: 14.6928,
        longitude: -17.4467
      }
    },
    availability: {
      startDate: '2024-01-15T00:00:00Z',
      endDate: '2024-01-30T00:00:00Z',
    },
    delivery: {
      modes: ['local', 'pickup'],
      freeDelivery: true,
      maxDeliveryDistance: 20
    },
    seller: {
      id: '1',
      name: 'Amadou Diallo',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
      location: 'Dakar, Sénégal',
      verified: true,
      rating: 4.8,
      joinedAt: '2024-01-15T10:00:00Z',
      phone: '+221 77 123 45 67'
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    statistics: {
      views: 45,
      favorites: 12,
      inquiries: 8
    },
    harvestDate: '2024-01-15T06:00:00Z',
    allowCalls: true
  },
  {
    id: '2',
    title: 'Mangues de Casamance',
    description: 'Mangues sucrées et juteuses directement de Casamance. Variété Kent de première qualité.',
    price: 2000,
    negotiable: false,
    quantity: 100,
    unit: 'kg',
    category: 'Fruits',
    condition: 'fresh',
    images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=300&fit=crop'],
    location: {
      country: 'SN',
      region: 'Ziguinchor',
      city: 'Ziguinchor',
      coordinates: {
        latitude: 12.5681,
        longitude: -16.2719
      }
    },
    availability: {
      startDate: '2024-01-10T00:00:00Z',
      endDate: '2024-02-15T00:00:00Z',
    },
    delivery: {
      modes: ['regional', 'pickup'],
      freeDelivery: false,
      deliveryFees: 500,
      maxDeliveryDistance: 100
    },
    seller: {
      id: '3',
      name: 'Ousmane Sané',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop',
      location: 'Ziguinchor, Sénégal',
      verified: true,
      rating: 4.9,
      joinedAt: '2023-12-01T10:00:00Z',
      phone: '+221 77 555 66 77'
    },
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
    statistics: {
      views: 78,
      favorites: 23,
      inquiries: 15
    },
    harvestDate: '2024-01-08T06:00:00Z',
    allowCalls: true
  },
  {
    id: '3',
    title: 'Mil rouge traditionnel',
    description: 'Mil rouge de qualité supérieure, cultivé selon les méthodes traditionnelles. Idéal pour la préparation du couscous.',
    price: 800,
    negotiable: true,
    quantity: 200,
    unit: 'kg',
    category: 'Céréales',
    condition: 'fresh',
    images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop'],
    location: {
      country: 'ML',
      region: 'Bamako',
      city: 'Bamako',
      coordinates: {
        latitude: 12.6392,
        longitude: -8.0029
      }
    },
    availability: {
      startDate: '2024-01-20T00:00:00Z',
      endDate: '2024-03-20T00:00:00Z',
    },
    delivery: {
      modes: ['regional', 'pickup'],
      freeDelivery: true,
      maxDeliveryDistance: 50
    },
    seller: {
      id: '4',
      name: 'Fatou Traoré',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop',
      location: 'Bamako, Mali',
      verified: true,
      rating: 4.7,
      joinedAt: '2023-11-15T10:00:00Z',
      phone: '+223 70 123 456'
    },
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    statistics: {
      views: 32,
      favorites: 8,
      inquiries: 5
    },
    harvestDate: '2024-01-18T06:00:00Z',
    allowCalls: true
  },
  {
    id: '6',
    title: 'Cacao brut de qualité',
    description: 'Fèves de cacao brutes, cultivées de manière durable. Idéal pour la transformation ou la revente.',
    price: 2500,
    negotiable: true,
    quantity: 150,
    unit: 'kg',
    category: 'Céréales',
    condition: 'fresh',
    images: ['https://images.unsplash.com/photo-1611077449879-828a2e019510?w=400&h=300&fit=crop'],
    location: {
      country: 'CI',
      region: 'Abidjan',
      city: 'Abidjan',
      coordinates: {
        latitude: 5.3602,
        longitude: -4.0083
      }
    },
    availability: {
      startDate: '2024-03-10T00:00:00Z',
      endDate: '2024-05-10T00:00:00Z',
    },
    delivery: {
      modes: ['regional', 'pickup'],
      freeDelivery: false,
      deliveryFees: 700,
      maxDeliveryDistance: 80
    },
    seller: {
      id: '5',
      name: 'Koffi Kouassi',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
      location: 'Abidjan, Côte d\'Ivoire',
      verified: true,
      rating: 4.6,
      joinedAt: '2024-03-12T10:00:00Z',
      phone: '+225 07 08 09 10 11'
    },
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
    statistics: {
      views: 55,
      favorites: 18,
      inquiries: 10
    },
    harvestDate: '2024-03-05T06:00:00Z',
    allowCalls: true
  }
];

export default publicProcedure
  .input(z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    location: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
    city: z.string().optional(),
    condition: z.enum(['new', 'fresh', 'used', 'needs_repair']).optional(),
    negotiable: z.boolean().optional(),
    userId: z.string().optional(),
    limit: z.number().default(10),
    offset: z.number().default(0),
  }))
  .query(async ({ input, ctx }) => {
    // In a real application with Supabase, you would:
    if (ctx.supabase) {
      let query = ctx.supabase
        .from('products')
        .select('*')
        .limit(input.limit)
        .range(input.offset, input.offset + input.limit - 1);

      // Apply filters
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        query = query.or(
          `title.ilike.%${searchLower}%,
           description.ilike.%${searchLower}%,
           category.ilike.%${searchLower}%`
        );
      }

      if (input.category) {
        query = query.eq('category', input.category);
      }

      if (input.country) {
        query = query.eq('location_country', input.country);
      }

      if (input.region) {
        query = query.eq('location_region', input.region);
      }

      if (input.city) {
        query = query.eq('location_city', input.city);
      }

      if (input.condition) {
        query = query.eq('condition', input.condition);
      }

      if (input.negotiable !== undefined) {
        query = query.eq('negotiable', input.negotiable);
      }

      if (input.userId) {
        query = query.eq('seller_id', input.userId);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Erreur lors de la récupération des produits: ${error.message}`);
      }

      return {
        products: data,
        total: count || data.length,
        hasMore: input.offset + input.limit < (count || data.length)
      };
    }
    
    // Fallback to mock data
    let filteredProducts = [...mockProducts];

    // Filter by search query
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.title.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (input.category) {
      filteredProducts = filteredProducts.filter(product =>
        product.category === input.category
      );
    }

    // Filter by location
    if (input.location) {
      filteredProducts = filteredProducts.filter(product =>
        product.location.city.toLowerCase().includes(input.location!.toLowerCase()) ||
        product.location.region.toLowerCase().includes(input.location!.toLowerCase())
      );
    }

    // Filter by country
    if (input.country) {
      filteredProducts = filteredProducts.filter(product =>
        product.location.country === input.country
      );
    }

    // Filter by region
    if (input.region) {
      filteredProducts = filteredProducts.filter(product =>
        product.location.region === input.region
      );
    }

    // Filter by city
    if (input.city) {
      filteredProducts = filteredProducts.filter(product =>
        product.location.city === input.city
      );
    }

    // Filter by condition
    if (input.condition) {
      filteredProducts = filteredProducts.filter(product =>
        product.condition === input.condition
      );
    }

    // Filter by negotiable
    if (input.negotiable !== undefined) {
      filteredProducts = filteredProducts.filter(product =>
        product.negotiable === input.negotiable
      );
    }

    // Filter by user ID
    if (input.userId) {
      filteredProducts = filteredProducts.filter(product =>
        product.seller.id === input.userId
      );
    }

    // Apply pagination
    const total = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(
      input.offset,
      input.offset + input.limit
    );

    return {
      products: paginatedProducts,
      total,
      hasMore: input.offset + input.limit < total
    };
  });