import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { messageAPI } from '../../api/api';

export default function MessageInput({ selectedUser, onSend, onSendImage, onTyping, disabled }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target) && !e.target.closest('button[title="Emoji"]')) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSendPreview = async () => {
    if (!imagePreview || disabled || !selectedUser) return;
    const fileInput = fileInputRef.current;
    if (!fileInput?.files?.[0]) return;
    
    setUploading(true);
    try {
      const { data } = await messageAPI.uploadImage(selectedUser._id, fileInput.files[0]);
      onSendImage(data);
      setImagePreview(null);
      fileInput.value = '';
    } catch {
      setImagePreview(null);
      fileInput.value = '';
    } finally {
      setUploading(false);
    }
  };

  const cancelPreview = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="relative p-4 bg-slate-800/50 border-t border-slate-700/50 shrink-0">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-3 p-2 bg-slate-800 rounded-xl image-preview-enter">
          <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
          <div className="flex-1" />
          <button
            onClick={cancelPreview}
            className="p-2 rounded-lg hover:bg-slate-600 text-slate-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={handleSendPreview}
            disabled={uploading}
            className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 font-medium"
          >
            {uploading ? 'Sending...' : 'Send'}
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onTyping();
            }}
            onFocus={onTyping}
            placeholder="Type a message..."
            disabled={disabled}
            className="w-full px-4 py-3 pr-12 rounded-2xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none disabled:opacity-50"
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-1.5 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white disabled:opacity-50"
              title="Upload image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setShowEmoji((p) => !p)}
              disabled={disabled}
              className="p-1.5 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white disabled:opacity-50"
              title="Emoji"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="p-3 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
      {showEmoji && (
        <div ref={emojiRef} className="absolute bottom-full left-4 mb-2 z-20 max-h-[50vh] overflow-auto">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" width={320} height={350} />
        </div>
      )}
    </div>
  );
}
