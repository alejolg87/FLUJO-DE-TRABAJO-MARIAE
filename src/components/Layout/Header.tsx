import { useState, useEffect } from 'react';
import { Search, Bell, Menu, User, Check, Trash2 } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import { subscribeNotifications, markNotificationAsRead, Notification } from '../../lib/db';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = subscribeNotifications(profile.uid, setNotifications);
    return () => unsub();
  }, [profile?.uid]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 border-b border-outline bg-surface flex items-center justify-between px-8 z-20">
      <div className="flex items-center gap-6 flex-1">
        <button className="md:hidden p-2 text-text-muted hover:bg-surface-container-low rounded-sm">
          <Menu size={20} />
        </button>
        <div className="relative max-w-lg w-full hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" size={16} />
          <input 
            type="text" 
            placeholder="Buscar proyectos, tareas, mensajes..." 
            className="w-full bg-surface-container-low border border-transparent rounded-sm pl-10 pr-4 py-2 text-sm focus:bg-white focus:border-primary transition-all shadow-sm outline-none text-text-main placeholder:text-text-muted/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1 relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-text-muted hover:text-text-main transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-surface animate-pulse"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-80 bg-surface border border-outline rounded-sm shadow-2xl z-20 overflow-hidden"
                >
                  <div className="p-4 border-b border-outline flex items-center justify-between bg-surface-container-low">
                    <h3 className="text-xs font-bold text-text-main uppercase tracking-widest">Notificaciones</h3>
                    <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} nuevas
                    </span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-outline">
                        {notifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={`p-4 hover:bg-surface-container transition-colors group ${!n.read ? 'bg-primary/5' : ''}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-text-main truncate">{n.title}</p>
                                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                                  {n.message}
                                </p>
                                <p className="text-[9px] text-text-muted mt-2 opacity-50 uppercase font-black">
                                  {n.createdAt?.toDate?.().toLocaleString() || 'Ahora mismo'}
                                </p>
                              </div>
                              {!n.read && (
                                <button 
                                  onClick={() => markNotificationAsRead(n.id!)}
                                  className="p-1.5 rounded-sm bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                  title="Marcar como leída"
                                >
                                  <Check size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center italic">
                        <Bell size={24} className="mx-auto text-text-muted/20 mb-3" />
                        <p className="text-xs text-text-muted uppercase tracking-widest font-black">Sin notificaciones</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        <div className="h-4 w-px bg-outline"></div>
        
        <button 
          onClick={() => signOut(auth)}
          className="text-text-muted hover:text-rose-500 transition-colors text-[10px] font-bold uppercase tracking-widest"
        >
          Cerrar Sesión
        </button>
        
      </div>
    </header>
  );
}
