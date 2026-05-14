import { useState, useEffect } from 'react';
import { User, Save, Camera, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile } from '../lib/db';

export default function Settings() {
  const { profile } = useAuth();
  
  const [profileName, setProfileName] = useState(profile?.displayName || '');
  const [profileEmail, setProfileEmail] = useState(profile?.email || '');
  const [profilePhoto, setProfilePhoto] = useState(profile?.photoURL || '');
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.displayName || '');
      setProfileEmail(profile.email || '');
      setProfilePhoto(profile.photoURL || '');
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    
    setSaving(true);
    try {
      await updateUserProfile(profile.uid, {
        displayName: profileName,
        photoURL: profilePhoto
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold text-text-main tracking-tight">Configuración</h1>
        <p className="text-text-muted">Personaliza tu perfil y el espacio de trabajo para adaptarlo a tus necesidades.</p>
      </header>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-bold uppercase tracking-widest">Cambios guardados correctamente</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation Sidebar */}
        <aside className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/20 text-sm font-bold uppercase tracking-widest transition-all">
                <User size={18} />
                Perfil Personal
            </button>
        </aside>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-8">
            {/* Profile Section */}
            <section className="bg-surface border border-outline rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <User className="text-primary" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-main">Mi Perfil</h2>
                        <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Información personal pública</p>
                    </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="relative group cursor-pointer">
                            <img 
                                src={profilePhoto || `https://ui-avatars.com/api/?name=${profileName}&background=6366f1&color=fff`} 
                                alt="Avatar" 
                                className="w-24 h-24 rounded-3xl border-2 border-outline group-hover:border-primary transition-all object-cover shadow-2xl" 
                            />
                            <div className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <Camera className="text-white" size={24} />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2">URL del Avatar</label>
                            <input 
                                type="text"
                                value={profilePhoto}
                                onChange={(e) => setProfilePhoto(e.target.value)}
                                placeholder="https://ejemplo.com/foto.jpg"
                                className="w-full bg-background border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all text-text-main"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Nombre Completo</label>
                            <input 
                                type="text"
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                className="w-full bg-background border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all text-text-main"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                <input 
                                    type="email"
                                    value={profileEmail}
                                    disabled
                                    className="w-full bg-background/50 border border-outline rounded-xl pl-12 pr-4 py-3 text-sm text-text-muted cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="btn-primary flex items-center gap-3 px-8 py-3 text-xs font-bold uppercase tracking-widest shadow-indigo-500/20 disabled:opacity-50"
                        >
                            <Save size={16} />
                            {saving ? 'Guardando...' : 'Guardar Perfil'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
      </div>
    </div>
  );
}
