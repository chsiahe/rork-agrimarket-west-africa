import { User, UserRole, Location, OperatingArea } from './user';

export type { UserRole, User, Location, OperatingArea } from './user';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  country: string;
  region: string;
  city: string;
  role: UserRole;
  operatingAreas?: OperatingArea;
}

export interface UpdateProfileRequest {
  userId?: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  city: string;
  avatar?: string;
  operatingAreas?: OperatingArea;
}

export interface AuthResponse {
  user: User;
  token: string;
}