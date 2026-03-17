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

  return (
    <aside className="w-80 md:w-96 bg-slate-900/80 border-r border-slate-700/50 flex flex-col shrink-0">
      <div className="p-3 border-b border-slate-700/50">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600/50 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No users found</div>
        ) : (
          <ul className="py-2">
            {filtered.map((u) => (
              <li key={u._id}>
                <button
                  onClick={() => onSelectUser(u)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/80 transition-colors text-left ${
                    selectedUser?._id === u._id ? 'bg-slate-800 border-l-4 border-brand-500' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-semibold text-white text-lg">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        u.username?.[0]?.toUpperCase() || '?'
                      )}
                    </div>
                    {u.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{u.username}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {u.isOnline ? (
                        <span className="text-green-400">Online</span>
                      ) : (
                        `Last seen ${formatLastSeen(u.lastSeen)}`
                      )}
                    </p>
                  </div>
                  {unreadCounts[u._id] > 0 && (
                    <span className="shrink-0 w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center">
                      {unreadCounts[u._id]}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
