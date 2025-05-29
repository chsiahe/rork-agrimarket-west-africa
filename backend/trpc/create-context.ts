import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { createClient } from '@supabase/supabase-js';

// Supabase configuration using environment variables
const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || 'https://your-project-ref.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key',
};

// JWT configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

// Mock user data for context (in real app, decode JWT token and fetch from Supabase)
const mockUsers = {
  '1': { 
    id: '1', 
    name: 'Jean Dupont', 
    email: 'jean@example.com', 
    role: 'farmer',
    location: {
      country: 'SN',
      region: 'Dakar',
      city: 'Dakar',
      coordinates: {
        latitude: 14.6928,
        longitude: -17.4467
      }
    }
  },
  '2': { 
    id: '2', 
    name: 'Marie Martin', 
    email: 'marie@example.com', 
    role: 'buyer',
    location: {
      country: 'SN',
      region: 'Thiès',
      city: 'Thiès',
      coordinates: {
        latitude: 14.7886,
        longitude: -16.9246
      }
    }
  },
  '3': { 
    id: '3', 
    name: 'Pierre Diallo', 
    email: 'pierre@example.com', 
    role: 'farmer',
    location: {
      country: 'SN',
      region: 'Ziguinchor',
      city: 'Ziguinchor',
      coordinates: {
        latitude: 12.5681,
        longitude: -16.2719
      }
    }
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
async function verifyJWTToken(token: string, supabase: any) {
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
  return mockUsers[token as keyof typeof mockUsers] || null;
}

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // Initialize Supabase connection
  const supabase = await connectToSupabase();
  
  // Extract authorization header
  const authorization = opts.req.headers.get('authorization');
  const token = authorization?.replace('Bearer ', '');

  let user = null;
  
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
    user = mockUsers[token as keyof typeof mockUsers] || mockUsers['1'];
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
  if (ctx.user.role !== 'admin') {
    throw new Error('Accès refusé - Droits administrateur requis');
  }
  return next({
    ctx,
  });
});