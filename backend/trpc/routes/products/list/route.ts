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
  .query(({ input, ctx }) => {
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