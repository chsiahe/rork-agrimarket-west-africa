export type MarketTrendSubmission = {
  userId: string;
  category: string;
  city: string;
  region: string;
  country: string;
  price: number;
  unit: string;
  createdAt: string;
};

export type MarketTrendDataPoint = {
  date: string;
  price: number;
};

export type MarketTrendAggregate = {
  category: string;
  city: string;
  averagePrice: number;
  unit: string;
  dataPoints: MarketTrendDataPoint[];
  submissions: number;
};