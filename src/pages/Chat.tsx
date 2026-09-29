import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import type { Conversation, Message } from '../types';
// Real-only mode: mock chats removed. Conversations load from Firestore when implemented.
const mockConversations: Conversation[] = [];
const mockMessages: Record<string, Message[]> = {};
import { formatDate, generateId } from '../utils/helpers';
import { useMobile } from '../hooks/useMobile';
import type { Conversation, Message } from '../types';
import './Chat.css';
import GatedImage from '../components/GatedImage'

const CURRENT_USER_ID = 'current-user';
const MAX_MESSAGE_LENGTH = 10000;
const MAX_TEXTAREA_HEIGHT = 150;

/** Everything the component needs, in local state keyed by conversation id. */
type MessagesByConversation = Record<string, Message[]>;

const Chat = () => {
  const isMobile = useMobile();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  // Seeded from the mock data, then appended to locally so sending a
  // message actually works instead of clearing the box and doing nothing.
  const [sentMessages, setSentMessages] = useState<MessagesByConversation>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Scroll only the message pane. scrollIntoView() with no argument
    // scrolls the whole window, which jumped the page on every send.
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [activeConversationId, messagesEndRef.current?.childElementCount]);

  const filteredConversations = mockConversations.filter((conv) => {
    const otherParticipant = conv.participants.find((p) => p.id !== CURRENT_USER_ID);
    if (!otherParticipant) return true;
    const q = searchQuery.toLowerCase();
    return (
      otherParticipant.displayName.toLowerCase().includes(q) ||
      otherParticipant.username.toLowerCase().includes(q) ||
      // The input says "Search messages", so match message content too.
      conv.lastMessage.content.toLowerCase().includes(q)
    );
  });

  const activeConversation = mockConversations.find((c) => c.id === activeConversationId);

  const messages: Message[] = activeConversationId
    ? [...(mockMessages[activeConversationId] ?? []), ...(sentMessages[activeConversationId] ?? [])]
    : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || !activeConversationId) return;

    const message: Message = {
      id: generateId(),
      conversationId: activeConversationId,
      senderId: CURRENT_USER_ID,
      content,
      createdAt: new Date().toISOString(),
      read: true,
    };

    setSentMessages((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] ?? []), message],
    }));

    setNewMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, MAX_MESSAGE_LENGTH);
    setNewMessage(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }
  };

  const startNewConversation = () => {
    // For demo, select the first conversation
    if (mockConversations.length > 0) {
      setActiveConversationId(mockConversations[0].id);
    }
  };

  return (
    <div className="chat">
      <Sidebar />
      <Header />
      <main className={`main ${isMobile ? 'main--mobile' : ''}`}>
        <div className="chat__layout">
          {/* Conversations List */}
          <aside className="chat__sidebar" role="complementary" aria-label="Conversations">
            <div className="chat__sidebar-header">
              <h2 className="chat__sidebar-title">Messages</h2>
              <button
                className="chat__new-message-btn"
                onClick={startNewConversation}
                aria-label="New message"
              >
                <NewMessageIcon className="chat__new-message-icon" aria-hidden="true" />
              </button>
            </div>
            <div className="chat__search" role="search">
              <SearchIcon className="chat__search-icon" aria-hidden="true" />
              <input
                type="search"
                className="chat__search-input"
                placeholder="Search messages"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search messages"
              />
            </div>
            <ul className="chat__conversations-list" aria-label="Conversations">
              {filteredConversations.length === 0 ? (
                <li className="chat__empty">
                  <MessageOffIcon className="chat__empty-icon" aria-hidden="true" />
                  <p className="chat__empty-text">
                    {searchQuery ? 'No conversations match your search' : 'No messages yet'}
                  </p>
                  <p className="chat__empty-subtext">
                    {searchQuery ? 'Try a different search term' : 'Start a conversation with someone'}
                  </p>
                </li>
              ) : (
                filteredConversations.map((conversation) => (
                  <li key={conversation.id} role="listitem">
                    <ConversationItem
                      conversation={conversation}
                      isActive={activeConversationId === conversation.id}
                      onClick={() => setActiveConversationId(conversation.id)}
                    />
                  </li>
                ))
              )}
            </ul>
          </aside>

          {/* Chat Area - no second role="main"; the outer <main> owns that. */}
          <div className="chat__main">
            {activeConversation ? (
              <>
                <ChatHeader conversation={activeConversation} />
                <div className="chat__messages" role="log" aria-label="Messages" aria-live="polite">
                  {messages.length === 0 ? (
                    <div className="chat__no-messages">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <ul className="chat__message-list">
                      {messages.map((message) => (
                        <li key={message.id} role="listitem">
                          <MessageItem
                            message={message}
                            isOwn={message.senderId === CURRENT_USER_ID}
                            conversation={activeConversation}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <ChatInput
                  value={newMessage}
                  onChange={handleTextareaChange}
                  onSubmit={handleSendMessage}
                  textareaRef={textareaRef}
                />
              </>
            ) : (
              <div className="chat__welcome">
                <ChatBubblesIcon className="chat__welcome-icon" aria-hidden="true" />
                <h2 className="chat__welcome-title">Messages</h2>
                <p className="chat__welcome-text">
                  Select a conversation or start a new one to begin messaging.
                </p>
                <button className="chat__welcome-btn" onClick={startNewConversation}>
                  Start a conversation
                  <ArrowRightIcon className="chat__welcome-btn-icon" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

const NewMessageIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
  </svg>
);

const MessageOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="48" height="48" aria-hidden="true">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    <path d="M18 22H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2zm-2-16H6l-8 5 8 5v-10zm-2 14l-6-3.75V10l6 3.75v2.5z" />
    <path d="M2.81 2.81L1.39 4.22 8 10.83V20h2v-9.17l6.39 6.39 1.41-1.41L4.22 1.39 2.81 2.81z" />
  </svg>
);

const ChatBubblesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="64" height="64" aria-hidden="true">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
  </svg>
);

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

const ConversationItem = ({ conversation, isActive, onClick }: ConversationItemProps) => {
  const otherParticipant = conversation.participants.find((p) => p.id !== CURRENT_USER_ID) || conversation.participants[0];
  const lastMessage = conversation.lastMessage;
  const isOwnMessage = lastMessage.senderId === CURRENT_USER_ID;

  return (
    // role="listitem" on a <button> overrode the button role and broke
    // keyboard/AT semantics. The parent <li> now carries that role.
    <button
      type="button"
      className={`chat__conversation ${isActive ? 'chat__conversation--active' : ''}`}
      onClick={onClick}
      aria-current={isActive ? 'true' : undefined}
      aria-label={`${otherParticipant.displayName}${conversation.unreadCount > 0 ? `, ${conversation.unreadCount} unread` : ''}`}
    >
      <GatedImage
        src={otherParticipant.avatar}
        alt=""
        className="chat__conversation-avatar"
      />
      {otherParticipant.verified && (
        <VerifiedBadge className="chat__conversation-verified" aria-label="Verified account" />
      )}
      <div className="chat__conversation-content">
        <div className="chat__conversation-header">
          <div className="chat__conversation-name-row">
            <span className="chat__conversation-name">{otherParticipant.displayName}</span>
            {otherParticipant.verified && (
              <VerifiedBadge className="chat__conversation-verified-inline" aria-hidden="true" />
            )}
          </div>
          <time className="chat__conversation-time" dateTime={lastMessage.createdAt}>
            {formatDate(lastMessage.createdAt)}
          </time>
        </div>
        <div className="chat__conversation-preview">
          {isOwnMessage && <span className="chat__conversation-own-indicator" aria-label="You">You: </span>}
          <span className="chat__conversation-text">{lastMessage.content}</span>
        </div>
      </div>
      {conversation.unreadCount > 0 && (
        <span className="chat__conversation-unread" aria-label={`${conversation.unreadCount} unread messages`}>
          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
        </span>
      )}
    </button>
  );
};

const VerifiedBadge = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 17c-1.75 0-2.73-1.57-2.99-3.73h-.03c-.13.45-.27.88-.27 1.35 0 2.1 1.7 3.8 3.8 3.8s3.8-1.7 3.8-3.8v-5.42c.03-.09.03-.18.03-.28 0-.71-.3-1.35-.76-1.78-1.54-.14-2.37-1.46-2.51-2.97h-.03c-.46 1.78-1.9 3.18-3.76 3.37v.42zm7.06-8.3c-.12 1.56-.83 2.87-2.02 3.55-.87.5-1.9.77-3.02.77-1.11 0-2.14-.27-3.02-.77-1.19-.68-1.9-1.99-2.02-3.55-.02-.28-.03-.56-.03-.84 0-3.26 2.64-5.9 5.9-5.9s5.9 2.64 5.9 5.9c0 .28-.01.56-.03.84z" />
  </svg>
);

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  conversation: Conversation;
}

const MessageItem = ({ message, isOwn, conversation }: MessageItemProps) => {
  const otherParticipant = conversation.participants.find((p) => p.id !== CURRENT_USER_ID) || conversation.participants[0];

  return (
    <div className={`chat__message ${isOwn ? 'chat__message--own' : ''}`}>
      {!isOwn && (
        <GatedImage
          src={otherParticipant.avatar}
          alt=""
          className="chat__message-avatar"
        />
      )}
      <div className="chat__message-content">
        {!isOwn && (
          <span className="chat__message-sender">{otherParticipant.displayName}</span>
        )}
        <div className="chat__message-bubble">
          <p className="chat__message-text">{message.content}</p>
        </div>
        <time className="chat__message-time" dateTime={message.createdAt}>
          {formatDate(message.createdAt)}
        </time>
        {isOwn && message.read && (
          <CheckIcon className="chat__message-check" aria-label="Read" />
        )}
      </div>
    </div>
  );
};

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
  </svg>
);

interface ChatHeaderProps {
  conversation: Conversation;
}

const ChatHeader = ({ conversation }: ChatHeaderProps) => {
  const otherParticipant = conversation.participants.find((p) => p.id !== CURRENT_USER_ID) || conversation.participants[0];
  const isGroup = conversation.participants.length > 2;

  return (
    // The page-level <header> already owns role="banner"; a second one
    // created a competing landmark.
    <header className="chat__header">
      <div className="chat__header-avatar-wrapper">
        <GatedImage
          src={otherParticipant.avatar}
          alt=""
          className="chat__header-avatar"
        />
        {otherParticipant.verified && !isGroup && (
          <VerifiedBadge className="chat__header-verified" aria-label="Verified account" />
        )}
      </div>
      <div className="chat__header-info">
        <h3 className="chat__header-name">{isGroup ? `${conversation.participants.length} participants` : otherParticipant.displayName}</h3>
        {!isGroup && (
          <span className="chat__header-status">Active now</span>
        )}
      </div>
      <div className="chat__header-actions">
        <button className="chat__header-btn" aria-label="Voice call">
          <PhoneIcon className="chat__header-icon" aria-hidden="true" />
        </button>
        <button className="chat__header-btn" aria-label="Video call">
          <VideoIcon className="chat__header-icon" aria-hidden="true" />
        </button>
        <button className="chat__header-btn" aria-label="More options">
          <MoreIcon className="chat__header-icon" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
  </svg>
);

const VideoIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
  </svg>
);

const MoreIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

const ChatInput = ({ value, onChange, onSubmit, textareaRef }: ChatInputProps) => {
  return (
    <form className="chat__input-form" onSubmit={onSubmit}>
      <div className="chat__input-wrapper">
        <button
          type="button"
          className="chat__input-tool-btn"
          aria-label="Add image"
          disabled
        >
          <ImageIcon className="chat__input-tool-icon" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="chat__input-tool-btn"
          aria-label="Add GIF"
          disabled
        >
          <GifIcon className="chat__input-tool-icon" aria-hidden="true" />
        </button>
        <textarea
          ref={textareaRef}
          className="chat__input-textarea"
          placeholder="Message"
          value={value}
          onChange={onChange}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          aria-label="Message"
        />
      </div>
      <button
        type="submit"
        className="chat__input-send-btn"
        disabled={!value.trim()}
        aria-label="Send message"
      >
        <SendIcon className="chat__input-send-icon" aria-hidden="true" />
      </button>
    </form>
  );
};

const ImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
  </svg>
);

const GifIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h12v16zM9.5 15H8v-3h1.5v3zm2.5 0H11v-3h1.5v3zm2.5 0H13.5v-3H15v3zm4-5H16v-1.5h3.5V15H19v-3.5h1.5V10zm0-5H16V5h3.5v1.5H19V5h1.5v3.5zM8 10H6.5v3H8v-3zm0-5H6.5v3.5H8V5zm0 10H6.5v3.5H8v-3.5z" />
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

export default Chat;
