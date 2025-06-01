import { User, UserRole, Location, OperatingArea } from './user';

export type { UserRole, User, Location, OperatingArea } from './user';

export type RegisterUserRole = Exclude<UserRole, 'admin'>;

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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  country: string;
  regionId: string;
  city: string;
  role: RegisterUserRole;
  operatingAreas?: OperatingArea;
}

export interface UpdateProfileRequest {
  userId?: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  regionId: string;
  city: string;
  avatar?: string;
  operatingAreas?: OperatingArea;
}

export interface AuthResponse {
  user: User;
  token: string;
}