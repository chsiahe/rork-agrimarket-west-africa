import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";

// Mock user data for context (in real app, decode JWT token)
const mockUsers = {
  '1': { id: '1', name: 'Jean Dupont', email: 'jean@example.com', role: 'farmer' },
  '2': { id: '2', name: 'Marie Martin', email: 'marie@example.com', role: 'buyer' },
  '3': { id: '3', name: 'Pierre Diallo', email: 'pierre@example.com', role: 'farmer' },
};

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // Extract authorization header
  const authorization = opts.req.headers.get('authorization');
  const token = authorization?.replace('Bearer ', '');

  // In real app, decode JWT token to get user info
  // For now, use mock user based on token or default to user 1
  const userId = token || '1';
  const user = mockUsers[userId as keyof typeof mockUsers] || mockUsers['1'];

  return {
    req: opts.req,
    token,
    user,
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
  if (!ctx.token) {
    throw new Error('Non autorisé');
  }
  return next({
    ctx: {
      ...ctx,
      token: ctx.token,
      user: ctx.user,
    },
  });
});