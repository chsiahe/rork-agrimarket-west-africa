export type UserRole = 'farmer' | 'buyer' | 'cooperative' | 'distributor' | 'admin';

export type UserRating = {
  rating: number;
  comment: string;
  userId: string;
  createdAt: string;
};

export type Location = {
  country: string;
  region: string;
  regionId?: string;
  city: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

export type OperatingArea = {
  regions: string[];
  maxDeliveryDistance: number; // in km
  deliveryZones: string[];
};

export type User = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  email: string;
  role: UserRole;
  location: Location;
  operatingAreas?: OperatingArea;
  verified: boolean;
  rating: number;
  totalRatings: number;
  totalSales: number;
  totalPurchases: number;
  joinedAt: string;
  listings: string[];
  reviews: UserRating[];
  bio?: string;
  languages?: string[];
  socialMedia?: Record<string, string>;
  businessInfo?: {
    companyName: string;
    registrationNumber: string;
    description: string;
  };
};