import { createTRPCRouter } from './create-context';
import hiProcedure from './routes/example/hi/route';
import messagesList from './routes/messages/list/route';
import messagesGet from './routes/messages/get/route';
import messagesSend from './routes/messages/send/route';
import usersProfile from './routes/users/profile/route';
import usersUpdateProfile from './routes/users/update-profile/route';
import authLogin from './routes/auth/login/route';
import authRegister from './routes/auth/register/route';
import authLogout from './routes/auth/logout/route';
import productsList from './routes/products/list/route';
import productsGet from './routes/products/get/route';
import productsCreate from './routes/products/create/route';
import productsIncrementView from './routes/products/increment-view/route';

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiProcedure,
  }),
  messages: createTRPCRouter({
    list: messagesList,
    get: messagesGet,
    send: messagesSend,
  }),
  users: createTRPCRouter({
    profile: usersProfile,
    updateProfile: usersUpdateProfile,
  }),
  auth: createTRPCRouter({
    login: authLogin,
    register: authRegister,
    logout: authLogout,
  }),
  products: createTRPCRouter({
    list: productsList,
    get: productsGet,
    create: productsCreate,
    incrementView: productsIncrementView,
  }),
});

export type AppRouter = typeof appRouter;