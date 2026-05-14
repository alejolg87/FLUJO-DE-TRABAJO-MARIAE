import { useState, useEffect } from 'react';
import { Search, UserPlus, Mail, Shield, ShieldCheck, Trash2, Edit3, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { subscribeMembers, deleteMember, updateMember, updateUserProfile, Member } from '../lib/db';
import InviteMemberModal from '../components/Team/InviteMemberModal';
import EditMemberModal from '../components/Team/EditMemberModal';

export default function Team() {
  const { workspace, profile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!workspace?.id) return;
    const unsubscribe = subscribeMembers(workspace.id, setMembers);
    return () => unsubscribe();
  }, [workspace?.id]);

  const handleDelete = async (memberId: string) => {
    if (!workspace?.id) return;
    if (confirm('¿Eliminar a este miembro del equipo?')) {
      await deleteMember(workspace.id, memberId);
    }
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const filteredMembers = members.filter(m => 
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOwnerAvailabilityChange = async (availability: 'available' | 'unavailable') => {
    if (!profile?.uid) return;
    await updateUserProfile(profile.uid, { availability });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">Gestión de Equipo</h1>
          <p className="text-text-muted">Centraliza el acceso, roles y permisos de los colabores en este espacio.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2 group"
        >
          <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
          <span>Invitar Miembro</span>
        </button>
      </header>

      <div className="bg-surface border border-outline rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o correo electrónico..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background border border-outline rounded-xl focus:border-primary outline-none text-sm transition-all text-text-main"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden !p-0 border-outline shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] border-b border-outline">
              <tr>
                <th className="px-8 py-5">Colaborador</th>
                <th className="px-8 py-5">Nivel de Acceso</th>
                <th className="px-8 py-5">Disponibilidad</th>
                <th className="px-8 py-5 text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline bg-surface">
              {/* Propietario */}
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}&background=6366f1&color=fff`} alt="Avatar" className="w-10 h-10 rounded-xl border border-outline shadow-sm" />
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-surface ${
                        (profile?.availability || 'available') === 'available' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}></div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-main">{profile?.displayName || 'Tú'}</p>
                      <p className="text-[11px] text-text-muted font-medium">{profile?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 bg-primary/10 w-fit px-3 py-1 rounded-lg border border-primary/20">
                    <ShieldCheck size={14} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Propietario</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="relative group/menu">
                    <select
                      value={profile?.availability || 'available'}
                      onChange={(e) => handleOwnerAvailabilityChange(e.target.value as any)}
                      className={`appearance-none cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 pr-8 rounded-full text-[9px] font-bold uppercase border transition-all ${
                        (profile?.availability || 'available') === 'available' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                      }`}
                    >
                      <option value="available">Disponible</option>
                      <option value="unavailable">No disponible</option>
                    </select>
                    <ChevronDown size={10} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover/menu:translate-y-[-40%] ${
                      (profile?.availability || 'available') === 'available' ? 'text-emerald-500' : 'text-rose-500'
                    }`} />
                  </div>
                </td>
                <td className="px-8 py-5 text-right"></td>
              </tr>

              {filteredMembers.length === 0 && searchTerm && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-text-muted italic text-sm">
                    No se encontraron miembros para "{searchTerm}"
                  </td>
                </tr>
              )}

              {filteredMembers.map((member, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-text-muted border border-outline shadow-sm uppercase font-black text-xs">
                        {member.name?.[0] || member.email[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">{member.name || member.email.split('@')[0]}</p>
                        <p className="text-[11px] text-text-muted font-medium">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`flex items-center gap-2 w-fit px-3 py-1 rounded-lg border ${
                      member.role === 'admin' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-container-low border-outline text-text-muted'
                    }`}>
                       {member.role === 'admin' ? <ShieldCheck size={14} /> : <Shield size={14} />}
                       <span className="text-[10px] font-bold uppercase tracking-wider">
                        {member.role === 'admin' ? 'Admin' : member.role === 'member' ? 'Miembro' : 'Invitado'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="relative group/menu">
                      <select
                        value={member.availability || 'available'}
                        onChange={(e) => member.id && workspace?.id && updateMember(workspace.id, member.id, { availability: e.target.value as any })}
                        className={`appearance-none cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 pr-8 rounded-full text-[9px] font-bold uppercase border transition-all ${
                          (member.availability || 'available') === 'available' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                        }`}
                      >
                        <option value="available">Disponible</option>
                        <option value="unavailable">No disponible</option>
                      </select>
                      <ChevronDown size={10} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover/menu:translate-y-[-40%] ${
                        (member.availability || 'available') === 'available' ? 'text-emerald-500' : 'text-rose-500'
                      }`} />
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(member)}
                        className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Editar colaborador"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => member.id && handleDelete(member.id)}
                        className="p-2 text-text-muted hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Eliminar de mi equipo"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-surface-container-low flex items-center justify-between border-t border-outline">
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em]">Total Colaboradores: {filteredMembers.length + 1}</p>
        </div>
      </div>

      <InviteMemberModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={workspace?.id || ''}
      />

      <EditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMember(null);
        }}
        workspaceId={workspace?.id || ''}
        member={selectedMember}
      />
    </div>
  );
}
