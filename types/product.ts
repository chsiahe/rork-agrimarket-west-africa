export type ProductCondition = 'new' | 'like-new' | 'good' | 'fair' | 'poor';
export type DeliveryMode = 'local' | 'regional' | 'pickup';

export type Product = {
  id: string;
  title: string;
  price: number;
  negotiable: boolean;
  quantity: number;
  unit: string;
  location: {
    country: string;
    region: string;
    city: string;
  };
  category: string;
  description: string;
  condition: ProductCondition;
  images: string[];
  availability: {
    startDate: string;
    endDate?: string;
    duration?: string;
  };
  delivery: {
    modes: readonly DeliveryMode[];
    freeDelivery: boolean;
    deliveryFees?: number;
  };
  seller: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
    phone?: string;
    allowCalls: boolean;
    location: string;
    joinedAt: string;
  };
  statistics: {
    views: number;
    contacts: number;
  };
  createdAt: string;
  harvestDate?: string;
  priceHistory?: Array<{
    date: string;
    price: number;
  }>;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type CreateProductInput = {
  title: string;
  price: number;
  negotiable: boolean;
  quantity: number;
  unit: string;
  location: {
    country: string;
    region: string;
    city: string;
  };
  category: string;
  description: string;
  condition: ProductCondition;
  images: string[];
  availability: {
    startDate: string;
    endDate?: string;
    duration?: string;
  };
  delivery: {
    modes: DeliveryMode[];
    freeDelivery: boolean;
    deliveryFees?: number;
  };
  allowCalls: boolean;
};