const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const formatDate = (date) => new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function ChatWindow({
  messages,
  selectedUser,
  currentUserId,
  typingUser,
  onDeleteMessage,
  onBack,
  messagesEndRef
}) {
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || ''}${url}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-700"
            aria-label="Back to users"
          >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          </button>
        )}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-semibold text-white">
            {selectedUser?.avatar ? (
              <img src={selectedUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              selectedUser?.username?.[0]?.toUpperCase() || '?'
            )}
          </div>
          {selectedUser?.isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-800" />
          )}
        </div>
        <div>
          <p className="font-semibold">{selectedUser?.username}</p>
          <p className="text-xs text-slate-400">
            {selectedUser?.isOnline ? 'Online' : `Last seen ${formatDate(selectedUser?.lastSeen || 0)}`}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9IiMzMzQxNTUiLz48L2c+PC9zdmc+')]">
        {messages
          .filter((m) => !m.isDeleted)
          .map((m) => {
            const senderId = typeof m.senderId === 'object' ? m.senderId?._id : m.senderId;
            const isSelf = senderId === currentUserId;
            return (
              <div
                key={m._id || m.messageId}
                className={`flex ${isSelf ? 'justify-end' : 'justify-start'} chat-message`}
              >
                <div
                  className={`group max-w-[75%] md:max-w-[60%] ${
                    isSelf
                      ? 'bg-brand-500 text-white rounded-2xl rounded-br-md'
                      : 'bg-slate-700/90 text-white rounded-2xl rounded-bl-md'
                  } px-4 py-2.5 shadow-lg`}
                >
                  {!isSelf && (
                    <p className="text-xs font-medium text-brand-300 mb-1">
                      {typeof m.senderId === 'object' ? m.senderId?.username : 'User'}
                    </p>
                  )}
                  {m.messageType === 'image' ? (
                    <a
                      href={getImageUrl(m.content)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg overflow-hidden max-w-full"
                    >
                      <img
                        src={getImageUrl(m.content)}
                        alt="Shared"
                        className="max-h-64 object-contain rounded-lg"
                      />
                    </a>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                  )}
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className="text-[10px] opacity-80">
                      {formatTime(m.timestamp)}
                    </span>
                    {isSelf && (
                      <button
                        onClick={() => onDeleteMessage(m.messageId)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/20 transition-opacity"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        {typingUser && (
          <div className="flex justify-start chat-message">
            <div className="bg-slate-700/90 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full" />
              <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full" />
              <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full" />
              <span className="text-xs text-slate-400 ml-1">{typingUser} is typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
