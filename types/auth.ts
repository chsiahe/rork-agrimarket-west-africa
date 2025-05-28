import { User } from './user';

export type { UserRole } from './user';
export type { User } from './user';

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
  city: string;
  role: UserRole;
}

export interface UpdateProfileRequest {
  userId?: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}