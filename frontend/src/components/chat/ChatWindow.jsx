import { useState } from 'react';
import { messageAPI } from '../../api/api';
import ProfileModal from './ProfileModal';
import toast from 'react-hot-toast';

const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const formatDate = (date) => new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function getDateLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function ChatWindow({
  messages, setMessages, selectedUser, currentUserId,
  typingUser, onDeleteMessage, onBack, messagesEndRef, onBlock, onUnblock,
}) {
  const [showProfile, setShowProfile] = useState(false);
  const [reactionPickerFor, setReactionPickerFor] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || ''}${url}`;
  };

  const handleReact = async (messageDbId, emoji) => {
    try {
      const { data } = await messageAPI.react(messageDbId, emoji);
      setMessages((prev) => prev.map((m) => (m._id === messageDbId ? { ...m, reactions: data.reactions } : m)));
    } catch {
      toast.error('Failed to react');
    }
    setReactionPickerFor(null);
  };

  const groupedReactions = (reactions = []) => {
    const map = {};
    reactions.forEach(({ emoji }) => { map[emoji] = (map[emoji] || 0) + 1; });
    return Object.entries(map);
  };

  // Group messages by date
  const visibleMessages = messages.filter((m) => !m.isDeleted);
  const withDateSeps = [];
  let lastDate = null;
  visibleMessages.forEach((m) => {
    const label = getDateLabel(m.timestamp);
    if (label !== lastDate) {
      withDateSeps.push({ type: 'separator', label, key: `sep-${m._id}` });
      lastDate = label;
    }
    withDateSeps.push({ type: 'message', data: m });
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        {onBack && (
          <button onClick={onBack}
            className="md:hidden p-2 -ml-1 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Back">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <button onClick={() => setShowProfile(true)}
          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-semibold text-white overflow-hidden">
              {selectedUser?.avatar
                ? <img src={selectedUser.avatar} alt="" className="w-full h-full object-cover" />
                : selectedUser?.username?.[0]?.toUpperCase() || '?'}
            </div>
            {selectedUser?.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{selectedUser?.username}</p>
            <p className="text-xs text-slate-400">
              {selectedUser?.isOnline ? (
                <span className="text-green-400">● Online</span>
              ) : (
                `Last seen ${formatDate(selectedUser?.lastSeen || 0)}`
              )}
            </p>
          </div>
        </button>

        {selectedUser?.isBlocked && (
          <span className="text-xs bg-red-500/15 text-red-400 px-2.5 py-1 rounded-full shrink-0">Blocked</span>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)' }}
        onClick={() => setReactionPickerFor(null)}
      >
        {withDateSeps.map((item) => {
          if (item.type === 'separator') {
            return (
              <div key={item.key} className="date-separator my-4">
                {item.label}
              </div>
            );
          }

          const m = item.data;
          const senderId = typeof m.senderId === 'object' ? m.senderId?._id : m.senderId;
          const isSelf = senderId === currentUserId;
          const reactions = groupedReactions(m.reactions);

          return (
            <div key={m._id || m.messageId}
              className={`flex ${isSelf ? 'justify-end' : 'justify-start'} chat-message mb-1`}>
              {/* Other user avatar */}
              {!isSelf && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-semibold text-white shrink-0 mr-2 mt-auto mb-1 overflow-hidden">
                  {selectedUser?.avatar
                    ? <img src={selectedUser.avatar} alt="" className="w-full h-full object-cover" />
                    : selectedUser?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}

              <div className={`relative group max-w-[75%] md:max-w-[60%] ${isSelf ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`${
                  isSelf
                    ? 'bg-brand-600 text-white rounded-2xl rounded-br-sm'
                    : 'bg-slate-800 text-white rounded-2xl rounded-bl-sm'
                } px-3.5 py-2.5 shadow-md`}>
                  {m.messageType === 'image' ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); setLightbox(getImageUrl(m.content)); }}
                      className="block rounded-xl overflow-hidden max-w-full hover:opacity-90 transition-opacity"
                    >
                      <img src={getImageUrl(m.content)} alt="Shared"
                        className="max-h-56 max-w-full object-contain rounded-xl" />
                    </button>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                  )}

                  <div className={`flex items-center gap-1.5 mt-1 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] opacity-60">{formatTime(m.timestamp)}</span>
                    {isSelf && (
                      <span className={`text-[11px] leading-none ${m.isRead ? 'text-blue-300' : 'opacity-50'}`}>
                        {m.isRead ? '✓✓' : '✓'}
                      </span>
                    )}
                    {isSelf && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteMessage(m.messageId); }}
                        className="opacity-0 group-hover:opacity-100 ml-1 hover:text-red-300 transition-all"
                        title="Delete">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Reaction trigger */}
                <button
                  onClick={(e) => { e.stopPropagation(); setReactionPickerFor(reactionPickerFor === m._id ? null : m._id); }}
                  className={`absolute ${isSelf ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-base transition-all hover:scale-125`}
                >😊</button>

                {/* Reaction picker */}
                {reactionPickerFor === m._id && (
                  <div
                    className={`absolute ${isSelf ? 'right-0' : 'left-0'} -top-11 z-10 flex gap-1 bg-slate-800 border border-slate-700 rounded-full px-2.5 py-1.5 shadow-xl`}
                    onClick={(e) => e.stopPropagation()}>
                    {QUICK_EMOJIS.map((emoji) => (
                      <button key={emoji} onClick={() => handleReact(m._id, emoji)}
                        className="text-lg hover:scale-125 transition-transform leading-none">
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Reactions display */}
                {reactions.length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                    {reactions.map(([emoji, count]) => (
                      <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReact(m._id, emoji); }}
                        className="text-xs bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 hover:bg-slate-700 transition-colors flex items-center gap-0.5">
                        {emoji}{count > 1 && <span className="text-slate-400">{count}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUser && (
          <div className="flex justify-start items-end gap-2 chat-message">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs shrink-0">
              {selectedUser?.username?.[0]?.toUpperCase()}
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="typing-dot w-1.5 h-1.5 bg-slate-400 rounded-full" />
              <span className="typing-dot w-1.5 h-1.5 bg-slate-400 rounded-full" />
              <span className="typing-dot w-1.5 h-1.5 bg-slate-400 rounded-full" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          user={selectedUser}
          isOwnProfile={false}
          isBlocked={selectedUser?.isBlocked}
          onClose={() => setShowProfile(false)}
          onBlock={onBlock}
          onUnblock={onUnblock}
        />
      )}

      {/* Image Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Full size" className="max-w-full max-h-full object-contain rounded-xl lightbox-enter shadow-2xl" />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
