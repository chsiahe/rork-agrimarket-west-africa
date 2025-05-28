import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { DeliveryMode } from "@/types/product";

// Global products store to persist created products
let globalProducts = [
  {
    id: '1',
    title: 'Maïs Jaune Sec de Qualité Supérieure',
    price: 1500,
    negotiable: true,
    quantity: 100,
    unit: 'kg',
    location: {
      country: 'Sénégal',
      region: 'Thiès',
      city: 'Thiès'
    },
    category: 'Céréales',
    description: 'Maïs de qualité supérieure, fraîchement récolté. Idéal pour l\'alimentation animale et humaine. Produit sans pesticides, séché naturellement au soleil.',
    condition: 'fresh' as const,
    images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop'],
    availability: {
      startDate: '2025-01-20T00:00:00Z',
      duration: 'Jusqu\'à épuisement'
    },
    delivery: {
      modes: ['local', 'pickup'] as const,
      freeDelivery: true
    },
    seller: {
      id: '1',
      name: 'Amadou Diallo',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      verified: true,
      allowCalls: true
    },
    statistics: {
      views: 156,
      contacts: 23
    },
    createdAt: '2025-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Tomates Fraîches Bio',
    price: 800,
    negotiable: false,
    quantity: 50,
    unit: 'kg',
    location: {
      country: 'Sénégal',
      region: 'Dakar',
      city: 'Dakar'
    },
    category: 'Légumes',
    description: 'Tomates rouges et juteuses, cultivées sans pesticides dans notre ferme familiale. Parfaites pour la cuisine sénégalaise traditionnelle.',
    condition: 'fresh' as const,
    images: ['https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=400&h=300&fit=crop'],
    availability: {
      startDate: '2025-01-16T00:00:00Z',
      endDate: '2025-01-30T00:00:00Z'
    },
    delivery: {
      modes: ['local', 'regional'] as const,
      freeDelivery: false,
      deliveryFees: 1000
    },
    seller: {
      id: '2',
      name: 'Fatou Sow',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
      verified: true,
      allowCalls: false
    },
    statistics: {
      views: 89,
      contacts: 12
    },
    createdAt: '2025-01-14T15:30:00Z'
  },
  {
    id: '3',
    title: 'Motoculteur Thermique - Occasion',
    price: 450000,
    negotiable: true,
    quantity: 1,
    unit: 'pièce',
    location: {
      country: 'Sénégal',
      region: 'Kaolack',
      city: 'Kaolack'
    },
    category: 'Équipements',
    description: 'Motoculteur en bon état, révisé récemment. Idéal pour petites exploitations. Moteur Honda 7CV, largeur de travail 60cm.',
    condition: 'used' as const,
    images: ['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=300&fit=crop'],
    availability: {
      startDate: '2025-01-18T00:00:00Z'
    },
    delivery: {
      modes: ['pickup'] as const,
      freeDelivery: true
    },
    seller: {
      id: '3',
      name: 'Moussa Ba',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      verified: false,
      allowCalls: true
    },
    statistics: {
      views: 234,
      contacts: 45
    },
    createdAt: '2025-01-12T09:15:00Z'
  },
  {
    id: '4',
    title: 'Mangues Kent Premium',
    price: 1200,
    negotiable: true,
    quantity: 25,
    unit: 'kg',
    location: {
      country: 'Sénégal',
      region: 'Casamance',
      city: 'Ziguinchor'
    },
    category: 'Fruits',
    description: 'Mangues Kent de première qualité, sucrées et juteuses. Récoltées à maturité optimale, parfaites pour l\'export ou la consommation locale.',
    condition: 'fresh' as const,
    images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=300&fit=crop'],
    availability: {
      startDate: '2025-01-22T00:00:00Z',
      endDate: '2025-02-15T00:00:00Z'
    },
    delivery: {
      modes: ['local', 'regional'] as const,
      freeDelivery: false,
      deliveryFees: 1500
    },
    seller: {
      id: '4',
      name: 'Aissatou Cissé',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      verified: true,
      allowCalls: true
    },
    statistics: {
      views: 78,
      contacts: 15
    },
    createdAt: '2025-01-16T14:20:00Z'
  },
  {
    id: '5',
    title: 'Semences de Mil Certifiées',
    price: 2500,
    negotiable: false,
    quantity: 10,
    unit: 'kg',
    location: {
      country: 'Sénégal',
      region: 'Louga',
      city: 'Louga'
    },
    category: 'Semences',
    description: 'Semences de mil certifiées, résistantes à la sécheresse. Variété adaptée au climat sahélien, rendement élevé garanti.',
    condition: 'new' as const,
    images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop'],
    availability: {
      startDate: '2025-02-01T00:00:00Z',
      duration: 'Saison des pluies'
    },
    delivery: {
      modes: ['regional', 'pickup'] as const,
      freeDelivery: true
    },
    seller: {
      id: '5',
      name: 'Ibrahima Fall',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      verified: true,
      allowCalls: true
    },
    statistics: {
      views: 145,
      contacts: 28
    },
    createdAt: '2025-01-10T11:45:00Z'
  }
];

// Function to add a new product to the global store
export function addProductToStore(product: any) {
  globalProducts.unshift(product); // Add to beginning of array
}

export default publicProcedure
  .input(z.object({
    category: z.string().optional(),
    location: z.string().optional(),
    search: z.string().optional(),
    condition: z.enum(['new', 'fresh', 'used', 'needs_repair']).optional(),
    negotiable: z.boolean().optional(),
    userId: z.string().optional(), // Add userId for filtering user's own products
    limit: z.number().min(1).max(100).default(10),
    offset: z.number().min(0).default(0)
  }))
  .query(({ input }) => {
    let filteredProducts = [...globalProducts];

    // Filter by userId if provided (for user's own listings)
    if (input.userId) {
      filteredProducts = filteredProducts.filter(p => p.seller.id === input.userId);
    }

    if (input.category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category.toLowerCase().includes(input.category!.toLowerCase())
      );
    }

    if (input.location) {
      filteredProducts = filteredProducts.filter(p => 
        p.location.city.toLowerCase().includes(input.location!.toLowerCase()) ||
        p.location.region.toLowerCase().includes(input.location!.toLowerCase())
      );
    }

    if (input.search) {
      filteredProducts = filteredProducts.filter(p =>
        p.title.toLowerCase().includes(input.search!.toLowerCase()) ||
        p.description.toLowerCase().includes(input.search!.toLowerCase())
      );
    }

    if (input.condition) {
      filteredProducts = filteredProducts.filter(p => p.condition === input.condition);
    }

    if (input.negotiable !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.negotiable === input.negotiable);
    }

    const total = filteredProducts.length;
    const products = filteredProducts.slice(input.offset, input.offset + input.limit);

    return {
      products,
      total,
      hasMore: input.offset + input.limit < total
    };
  });