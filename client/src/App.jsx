import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import axios from 'axios';
import { MessageSquare, Send, Search, LogOut, CheckCheck, Check, Shield } from 'lucide-react';
import AuthScreen from './components/AuthScreen';

export default function App() {
  const { currentUser, logout, loading } = useAuth();
  const socket = useSocket();

  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load Contacts
  useEffect(() => {
    if (!currentUser) return;
    axios.get('/api/users').then((res) => {
      setUsers(res.data.data);
      if (res.data.data.length > 0) {
        selectUser(res.data.data[0]);
      }
    });
  }, [currentUser]);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    // Presence updates
    socket.on('user:status_changed', ({ userId, status, lastSeen }) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status, last_seen_at: lastSeen || u.last_seen_at } : u));
      setActiveUser(prev => prev && prev.id === userId ? { ...prev, status, last_seen_at: lastSeen || prev.last_seen_at } : prev);
    });

    // Real-time message receive (zero polling)
    socket.on('message:receive', (msg) => {
      if (activeUser && msg.senderId === activeUser.id) {
        setMessages(prev => [...prev, msg]);
        socket.emit('message:seen', {
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          messageIds: [msg.id],
        });
      } else {
        setUnreadCounts(prev => ({ ...prev, [msg.senderId]: (prev[msg.senderId] || 0) + 1 }));
      }
    });

    // Typing status
    socket.on('user:typing', ({ senderId, isTyping: typing }) => {
      if (activeUser && activeUser.id === senderId) {
        setIsTyping(typing);
      }
    });

    // Read receipt
    socket.on('message:status_update', ({ conversationId: cId, status }) => {
      setMessages(prev => prev.map(m => m.conversationId === cId ? { ...m, status } : m));
    });

    return () => {
      socket.off('user:status_changed');
      socket.off('message:receive');
      socket.off('user:typing');
      socket.off('message:status_update');
    };
  }, [socket, activeUser]);

  // Select contact & fetch history
  const selectUser = async (user) => {
    setActiveUser(user);
    setIsTyping(false);
    setUnreadCounts(prev => ({ ...prev, [user.id]: 0 }));

    const convoRes = await axios.post('/api/conversations', { targetUserId: user.id });
    const cId = convoRes.data.data.conversationId;
    setConversationId(cId);

    const msgRes = await axios.get(`/api/conversations/${cId}/messages?limit=60`);
    setMessages(msgRes.data.data);

    if (socket) {
      socket.emit('message:seen', { conversationId: cId, senderId: user.id });
    }
  };

  // Send message
  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !activeUser) return;

    const tempId = 'temp_' + Date.now();
    const optimistic = {
      id: tempId,
      conversationId,
      senderId: currentUser.id,
      recipientId: activeUser.id,
      content: inputText,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    socket.emit('message:send', {
      recipientId: activeUser.id,
      content: inputText,
      tempId,
    }, (ack) => {
      if (ack?.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? ack.message : m));
      }
    });

    socket.emit('message:typing', { recipientId: activeUser.id, isTyping: false });
    setInputText('');
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !activeUser) return;
    socket.emit('message:typing', { recipientId: activeUser.id, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('message:typing', { recipientId: activeUser.id, isTyping: false });
    }, 1500);
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium tracking-wide">Loading Chat System...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  const userAvatar = currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name || 'User')}`;

  return (
    <div className="flex h-screen bg-slate-100 antialiased font-sans">
      {/* Sidebar */}
      <div className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <img src={userAvatar} alt={currentUser.name} className="w-10 h-10 rounded-full bg-slate-200" />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">{currentUser.name}</h2>
              <p className="text-xs text-emerald-600 font-medium">Online</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-9 pr-3 py-2 bg-slate-100 border-0 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              onClick={() => selectUser(user)}
              className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                activeUser?.id === user.id ? 'bg-blue-50 border-r-4 border-blue-600' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-full bg-slate-200" />
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    user.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold truncate text-slate-800">{user.name}</h3>
                  <p className="text-xs text-slate-400">{user.status === 'online' ? 'Active now' : 'Offline'}</p>
                </div>
              </div>
              {unreadCounts[user.id] > 0 && (
                <span className="w-5 h-5 bg-blue-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                  {unreadCounts[user.id]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-50">
        {activeUser ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={activeUser.avatar} alt={activeUser.name} className="w-10 h-10 rounded-full bg-slate-200" />
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    activeUser.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">{activeUser.name}</h2>
                  <p className="text-xs text-slate-400">
                    {isTyping ? (
                      <span className="text-blue-600 font-medium animate-pulse">Typing...</span>
                    ) : activeUser.status === 'online' ? (
                      <span className="text-emerald-600 font-medium">Online</span>
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-medium">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                Auto-Masking Active
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser.id;
                const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm break-words ${
                      isMe ? 'bg-blue-600 text-white rounded-br-xs' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1">
                      <span>{timeStr}</span>
                      {isMe && (
                        <span>
                          {msg.status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" /> : <Check className="w-3.5 h-3.5" />}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-slate-200">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Type a message (e.g. Call me at 9876543210 or email user@test.com)..."
                  className="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-12 h-12 mb-2 text-slate-300" />
            <p className="text-sm font-semibold">Select a user to start conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
