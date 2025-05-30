export type MarketTrendSubmission = {
  id?: string;
  userId: string;
  category: string;
  city: string;
  region: string;
  country: string;
  price: number;
  unit: string;
  createdAt?: string;
};

export type MarketTrendAggregate = {
  category: string;
  city: string;
  averagePrice: number;
  unit: string;
  dataPoints: {
    date: string;
    price: number;
  }[];
  submissions: number;
};