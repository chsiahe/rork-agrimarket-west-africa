export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
};

export type Chat = {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
};

export type ChatListItem = {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: string;
  } | null;
  unreadCount: number;
};