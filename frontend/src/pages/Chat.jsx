import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { userAPI, messageAPI } from '../api/api';
import UserSidebar from '../components/chat/UserSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import MessageInput from '../components/chat/MessageInput';
import ProfileModal from '../components/chat/ProfileModal';
import toast from 'react-hot-toast';

export default function Chat() {
  const { user, logout, updateUser } = useAuth();
  const { socket, connected } = useSocket();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showOwnProfile, setShowOwnProfile] = useState(false);
  const [ownProfile, setOwnProfile] = useState(user);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const getChatId = (u1, u2) => [u1, u2].sort().join('_');

  const loadUsers = useCallback(async () => {
    try {
      const { data } = await userAPI.getAll();
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const { data } = await messageAPI.getChatHistory(userId);
      setMessages(data);
    } catch {
      toast.error('Failed to load messages');
      setMessages([]);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser._id);
      socket?.emit('join', { receiverId: selectedUser._id });
      setUnreadCounts((prev) => ({ ...prev, [selectedUser._id]: 0 }));
    }
  }, [selectedUser?._id, socket, loadMessages]);

  useEffect(() => {
    if (!socket) return;

    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (selectedUser?._id !== msg.senderId?._id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.senderId?._id]: (prev[msg.senderId?._id] || 0) + 1,
        }));
      }
    });

    socket.on('image', (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (selectedUser?._id !== msg.senderId?._id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.senderId?._id]: (prev[msg.senderId?._id] || 0) + 1,
        }));
      }
    });

    socket.on('typing', ({ username }) => setTypingUser(username));
    socket.on('stopTyping', () => setTypingUser(null));

    socket.on('messageDeleted', ({ messageId }) => {
      setMessages((prev) => prev.map((m) => (m.messageId === messageId ? { ...m, isDeleted: true } : m)));
    });

    socket.on('userStatus', ({ userId, isOnline, lastSeen }) => {
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isOnline, lastSeen } : u)));
      if (selectedUser?._id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, isOnline, lastSeen } : prev);
      }
    });

    socket.on('messagesRead', ({ messageIds }) => {
      setMessages((prev) =>
        prev.map((m) => (messageIds.includes(m.messageId) ? { ...m, isRead: true } : m))
      );
    });

    socket.on('messageReaction', ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    });

    return () => {
      socket.off('message');
      socket.off('image');
      socket.off('typing');
      socket.off('stopTyping');
      socket.off('messageDeleted');
      socket.off('userStatus');
      socket.off('messagesRead');
      socket.off('messageReaction');
    };
  }, [socket, selectedUser?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  const handleSendMessage = (content) => {
    if (!selectedUser || !content.trim()) return;
    if (selectedUser.isBlocked) {
      toast.error('You have blocked this user');
      return;
    }
    socket?.emit('message', { receiverId: selectedUser._id, content });
  };

  const handleSendImage = (message) => {
    if (!message) return;
    setMessages((prev) => [...prev, message]);
  };

  const handleTyping = () => {
    if (!selectedUser) return;
    socket?.emit('typing', { receiverId: selectedUser._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stopTyping', { receiverId: selectedUser._id });
    }, 1500);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const msg = messages.find((m) => m.messageId === messageId);
      if (!msg) return;
      await messageAPI.delete(msg._id);
      socket?.emit('deleteMessage', { messageId });
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const handleBlock = (userId) => {
    setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isBlocked: true } : u)));
    if (selectedUser?._id === userId) setSelectedUser((prev) => ({ ...prev, isBlocked: true }));
  };

  const handleUnblock = (userId) => {
    setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isBlocked: false } : u)));
    if (selectedUser?._id === userId) setSelectedUser((prev) => ({ ...prev, isBlocked: false }));
  };

  const handleProfileSave = (updatedUser) => {
    updateUser({ username: updatedUser.username, avatar: updatedUser.avatar, bio: updatedUser.bio });
    setOwnProfile((prev) => ({ ...prev, ...updatedUser }));
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOwnProfile(true)}
            className="relative w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-white overflow-hidden hover:ring-2 hover:ring-brand-400 transition-all"
            title="Your profile"
          >
            {ownProfile?.avatar
              ? <img src={ownProfile.avatar} alt="" className="w-full h-full object-cover" />
              : user?.username?.[0]?.toUpperCase() || '?'}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900" />
          </button>
          <div>
            <p className="font-semibold text-sm text-white leading-tight">{user?.username}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              {connected ? 'Connected' : 'Reconnecting...'}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 hover:text-white font-medium transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-auto md:min-w-0 shrink-0`}>
          <UserSidebar
            users={users}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
            loading={loading}
            unreadCounts={unreadCounts}
            currentUserId={user?._id}
          />
        </div>
        <div className={`flex-1 flex flex-col min-w-0 bg-slate-900/50 ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {selectedUser ? (
            <>
              <ChatWindow
                messages={messages}
                setMessages={setMessages}
                selectedUser={selectedUser}
                currentUserId={user?._id}
                typingUser={typingUser}
                onDeleteMessage={handleDeleteMessage}
                onBack={() => setSelectedUser(null)}
                messagesEndRef={messagesEndRef}
                onBlock={handleBlock}
                onUnblock={handleUnblock}
              />
              <MessageInput
                selectedUser={selectedUser}
                onSend={handleSendMessage}
                onSendImage={handleSendImage}
                onTyping={handleTyping}
                disabled={!connected || selectedUser?.isBlocked}
              />
              {selectedUser?.isBlocked && (
                <div className="px-4 py-2.5 bg-red-950/50 border-t border-red-900/50 text-center text-xs text-red-400 flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  You've blocked this user. Unblock to send messages.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 select-none">
              <div className="w-20 h-20 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-base font-medium text-slate-500">Select a conversation</p>
              <p className="text-sm text-slate-600 mt-1">Pick someone from the sidebar to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Own Profile Modal */}
      {showOwnProfile && (
        <ProfileModal
          user={{ ...ownProfile, ...user }}
          isOwnProfile={true}
          onClose={() => setShowOwnProfile(false)}
          onBlock={() => {}}
          onUnblock={() => {}}
          isBlocked={false}
          onSave={handleProfileSave}
        />
      )}
    </div>
  );
}
