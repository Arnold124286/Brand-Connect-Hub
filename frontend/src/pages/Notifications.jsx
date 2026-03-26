import React, { useEffect, useState } from 'react';
import { notificationsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Bell, CheckCircle, Clock, Info, ShieldCheck, CreditCard, Mail, Star, Trash2 } from 'lucide-react';
import { format, isValid } from 'date-fns';

const IconMap = {
  payment_escrowed: CreditCard,
  project_accepted: CheckCircle,
  new_bid: Star,
  info: Info,
  alert: ShieldCheck,
};

const ColorMap = {
  payment_escrowed: 'text-green-400 bg-green-400/10',
  project_accepted: 'text-blue-400 bg-blue-400/10',
  new_bid: 'text-amber-400 bg-amber-400/10',
  info: 'text-slate-400 bg-slate-400/10',
  alert: 'text-red-400 bg-red-400/10',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const { data } = await notificationsAPI.list();
      setNotifications(data);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleRead = async (id) => {
    try {
      await notificationsAPI.read(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.readAll();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  if (loading) return <LoadingSpinner text="Loading notifications..." />;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in font-body">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">Notification Center</h1>
          <p className="text-slate-400 text-lg">You have {unreadCount} unread alerts.</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="text-sm font-bold text-[#14a800] hover:bg-[#14a800]/10 px-6 py-2.5 rounded-full border border-[#14a800]/20 transition-all"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-[#1c2237] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
        {notifications.length === 0 ? (
          <div className="p-24 text-center">
            <Bell size={64} className="mx-auto text-slate-700 opacity-20 mb-6" />
            <p className="text-2xl font-bold text-slate-500">Inbox Zero!</p>
            <p className="text-slate-600">You're all caught up with your notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {notifications.map((n) => {
              const Icon = IconMap[n.type] || Info;
              const colorClass = ColorMap[n.type] || ColorMap.info;
              
              return (
                <div 
                  key={n.id} 
                  className={`p-6 flex gap-6 transition-colors hover:bg-slate-800/20 group ${!n.is_read ? 'bg-[#14a800]/5' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className={`font-bold transition-colors ${!n.is_read ? 'text-white' : 'text-slate-400'}`}>
                        {n.title}
                      </h3>
                      <p className="text-[11px] font-black uppercase text-slate-600 tracking-widest whitespace-nowrap">
                        {n.created_at ? format(new Date(n.created_at), 'MMM d, h:mm a') : 'Now'}
                      </p>
                    </div>
                    <p className={`text-sm ${!n.is_read ? 'text-slate-300' : 'text-slate-500'}`}>
                      {n.message}
                    </p>
                    
                    {!n.is_read && (
                      <button 
                        onClick={() => handleRead(n.id)}
                        className="mt-4 text-[11px] font-black uppercase text-[#14a800] tracking-widest hover:underline"
                      >
                        Dismiss alert
                      </button>
                    )}
                  </div>
                  {!n.is_read && <div className="w-2.5 h-2.5 bg-[#14a800] rounded-full flex-shrink-0 animate-pulse mt-2" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
