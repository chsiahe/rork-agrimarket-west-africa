import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { createClient } from '@supabase/supabase-js';
import { User, UserRole } from '@/types/user';

// Supabase configuration using environment variables
const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || 'https://fcarcjlgyymauxhzamri.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjYXJjamxneXltYXV4aHphbXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0ODA5MDAsImV4cCI6MjA2NDA1NjkwMH0.-PyVNk0rGtg2vZdI2Hmui7wLd3twB5mLKz9si4ESjw8',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjYXJjamxneXltYXV4aHphbXJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQ4MDkwMCwiZXhwIjoyMDY0MDU2OTAwfQ.JAK7Q3m0gFWL0tqy16wnAJkhjk_JYUms_GS-aL0hvh0',
};

// JWT configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'a5scdS0p1cHr3yXELbbTjmEb9ffifqukxevuOjlZV7zzjIiUoUmU8FYQChjRSqrxkW1nbatQukuoso9ok6fIXg==',
  expiresIn: process.env.JWT_EXPIRES_IN || '3600s',
};

// Mock user data for context (in real app, decode JWT token and fetch from Supabase)
const mockUsers: Record<string, User> = {
  '1': { 
    id: '1', 
    name: 'Jean Dupont', 
    email: 'jean@example.com', 
    role: 'farmer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    phone: '+221 77 123 45 67',
    location: {
      country: 'SN',
      region: 'Dakar',
      city: 'Dakar',
      coordinates: {
        latitude: 14.6928,
        longitude: -17.4467
      }
    },
    verified: true,
    rating: 4.5,
    totalRatings: 23,
    totalSales: 45,
    totalPurchases: 12,
    joinedAt: '2023-01-15T10:30:00Z',
    listings: [],
    reviews: []
  },
  '2': { 
    id: '2', 
    name: 'Marie Martin', 
    email: 'marie@example.com', 
    role: 'buyer',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
    phone: '+221 76 987 65 43',
    location: {
      country: 'SN',
      region: 'Thiès',
      city: 'Thiès',
      coordinates: {
        latitude: 14.7886,
        longitude: -16.9246
      }
    },
    verified: false,
    rating: 4.2,
    totalRatings: 8,
    totalSales: 0,
    totalPurchases: 15,
    joinedAt: '2023-03-22T14:15:00Z',
    listings: [],
    reviews: []
  },
  '3': { 
    id: '3', 
    name: 'Pierre Diallo', 
    email: 'pierre@example.com', 
    role: 'farmer',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    phone: '+221 78 456 78 90',
    location: {
      country: 'SN',
      region: 'Ziguinchor',
      city: 'Ziguinchor',
      coordinates: {
        latitude: 12.5681,
        longitude: -16.2719
      }
    },
    verified: true,
    rating: 4.8,
    totalRatings: 67,
    totalSales: 123,
    totalPurchases: 5,
    joinedAt: '2022-11-08T09:45:00Z',
    listings: [],
    reviews: []
  },
  'admin': { 
    id: 'admin', 
    name: 'Admin User', 
    email: 'admin@agriconnect.com', 
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    phone: '+221 77 000 00 00',
    location: {
      country: 'SN',
      region: 'Dakar',
      city: 'Dakar',
      coordinates: {
        latitude: 14.6928,
        longitude: -17.4467
      }
    },
    verified: true,
    rating: 5.0,
    totalRatings: 0,
    totalSales: 0,
    totalPurchases: 0,
    joinedAt: '2022-01-01T00:00:00Z',
    listings: [],
    reviews: []
  },
};

// Supabase client initialization
function createSupabaseClient(useServiceRole = false) {
  const key = useServiceRole ? SUPABASE_CONFIG.serviceRoleKey : SUPABASE_CONFIG.anonKey;
  
  return createClient(SUPABASE_CONFIG.url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'agriconnect-app',
      },
    },
  });
}

// Database connection function using Supabase
async function connectToSupabase() {
  try {
    const supabase = createSupabaseClient();
    
    // Test connection by checking if we can access the database
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is fine for initial setup
      console.error('Supabase connection failed:', error);
      throw error;
    }
    
    console.log('Connected to Supabase successfully');
    return supabase;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    // Return null to fall back to mock data
    return null;
  }
}

// JWT token verification function (placeholder for real implementation)
async function verifyJWTToken(token: string, supabase: any): Promise<User | null> {
  // In a real application, you would verify the JWT token here
  // Example with Supabase Auth:
  /*
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid token');
    }
    
    // Fetch additional user data from your users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      throw new Error('User not found');
    }
    
    return userData;
  } catch (error) {
    throw new Error('Invalid token');
  }
  */
  
  // For now, return mock user based on token
  return mockUsers[token] || null;
}

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // Initialize Supabase connection
  const supabase = await connectToSupabase();
  
  // Extract authorization header
  const authorization = opts.req.headers.get('authorization');
  const token = authorization?.replace('Bearer ', '');

  let user: User | null = null;
  
  if (token && supabase) {
    try {
      // Verify JWT token and get user info
      user = await verifyJWTToken(token, supabase);
    } catch (error) {
      console.error('Token verification failed:', error);
      // Token is invalid, user remains null
    }
  }

  // If no valid token, use default user for demo purposes
  if (!user && token) {
    user = mockUsers[token] || mockUsers['1'];
  }

  return {
    req: opts.req,
    token,
    user,
    supabase,
    config: {
      supabase: SUPABASE_CONFIG,
      jwt: JWT_CONFIG,
    },
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Non autorisé - Veuillez vous connecter');
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Admin procedure that requires admin role
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' as UserRole) {
    throw new Error('Accès refusé - Droits administrateur requis');
  }
  return next({
    ctx,
  });
});