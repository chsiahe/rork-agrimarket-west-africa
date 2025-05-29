import { createTRPCRouter } from './create-context';
import hiProcedure from './routes/example/hi/route';
import listProducts from './routes/products/list/route';
import createProduct from './routes/products/create/route';
import getProduct from './routes/products/get/route';
import incrementView from './routes/products/increment-view/route';
import getUserProfile from './routes/users/profile/route';
import updateUserProfile from './routes/users/update-profile/route';
import loginUser from './routes/auth/login/route';
import registerUser from './routes/auth/register/route';
import logoutUser from './routes/auth/logout/route';
import sendMessage from './routes/messages/send/route';
import getMessages from './routes/messages/get/route';
import listMessages from './routes/messages/list/route';
import startChat from './routes/messages/start-chat/route';
import { submitMarketPrice } from './routes/marketTrends/submit/route';
import { getMarketTrends } from './routes/marketTrends/get/route';

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiProcedure,
  }),
  products: createTRPCRouter({
    list: listProducts,
    create: createProduct,
    get: getProduct,
    incrementView: incrementView,
  }),
  users: createTRPCRouter({
    profile: getUserProfile,
    updateProfile: updateUserProfile,
  }),
  auth: createTRPCRouter({
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
  }),
  messages: createTRPCRouter({
    send: sendMessage,
    get: getMessages,
    list: listMessages,
    startChat: startChat,
  }),
  marketTrends: createTRPCRouter({
    submit: submitMarketPrice,
    get: getMarketTrends,
  }),
});

export type AppRouter = typeof appRouter;