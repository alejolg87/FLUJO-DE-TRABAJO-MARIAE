import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Mail, Lock, User, CheckCircle, Chrome } from 'lucide-react';
import { motion } from 'motion/react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      setError('Error al crear cuenta con Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface p-10 rounded-2xl shadow-2xl border border-outline shadow-primary/5"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-bold text-2xl mb-6 shadow-lg shadow-primary/20">
            M
          </div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Crear Cuenta</h1>
          <p className="text-text-muted mt-2">Únete a Team MariaE y organiza tu equipo</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider mb-8">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" size={18} />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre Completo"
                className="input-field w-full pl-12 py-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="input-field w-full pl-12 py-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" size={18} />
              <input 
                type="password" 
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mín. 6 caracteres"
                className="input-field w-full pl-12 py-3"
              />
            </div>
          </div>

          <div className="text-[11px] text-text-muted leading-relaxed py-2 font-medium">
            Al registrarte, aceptas nuestros <Link to="/terms" className="text-primary font-bold hover:underline">Términos de Servicio</Link> y <Link to="/privacy" className="text-primary font-bold hover:underline">Política de Privacidad</Link>.
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3.5 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest font-bold"
          >
            {loading ? 'Procesando...' : (
              <>
                <CheckCircle size={18} />
                Comenzar
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-surface px-4 text-text-muted">O únete con</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-outline rounded-xl hover:bg-white/10 transition-all text-sm font-bold uppercase tracking-widest text-text-main disabled:opacity-50"
          >
            <Chrome size={18} className="text-primary" />
            Cuenta de Google
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs text-text-muted">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-primary font-bold hover:text-primary-hover transition-colors">
              Inicia Sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
