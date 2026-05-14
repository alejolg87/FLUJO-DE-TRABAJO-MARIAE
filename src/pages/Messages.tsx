import { useState, useEffect, useRef } from 'react';
import { Search, Hash, AtSign, Smile, Paperclip, Send, Plus, Lock, MoreVertical } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { subscribeChannels, subscribeMessages, createChannel, sendMessage, Channel, Message as MessageType } from '../lib/db';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';

export default function Messages() {
  const { workspace, profile } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{file: File, preview?: string}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      // Cleanup previews
      attachedFiles.forEach(af => {
        if (af.preview) URL.revokeObjectURL(af.preview);
      });
    };
  }, [attachedFiles]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!workspace?.id) return;
    const unsubscribe = subscribeChannels(workspace.id, (data) => {
      setChannels(data);
      if (data.length > 0 && !activeChannelId) {
        setActiveChannelId(data[0].id!);
      } else if (data.length === 0) {
        // Create a default general channel if none exists
        createChannel({ 
          name: 'general', 
          type: 'public', 
          workspaceId: workspace.id 
        });
      }
    });
    return () => unsubscribe();
  }, [workspace?.id]);

  useEffect(() => {
    if (!activeChannelId) return;
    const unsubscribe = subscribeMessages(activeChannelId, setMessages);
    return () => unsubscribe();
  }, [activeChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!newMessage.trim() && attachedFiles.length === 0) || !activeChannelId || !profile) return;

    setLoading(true);
    const content = newMessage;
    setNewMessage('');
    
    try {
      const attachments = await Promise.all(attachedFiles.map(async ({file, preview}) => {
        // In a real app we'd upload to Storage
        // For now, we'll use a data URL if small, or just mock metadata
        // Actually, let's use the local preview for the current session and simulation
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          url: preview || '#' // Fallback
        };
      }));

      const messageData: any = {
        content,
        channelId: activeChannelId,
        senderId: profile.uid,
        senderName: profile.displayName || 'Usuario',
        senderPhoto: profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}&background=6366f1&color=fff`
      };

      if (attachments.length > 0) {
        messageData.attachments = attachments;
      }

      await sendMessage(messageData);
      
      setAttachedFiles([]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') || file.type.startsWith('video/') 
        ? URL.createObjectURL(file) 
        : undefined
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) URL.revokeObjectURL(newFiles[index].preview!);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);

  return (
    <div className="flex h-full -m-8 border-l border-outline bg-background overflow-hidden animate-in fade-in duration-700">
      {/* Sidebar de Mensajes */}
      <aside className="w-72 border-r border-outline flex flex-col bg-surface">
        <div className="p-8 border-b border-outline">
          <h2 className="text-xl font-bold text-text-main tracking-tight">Mensajes</h2>
        </div>
        
        <div className="p-4 border-b border-outline bg-surface-container-low/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" size={16} />
            <input 
              type="text" 
              placeholder="Buscar conversación..." 
              className="w-full bg-surface-container-low border border-outline rounded-full pl-10 pr-4 py-2 text-sm text-text-main focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="mt-8">
            <div className="space-y-1 px-3 mt-4">
              {channels.filter(c => c.name !== 'general').map((channel) => (
                <div 
                  key={channel.id} 
                  onClick={() => setActiveChannelId(channel.id!)}
                  className={`flex items-center gap-3 px-5 py-2.5 rounded-sm cursor-pointer transition-all border border-transparent ${
                    activeChannelId === channel.id 
                      ? 'bg-tertiary text-primary shadow-sm font-semibold' 
                      : 'text-text-muted hover:bg-surface-container hover:text-text-main group'
                  }`}
                >
                  <Hash size={18} className={activeChannelId === channel.id ? 'text-primary' : 'text-text-muted/50 group-hover:text-text-main'} />
                  <span className="text-sm truncate flex-1">{channel.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-background no-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-text-muted text-[10px] uppercase font-bold tracking-widest italic">
              Sin mensajes aún en este canal
            </div>
          )}
          {messages.map((msg, idx) => (
            <Message 
              key={msg.id}
              user={msg.senderName} 
              time={msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'} 
              text={msg.content} 
              avatar={msg.senderPhoto}
              isSelf={msg.senderId === profile?.uid}
              attachments={msg.attachments}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-8 pt-0 bg-background">
          <form 
            onSubmit={handleSendMessage}
            className="bg-surface border border-outline rounded-sm shadow-xl overflow-hidden focus-within:border-primary transition-all"
          >
            {attachedFiles.length > 0 && (
              <div className="p-4 bg-surface-container-low/50 border-b border-outline flex gap-3 overflow-x-auto no-scrollbar">
                {attachedFiles.map(({file, preview}, index) => (
                  <div key={index} className="relative shrink-0 group">
                    <div className="w-20 h-20 rounded-sm border border-outline bg-surface overflow-hidden flex items-center justify-center">
                      {preview ? (
                        file.type.startsWith('image/') ? (
                          <img src={preview} className="w-full h-full object-cover" />
                        ) : (
                          <video src={preview} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-1 p-2">
                          <Paperclip size={20} className="text-text-muted" />
                          <span className="text-[8px] text-text-muted truncate w-full text-center">{file.name}</span>
                        </div>
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeFile(index)}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus size={10} className="rotate-45" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <textarea 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full px-6 py-4 text-sm bg-transparent text-text-main focus:ring-0 border-none resize-none min-h-[100px] placeholder:text-text-muted/20" 
              placeholder="Escribe un mensaje..." 
            ></textarea>
            <div className="flex justify-between items-center p-3 px-6 bg-surface-container-low">
              <div className="flex items-center gap-2 text-text-muted relative" ref={emojiPickerRef}>
                <button 
                  type="button" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-1.5 rounded-sm transition-all ${showEmojiPicker ? 'bg-primary text-white shadow-sm' : 'hover:bg-surface-container hover:text-text-main'}`}
                >
                  <Smile size={18} />
                </button>
                
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-4 z-50">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setNewMessage(prev => prev + emojiData.emoji);
                      }}
                      emojiStyle={EmojiStyle.APPLE}
                      theme={localStorage.getItem('theme') === 'dark' ? 'dark' as any : 'light' as any}
                      width={380}
                      height={450}
                      lazyLoadEmojis={true}
                      searchPlaceHolder="Buscar emoji..."
                      previewConfig={{
                        showPreview: false
                      }}
                    />
                  </div>
                )}
                
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-sm hover:bg-surface-container hover:text-text-main transition-all"
                >
                  <Paperclip size={18} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept=".jpg,.jpeg,.png,.avi,.mp4,.pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                />
              </div>
              <button 
                type="submit"
                disabled={(!newMessage.trim() && attachedFiles.length === 0) || loading}
                className="btn-primary flex items-center gap-3 px-8 py-2.5 text-xs font-bold uppercase tracking-widest shadow-primary/10 disabled:opacity-50"
              >
                {loading ? 'Subiendo...' : 'Enviar'}
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Message({ user, time, text, avatar, isSelf, attachments }: any) {
  return (
    <div className={`flex gap-4 ${isSelf ? 'flex-row-reverse' : ''}`}>
      <img src={avatar} className={`w-9 h-9 rounded-sm shrink-0 shadow-lg border border-outline ${isSelf ? 'ring-2 ring-primary/10' : ''}`} />
      <div className={`max-w-xl flex flex-col ${isSelf ? 'items-end' : ''}`}>
        <div className={`flex items-baseline gap-3 mb-1 ${isSelf ? 'flex-row-reverse' : ''}`}>
          <span className="text-[11px] font-bold text-text-main uppercase tracking-tight">{isSelf ? 'Tú' : user}</span>
          <span className="text-[9px] font-bold text-text-muted tracking-tighter uppercase opacity-60">{time}</span>
        </div>
        <div className={`p-4 rounded-sm shadow-xl text-sm leading-relaxed border transition-all ${
          isSelf 
            ? 'bg-primary text-white rounded-tr-none border-primary/20' 
            : 'bg-surface border-outline rounded-tl-none hover:border-text-muted/20'
        }`}>
          {text}
          {attachments && attachments.length > 0 && (
            <div className={`mt-3 flex flex-col gap-2 ${isSelf ? 'items-end' : 'items-start'}`}>
              {attachments.map((file: any, i: number) => (
                <div key={i} className="max-w-xs">
                  {file.type.startsWith('image/') ? (
                    <img src={file.url} className="rounded-sm max-h-60 w-auto shadow-md border border-white/10" alt={file.name} />
                  ) : file.type.startsWith('video/') ? (
                    <video src={file.url} controls className="rounded-sm max-h-60 w-auto shadow-md border border-white/10" />
                  ) : (
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-3 rounded-sm border ${
                        isSelf 
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/10 shadow-lg shadow-black/10' 
                          : 'bg-surface-container-low border-outline hover:border-text-muted/20'
                      } transition-all`}
                    >
                      <Paperclip size={14} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold truncate">{file.name}</p>
                        {file.size && <p className="text-[8px] opacity-60 uppercase">{(file.size / 1024).toFixed(1)} KB</p>}
                      </div>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
