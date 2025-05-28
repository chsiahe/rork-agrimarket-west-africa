import { router } from './create-context';
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

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),
  products: router({
    list: listProducts,
    create: createProduct,
    get: getProduct,
    incrementView: incrementView,
  }),
  users: router({
    profile: getUserProfile,
    updateProfile: updateUserProfile,
  }),
  auth: router({
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
  }),
  messages: router({
    send: sendMessage,
    get: getMessages,
    list: listMessages,
    startChat: startChat,
  }),
});

export type AppRouter = typeof appRouter;