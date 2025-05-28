export type Message = {
  id: string;
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