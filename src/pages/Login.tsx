import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Mail, Lock, LogIn, Chrome } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
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
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError('Credenciales inválidas. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      setError('Error al iniciar sesión con Google.');
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
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Team MariaE</h1>
          <p className="text-text-muted mt-2">Accede a tu plataforma de gestión</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider mb-8">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="input-field w-full pl-12 py-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field w-full pl-12 py-3"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-outline bg-surface-container-low text-primary focus:ring-primary" id="remember" />
              <label htmlFor="remember" className="text-xs font-bold text-text-muted uppercase tracking-tighter">Remember me</label>
            </div>
            <Link to="/forgot" className="text-xs text-primary font-bold hover:text-primary-hover transition-colors uppercase tracking-tighter">
              Forgot?
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest font-bold"
          >
            {loading ? 'Processing...' : (
              <>
                <LogIn size={18} />
                Sign In
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
              <span className="bg-surface px-4 text-text-muted">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-outline rounded-xl hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest text-text-main disabled:opacity-50"
          >
            <Chrome size={18} className="text-primary" />
            Google Workspace
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs text-text-muted">
            ¿Nuevo en Team MariaE?{' '}
            <Link to="/register" className="text-primary font-bold hover:text-primary-hover transition-colors">
              Crea una cuenta
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
