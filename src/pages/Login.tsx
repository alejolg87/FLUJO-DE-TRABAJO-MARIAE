import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { user, login, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      await login(name.trim());
      navigate('/');
    } catch (err: any) {
      console.error('Error logging in:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-surface p-10 rounded-2xl shadow-2xl border border-outline shadow-primary/5"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white font-black text-3xl mb-6 shadow-xl shadow-primary/20">
            M
          </div>
          <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase">Team MariaE</h1>
          <p className="text-text-muted mt-2 font-medium">Bienvenido al sistema de gestión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">
              ¿Cuál es tu nombre?
            </label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/30" size={20} />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingresa tu nombre"
                className="w-full bg-surface-container-low border border-outline/50 rounded-xl pl-14 pr-6 py-4 text-lg font-medium focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-text-main placeholder:text-text-muted/30"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !name.trim()}
            className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-[0.2em] font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={20} />
                Entrar al Dashboard
              </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest leading-relaxed">
            Gestión de flujo de trabajo colaborativo <br />
            &copy; 2026 Team MariaE
          </p>
        </div>
      </motion.div>
    </div>
  );
}
