export type MarketTrendSubmission = {
  userId: string;
  categoryId: string;
  category?: string;
  productName: string;
  city: string;
  regionId?: string;
  region?: string;
  country: string;
  price: number;
  unitCode: string;
  createdAt: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

export type MarketTrend = {
  id: string;
  userId?: string;
  categoryId: string;
  category?: string;
  productName?: string;
  price: number;
  unitCode: string;
  country: string;
  regionId?: string;
  region?: string;
  city: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  metadata?: Record<string, any>;
};