export type RegisterUserRole = 'farmer' | 'buyer' | 'cooperative' | 'distributor';

export type OperatingArea = {
  regions: string[];
  maxDeliveryDistance: number;
  deliveryZones: string[];
};

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  country: string;
  region: string;
  city: string;
  role: RegisterUserRole;
  operatingAreas?: OperatingArea;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: RegisterUserRole;
    location: {
      country: string;
      region: string;
      city: string;
    };
    operatingAreas?: OperatingArea;
    verified: boolean;
    rating: number;
    totalRatings: number;
    joinedAt: string;
  };
  token: string;
};