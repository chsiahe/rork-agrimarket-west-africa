import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";

// Database configuration using environment variables
const DATABASE_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'agriconnect',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true',
};

// JWT configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

// Mock user data for context (in real app, decode JWT token and fetch from database)
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

// Database connection function (placeholder for real implementation)
async function connectToDatabase() {
  // In a real application, you would connect to your database here
  // Example with PostgreSQL:
  /*
  const { Pool } = require('pg');
  const pool = new Pool(DATABASE_CONFIG);
  
  try {
    await pool.connect();
    console.log('Connected to database successfully');
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
  */
  
  // For now, return null as we're using mock data
  return null;
}

// JWT token verification function (placeholder for real implementation)
async function verifyJWTToken(token: string) {
  // In a real application, you would verify the JWT token here
  // Example with jsonwebtoken:
  /*
  const jwt = require('jsonwebtoken');
  
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
  */
  
  // For now, return mock user based on token
  return mockUsers[token as keyof typeof mockUsers] || null;
}

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // Initialize database connection
  const db = await connectToDatabase();
  
  // Extract authorization header
  const authorization = opts.req.headers.get('authorization');
  const token = authorization?.replace('Bearer ', '');

  let user = null;
  
  if (token) {
    try {
      // Verify JWT token and get user info
      user = await verifyJWTToken(token);
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
    db,
    config: {
      database: DATABASE_CONFIG,
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