export type UserRole = 'farmer' | 'buyer' | 'cooperative' | 'distributor';

export type UserRating = {
  rating: number;
  comment: string;
  userId: string;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  email: string;
  role: UserRole;
  location: {
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  verified: boolean;
  rating: number;
  totalRatings: number;
  joinedAt: string;
  listings: string[];
  reviews: UserRating[];
  businessInfo?: {
    companyName: string;
    registrationNumber: string;
    description: string;
  };
};