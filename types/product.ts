export type ProductCondition = 'new' | 'fresh' | 'used' | 'needs_repair';

export type DeliveryMode = 'local' | 'regional' | 'pickup';

export type ProductLocation = {
  country: string;
  region: string;
  city: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

export type ProductAvailability = {
  startDate: string;
  endDate?: string;
  duration?: string;
};

export type ProductDelivery = {
  modes: DeliveryMode[];
  freeDelivery: boolean;
  deliveryFees?: number;
  maxDeliveryDistance?: number;
};

export type ProductStatistics = {
  views: number;
  favorites: number;
  inquiries: number;
};

export type ProductSeller = {
  id: string;
  name: string;
  avatar?: string;
  location: string;
  verified: boolean;
  rating: number;
  joinedAt: string;
  phone?: string;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  quantity: number;
  unit: string;
  category: string;
  condition: ProductCondition;
  images: string[];
  location: ProductLocation;
  availability: ProductAvailability;
  delivery: ProductDelivery;
  seller: ProductSeller;
  createdAt: string;
  updatedAt: string;
  statistics: ProductStatistics;
  harvestDate?: string;
  allowCalls: boolean;
};

export type CreateProductRequest = {
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  quantity: number;
  unit: string;
  category: string;
  condition: ProductCondition;
  images: string[];
  location: ProductLocation;
  availability: ProductAvailability;
  delivery: ProductDelivery;
  allowCalls: boolean;
};