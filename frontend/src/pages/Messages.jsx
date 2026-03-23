import React, { useEffect, useState, useRef } from 'react';
import { messagesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function Messages() {
  const { user } = useAuth();
  const [convos, setConvos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    messagesAPI.conversations().then(r => setConvos(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected) {
      messagesAPI.thread(selected.other_user).then(r => setMessages(r.data));
    }
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selected) return;
    try {
      const res = await messagesAPI.send({ receiverId: selected.other_user, content: text });
      setMessages(m => [...m, res.data]);
      setText('');
    } catch { toast.error('Failed to send message'); }
  };

  if (loading) return <LoadingSpinner text="Loading messages..." />;

  return (
    <div className="flex h-[calc(100vh-0px)] animate-fade-in">
      {/* Convos sidebar */}
      <div className="w-72 border-r border-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <h1 className="font-display font-bold text-white text-lg">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convos.length === 0 ? (
            <p className="text-xs text-slate-500 text-center p-6">No conversations yet</p>
          ) : convos.map(c => (
            <button key={c.other_user} onClick={() => setSelected(c)}
              className={`w-full p-4 text-left border-b border-slate-800 hover:bg-[#141929] transition-colors ${selected?.other_user === c.other_user ? 'bg-amber-500/10 border-l-2 border-l-amber-400' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                  {c.other_name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-slate-200 truncate">{c.other_name}</p>
                    {parseInt(c.unread_count) > 0 && (
                      <span className="w-5 h-5 bg-amber-500 text-midnight text-xs font-bold rounded-full flex items-center justify-center">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{c.last_message}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <MessageSquare size={40} className="text-slate-700 mb-3" />
            <p className="text-slate-500">Select a conversation to start messaging</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                {selected.other_name?.[0]?.toUpperCase()}
              </div>
              <span className="font-semibold text-slate-200">{selected.other_name}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {messages.map(m => {
                const isMe = m.sender_id === user.uid;
                return (
                  <div key={m.mid} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                      isMe ? 'bg-amber-500 text-midnight rounded-br-sm' : 'bg-[#141929] text-slate-200 border border-slate-800 rounded-bl-sm'
                    }`}>
                      <p>{m.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-midnight/60' : 'text-slate-500'}`}>
                        {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="px-6 py-4 border-t border-slate-800 flex gap-3">
              <input className="input flex-1" placeholder="Type a message..."
                value={text} onChange={e => setText(e.target.value)} />
              <button type="submit" className="btn-primary px-4 flex items-center gap-2">
                <Send size={14} /> Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
