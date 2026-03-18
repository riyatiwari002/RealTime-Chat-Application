import { useState } from 'react';

function formatLastSeen(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function UserSidebar({ users, selectedUser, onSelectUser, loading, unreadCounts, currentUserId }) {
  const [search, setSearch] = useState('');

  const filtered = users.filter(
    (u) =>
      u._id !== currentUserId &&
      (u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const onlineCount = users.filter((u) => u._id !== currentUserId && u.isOnline).length;

  return (
    <aside className="w-full sm:w-80 md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Messages</h2>
          {onlineCount > 0 && (
            <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-medium">
              {onlineCount} online
            </span>
          )}
        </div>
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 input-glow text-sm transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl animate-pulse">
                <div className="w-11 h-11 rounded-full bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-800 rounded w-2/3" />
                  <div className="h-2.5 bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
            <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">{search ? 'No results found' : 'No users yet'}</p>
          </div>
        ) : (
          <ul className="p-2 space-y-0.5">
            {filtered.map((u) => {
              const isActive = selectedUser?._id === u._id;
              const unread = unreadCounts[u._id] || 0;
              return (
                <li key={u._id}>
                  <button
                    onClick={() => onSelectUser(u)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
                      isActive ? 'sidebar-active' : 'hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-white text-base overflow-hidden transition-transform group-hover:scale-105 ${
                        u.avatar ? '' : 'bg-gradient-to-br from-slate-600 to-slate-700'
                      }`}>
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          u.username?.[0]?.toUpperCase() || '?'
                        )}
                      </div>
                      {u.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`font-medium truncate text-sm ${isActive ? 'text-white' : 'text-slate-200'}`}>
                          {u.username}
                          {u.isBlocked && <span className="ml-1 text-xs text-red-400 font-normal">(blocked)</span>}
                        </p>
                        {unread > 0 && (
                          <span className="shrink-0 min-w-[20px] h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center px-1 badge-pulse">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate mt-0.5">
                        {u.isOnline ? (
                          <span className="text-green-400">● Online</span>
                        ) : (
                          <span className="text-slate-500">Last seen {formatLastSeen(u.lastSeen)}</span>
                        )}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
