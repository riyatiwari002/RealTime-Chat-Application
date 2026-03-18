import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { messageAPI } from '../../api/api';
import toast from 'react-hot-toast';

export default function MessageInput({ selectedUser, onSend, onSendImage, onTyping, disabled }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target) && !e.target.closest('[data-emoji-btn]')) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [text]);

  useEffect(() => {
    setText('');
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [selectedUser?._id]);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSendImage = async () => {
    if (!imagePreview || disabled || !selectedUser) return;
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await messageAPI.uploadImage(selectedUser._id, file);
      onSendImage(data);
      setImagePreview(null);
      fileInputRef.current.value = '';
    } catch {
      toast.error('Failed to send image');
      setImagePreview(null);
      fileInputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  const cancelPreview = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="relative bg-slate-900 border-t border-slate-800 shrink-0">
      {imagePreview && (
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50 image-preview-enter">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="h-14 w-14 object-cover rounded-lg border border-slate-600" />
            <button onClick={cancelPreview}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-600 hover:bg-red-500 flex items-center justify-center transition-colors">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 truncate">{fileInputRef.current?.files?.[0]?.name}</p>
            <p className="text-xs text-slate-500">Image ready to send</p>
          </div>
          <button onClick={handleSendImage} disabled={uploading}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2 shrink-0">
            {uploading
              ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending</>
              : 'Send Image'}
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-3">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-all shrink-0" title="Attach image">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); onTyping(); }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Cannot send messages' : 'Message... (Enter to send)'}
          rows={1}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 input-glow resize-none disabled:opacity-40 text-sm transition-all leading-relaxed"
          style={{ minHeight: '44px', maxHeight: '120px', overflowY: 'auto' }}
        />

        <button type="button" data-emoji-btn onClick={() => setShowEmoji((p) => !p)} disabled={disabled}
          className={`p-2.5 rounded-xl transition-all shrink-0 disabled:opacity-40 ${showEmoji ? 'text-brand-400 bg-brand-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <button type="button" onClick={handleSend} disabled={disabled || !text.trim()}
          className="p-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {showEmoji && (
        <div ref={emojiRef} className="absolute bottom-full right-0 mb-2 z-20">
          <EmojiPicker
            onEmojiClick={(d) => { setText((p) => p + d.emoji); textareaRef.current?.focus(); }}
            theme="dark" width={300} height={380}
            skinTonesDisabled previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
}
