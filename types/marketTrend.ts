export interface MarketTrendDataPoint {
  date: string;
  price: number;
}

export interface MarketTrendAggregate {
  productName?: string; // Added product name for specific product pricing
  category: string;
  city: string;
  averagePrice: number;
  unit: string;
  dataPoints: MarketTrendDataPoint[];
  submissions: number;
}

export interface MarketTrendSubmission {
  userId: string;
  productName?: string; // Added product name for specific product pricing
  category: string;
  city: string;
  region: string;
  country: string;
  price: number;
  unit: string;
  createdAt: string;
}