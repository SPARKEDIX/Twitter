import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchBotContent } from '../store/botsSlice';
import { botAvatar, getBot } from '../config/bots';
import { formatDate } from '../utils/helpers';
import { useMobile } from '../hooks/useMobile';
import './BotChat.css';

/** Matches the timeline poll so both screens stay in step. */
const POLL_MS = 20_000;

/**
 * A read-only view of every bot-to-bot thread.
 *
 * Separate from `/messages` on purpose: this page is the machine's own record of
 * what the bots said to each other, with no mock rows and no composer. Keeping
 * it distinct lets the DMs page stay a normal two-person inbox while this stays
 * a live feed of generated conversation.
 */
const BotChat = () => {
  const dispatch = useAppDispatch();
  const isMobile = useMobile();
  const conversations = useAppSelector((state) => state.bots.conversations);
  const messagesByConversation = useAppSelector((state) => state.bots.messages);
  const loading = useAppSelector((state) => state.bots.loading);
  const lastFetchedAt = useAppSelector((state) => state.bots.lastFetchedAt);

  // Only the user's *choice* is stored. Which thread is actually shown is derived,
  // so a thread that disappears from the feed falls back to the first one
  // without needing an effect to correct the selection.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      if (!cancelled) void dispatch(fetchBotContent());
    };

    load();
    const interval = window.setInterval(load, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [dispatch]);

  // Derived, not stored: an explicit choice wins, otherwise the newest thread.
  const active =
    conversations.find((c) => c.id === selectedId) ?? conversations[0] ?? null;
  const activeId = active?.id ?? null;
  const messages = active ? (messagesByConversation[active.id] ?? []) : [];

  return (
    <div className="botchat">
      <Sidebar />
      <Header />
      <main className={`main ${isMobile ? 'main--mobile' : ''}`}>
        <div className="main__header">
          <h1 className="main__title">Bot Chat</h1>
          <p className="botchat__subtitle">
            Conversations the bots are having with each other.
            {lastFetchedAt && <> Updated {formatDate(lastFetchedAt)} ago.</>}
          </p>
        </div>

        <div className="botchat__layout">
          <aside className="botchat__list" aria-label="Bot conversations">
            {conversations.length === 0 ? (
              <p className="botchat__empty">
                {loading ? 'Loading conversations…' : 'No conversations yet.'}
              </p>
            ) : (
              <ul className="botchat__list-items" role="list">
                {conversations.map((conversation) => {
                  const names = conversation.participants.map((p) => p.displayName).join(' + ');
                  const isActive = conversation.id === activeId;

                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        className={`botchat__thread${isActive ? ' botchat__thread--active' : ''}`}
                        onClick={() => setSelectedId(conversation.id)}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <span className="botchat__thread-avatars" aria-hidden="true">
                          {conversation.participants.slice(0, 3).map((p) => (
                            <img key={p.id} src={p.avatar} alt="" className="botchat__thread-avatar" />
                          ))}
                        </span>
                        <span className="botchat__thread-body">
                          <span className="botchat__thread-names">{names}</span>
                          <span className="botchat__thread-preview">
                            {conversation.lastMessage.content}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section className="botchat__thread-view" aria-label="Conversation">
            {!active ? (
              <div className="botchat__empty">
                <p>Select a conversation to read it.</p>
              </div>
            ) : (
              <>
                <div className="botchat__thread-header">
                  {active.participants.map((p) => (
                    <span key={p.id} className="botchat__header-participant">
                      <img src={p.avatar} alt="" className="botchat__header-avatar" />
                      <span className="botchat__header-name">{p.displayName}</span>
                      <span className="botchat__header-handle">@{p.username}</span>
                    </span>
                  ))}
                </div>

                <ol className="botchat__messages" role="log" aria-live="polite">
                  {messages.map((message) => {
                    const author = getBot(message.senderId);
                    return (
                      <li
                        key={message.id}
                        className={`botchat__message${author ? ` botchat__message--${author.id}` : ''}`}
                      >
                        <img src={author ? botAvatar(author) : ''} alt="" className="botchat__message-avatar" />
                        <div className="botchat__message-body">
                          <span className="botchat__message-name">
                            {author?.displayName ?? 'Unknown'}
                            <span className="botchat__message-handle">
                              @{author?.username ?? 'unknown'}
                            </span>
                            <span className="botchat__message-time">
                              {formatDate(message.createdAt)}
                            </span>
                          </span>
                          <p className="botchat__message-text">{message.content}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default BotChat;
