import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { userAPI, messageAPI } from '../api/api';
import UserSidebar from '../components/chat/UserSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import MessageInput from '../components/chat/MessageInput';
import toast from 'react-hot-toast';

export default function Chat() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
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

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
          [msg.senderId?._id]: (prev[msg.senderId?._id] || 0) + 1
        }));
      }
    });

    socket.on('image', (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (selectedUser?._id !== msg.senderId?._id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.senderId?._id]: (prev[msg.senderId?._id] || 0) + 1
        }));
      }
    });

    socket.on('typing', ({ username }) => setTypingUser(username));
    socket.on('stopTyping', () => setTypingUser(null));
    socket.on('messageDeleted', ({ messageId }) => {
      setMessages((prev) => prev.map((m) =>
        m.messageId === messageId ? { ...m, isDeleted: true } : m
      ));
    });
    socket.on('userStatus', ({ userId, isOnline, lastSeen }) => {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isOnline, lastSeen } : u
        )
      );
    });

    return () => {
      socket.off('message');
      socket.off('image');
      socket.off('typing');
      socket.off('stopTyping');
      socket.off('messageDeleted');
      socket.off('userStatus');
    };
  }, [socket, selectedUser?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  const handleSendMessage = (content) => {
    if (!selectedUser || !content.trim()) return;
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

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-700/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-white">
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="font-semibold text-lg">Real-Time Chat</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-colors"
        >
          Logout
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
                selectedUser={selectedUser}
                currentUserId={user?._id}
                typingUser={typingUser}
                onDeleteMessage={handleDeleteMessage}
                onBack={() => setSelectedUser(null)}
                messagesEndRef={messagesEndRef}
              />
              <MessageInput
                selectedUser={selectedUser}
                onSend={handleSendMessage}
                onSendImage={handleSendImage}
                onTyping={handleTyping}
                disabled={!connected}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg font-medium">Select a chat to start messaging</p>
              <p className="text-sm mt-1">Choose a user from the sidebar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
