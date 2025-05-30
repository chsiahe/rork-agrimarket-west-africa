/**
 * Represents a single message in a chat.
 */
export type Message = {
  /** Unique identifier for the message */
  id: string;
  /** ID of the chat this message belongs to */
  chatId: string;
  /** ID of the user who sent the message */
  senderId: string;
  /** ID of the user who received the message */
  receiverId: string;
  /** Content of the message */
  content: string;
  /** ISO string timestamp when the message was sent */
  timestamp: string;
  /** Indicates whether the message has been read */
  read: boolean;
};

/**
 * Represents a chat between participants.
 * - participants should always be two or more users.
 * - lastMessage is optional and may be omitted if the chat is empty.
 */
export type Chat = {
  /** Unique identifier for the chat */
  id: string;
  /** Array of participant user IDs (at least 2 expected) */
  participants: [string, string, ...string[]];
  /** The last message in the chat, if any */
  lastMessage?: Message;
  /** The count of unread messages for the current user */
  unreadCount: number;
};

/**
 * Represents a chat item in a chat list (e.g., sidebar or overview).
 */
export type ChatListItem = {
  /** Unique identifier for the chat */
  id: string;
  /** The other user in the chat (for one-to-one chat list) */
  otherUser: {
    /** User ID */
    id: string;
    /** Display name */
    name: string;
    /** Avatar image URL */
    avatar: string;
  };
  /** The last message details (or null if none) */
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: string;
  } | null;
  /** The count of unread messages for the current user */
  unreadCount: number;
};

/**
 * For error handling in chat-related API responses.
 */
export type ErrorResponse = {
  /** Error code or short description */
  error: string;
  /** Human-readable error message */
  message: string;
};
