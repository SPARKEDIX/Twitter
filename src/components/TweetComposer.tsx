import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { addTweet } from '../store/tweetsSlice';
import { addNotification } from '../store/uiSlice';
import './TweetComposer.css';

const TweetComposer = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const charCount = content.length;
  const isOverLimit = charCount > 280;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    if (currentUser) {
      const newTweet = {
        id: Date.now().toString(),
        author: currentUser,
        content: content.trim(),
        images: imageFile ? [URL.createObjectURL(imageFile)] : undefined,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        retweetsCount: 0,
        repliesCount: 0,
        isLiked: false,
        isRetweeted: false,
        isBookmarked: false,
      };
      dispatch(addTweet(newTweet));
      dispatch(addNotification({ type: 'success', message: 'Your post has been sent!' }));
    } else {
      dispatch(addNotification({ type: 'error', message: 'Please log in to post' }));
    }

    setContent('');
    setImagePreview(null);
    setImageFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        dispatch(addNotification({ type: 'error', message: 'Image must be less than 5MB' }));
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!currentUser) return null;

  return (
    <form className="tweet-composer" onSubmit={handleSubmit}>
      <div className="tweet-composer__header">
        <img
          src={currentUser.avatar}
          alt=""
          className="tweet-composer__avatar"
          aria-hidden="true"
        />
        <div className="tweet-composer__input-wrapper">
          <textarea
            ref={textareaRef}
            className="tweet-composer__textarea"
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            aria-label="Tweet content"
            rows={1}
            maxLength={280}
          />
          <div className="tweet-composer__char-count" aria-live="polite">
            <span className={isOverLimit ? 'tweet-composer__char-count--over' : ''}>
              {charCount}
            </span>
            <span className="tweet-composer__char-count-total">/280</span>
          </div>
        </div>
      </div>

      {imagePreview && (
        <div className="tweet-composer__preview">
          <img src={imagePreview} alt="Preview" className="tweet-composer__preview-img" />
          <button
            type="button"
            className="tweet-composer__remove-btn"
            onClick={removeImage}
            aria-label="Remove image"
          >
            <CloseIcon className="tweet-composer__remove-icon" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="tweet-composer__footer">
        <div className="tweet-composer__tools" role="group" aria-label="Composer tools">
          <button
            type="button"
            className="tweet-composer__tool-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Add image"
          >
            <ImageIcon className="tweet-composer__tool-icon" aria-hidden="true" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="tweet-composer__file-input"
            aria-hidden="true"
          />
          <button
            type="button"
            className="tweet-composer__tool-btn"
            aria-label="Add GIF"
          >
            <GifIcon className="tweet-composer__tool-icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="tweet-composer__tool-btn"
            aria-label="Add poll"
          >
            <PollIcon className="tweet-composer__tool-icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="tweet-composer__tool-btn"
            aria-label="Add emoji"
          >
            <EmojiIcon className="tweet-composer__tool-icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="tweet-composer__tool-btn"
            aria-label="Schedule post"
          >
            <ScheduleIcon className="tweet-composer__tool-icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="tweet-composer__tool-btn"
            aria-label="Add location"
          >
            <LocationIcon className="tweet-composer__tool-icon" aria-hidden="true" />
          </button>
        </div>
        <button
          type="submit"
          className="tweet-composer__post-btn"
          disabled={(!content.trim() && !imageFile) || isOverLimit}
          aria-label="Post"
        >
          Post
        </button>
      </div>
    </form>
  );
};

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

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

const PollIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M4 3h16v2H4V3zm0 14h16v2H4v-2zm0-7h16v2H4v-2zM1 9h2v2H1V9zm0 7h2v2H1v-2zm0-7h2v2H1v-2zm20 2h2v2h-2v-2zm0-7h2v2h-2V9zm0 7h2v2h-2v-2z" />
  </svg>
);

const EmojiIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 3c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm4-3c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 3c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
  </svg>
);

const ScheduleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
  </svg>
);

const LocationIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

export default TweetComposer;