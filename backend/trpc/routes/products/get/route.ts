import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

const mockProduct = {
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
  description: 'Maïs de qualité supérieure, fraîchement récolté dans nos champs de Thiès. Grains uniformes, bien séchés et triés. Idéal pour la transformation industrielle, l\'alimentation animale ou la consommation directe. Produit sans pesticides, cultivé selon les méthodes traditionnelles respectueuses de l\'environnement.',
  condition: 'fresh' as const,
  images: [
    'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop'
  ],
  availability: {
    startDate: '2025-01-20T00:00:00Z',
    endDate: '2025-03-15T00:00:00Z',
    duration: 'Jusqu\'à épuisement du stock'
  },
  delivery: {
    modes: ['local', 'regional', 'pickup'] as const,
    freeDelivery: false,
    deliveryFees: 2500
  },
  seller: {
    id: '1',
    name: 'Amadou Diallo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    verified: true,
    phone: '+221 77 123 45 67',
    allowCalls: true
  },
  statistics: {
    views: 156,
    contacts: 23
  },
  createdAt: '2025-01-15T10:00:00Z',
  priceHistory: [
    { date: '2025-01', price: 1200 },
    { date: '2025-02', price: 1300 },
    { date: '2025-03', price: 1100 },
    { date: '2025-04', price: 1500 },
    { date: '2025-05', price: 1400 },
  ]
};

export default publicProcedure
  .input(z.object({ id: z.string() }))
  .query(({ input }) => {
    if (input.id === '1') {
      return mockProduct;
    }
    throw new Error('Product not found');
  });