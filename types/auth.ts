// types/auth.ts

import { User, UserRole, Location, OperatingArea } from './user';

/**
 * Export core user-related types for use elsewhere.
 */
export type { UserRole, User, Location, OperatingArea } from './user';

/**
 * Describes the authentication state in the app.
 */
export interface AuthState {
  user?: User; // Use optional properties where possible for stricter null safety
  token?: string;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Standardized error interface for authentication.
 */
export interface AuthError {
  message: string;
  code?: string;
}

/**
 * Request payload for logging in.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Shared fields for registration and profile updates.
 */
interface BaseProfileRequest {
  name: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  city: string;
  operatingAreas?: OperatingArea;
}

/**
 * Request payload for registering a new user.
 */
export interface RegisterRequest extends BaseProfileRequest {
  password: string;
  role: UserRole;
}

/**
 * Request payload for updating a user's profile.
 */
export interface UpdateProfileRequest extends BaseProfileRequest {
  userId?: string;
  avatar?: string;
}

/**
 * Standardized authentication response from the server.
 */
export interface AuthResponse<T = User> {
  user: T;
  token: string;
}
