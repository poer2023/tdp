
import React, { useState } from 'react';
import { useAuth, useSettings } from '../store';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Fingerprint, ArrowLeft, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let success = false;
    if (isRegister) {
        success = register(username, password);
        if (!success) setError('Username already taken');
    } else {
        success = login(username, password);
        if (!success) setError('Invalid credentials');
    }

    setIsLoading(false);
    if (success) {
        navigate(-1); // Go back to previous page
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-stone-50 dark:bg-stone-950">
      {/* Left Panel: Visual / Brand (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-stone-900 relative overflow-hidden flex-col justify-between p-16 text-white">
          {/* Abstract Background */}
          <div className="absolute inset-0 z-0">
             <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sage-900/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
             <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-900/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
          </div>

          <div className="relative z-10">
              <h1 className="font-serif text-4xl font-bold tracking-tighter mb-4">Lumina<span className="text-sage-500">.</span></h1>
              <p className="text-stone-400 max-w-sm font-light">
                  Your personal digital garden. A space to curate, share, and reflect.
              </p>
          </div>

          <div className="relative z-10">
              <blockquote className="font-serif text-2xl italic leading-relaxed text-stone-200 opacity-80 mb-6">
                  "Light is not so much something that reveals, as it is itself the revelation."
              </blockquote>
              <div className="flex items-center gap-3 text-sm font-bold tracking-widest uppercase text-stone-500">
                  <span className="w-8 h-[1px] bg-stone-600"></span>
                  James Turrell
              </div>
          </div>
      </div>

      {/* Right Panel: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 relative">
        <button 
            onClick={() => navigate('/')} 
            className="absolute top-8 left-8 flex items-center gap-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
            <ArrowLeft size={20} /> <span className="text-sm font-medium">Back to Home</span>
        </button>

        <div className="max-w-md w-full mx-auto">
            <div className="mb-10">
                <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-900 dark:text-stone-100 mb-6 shadow-sm">
                    <Fingerprint size={24} strokeWidth={1.5} />
                </div>
                <h2 className="font-serif text-4xl text-stone-900 dark:text-stone-100 mb-3">
                    {t(isRegister ? 'Join Lumina' : 'Welcome Back')}
                </h2>
                <p className="text-stone-500 dark:text-stone-400">
                    {isRegister ? 'Create an account to verify your identity.' : 'Please enter your details to sign in.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">{t('Username')}</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-sage-500 focus:ring-4 focus:ring-sage-500/10 outline-none transition-all"
                        placeholder="Enter your username"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">{t('Password')}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-sage-500 focus:ring-4 focus:ring-sage-500/10 outline-none transition-all"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm rounded-lg flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-4 rounded-xl font-bold hover:bg-stone-800 dark:hover:bg-stone-300 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                    {isLoading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                        <>
                            {t(isRegister ? 'Create Account' : 'Sign In')} 
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 pt-8 border-t border-stone-100 dark:border-stone-800 text-center">
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                    {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button 
                        onClick={() => { setIsRegister(!isRegister); setError(''); }}
                        className="font-bold text-stone-900 dark:text-stone-100 hover:text-sage-600 dark:hover:text-sage-400 transition-colors ml-1"
                    >
                        {t(isRegister ? 'Sign In' : 'Create Account')}
                    </button>
                </p>
            </div>

            {/* Demo Credentials Box */}
            <div className="mt-8 bg-stone-100 dark:bg-stone-900/50 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2 mb-2 text-stone-800 dark:text-stone-200 font-bold text-sm">
                     <ShieldCheck size={16} className="text-sage-500" /> Demo Access
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-stone-500 dark:text-stone-400">
                    <div className="bg-white dark:bg-stone-950 p-2 rounded border border-stone-200 dark:border-stone-800 cursor-pointer hover:border-sage-500 transition-colors" onClick={() => { setUsername('admin'); setPassword('lumina123'); }}>
                        <span className="block text-[10px] uppercase text-stone-400 mb-1">Username</span>
                        <span className="font-bold text-stone-700 dark:text-stone-300">admin</span>
                    </div>
                    <div className="bg-white dark:bg-stone-950 p-2 rounded border border-stone-200 dark:border-stone-800 cursor-pointer hover:border-sage-500 transition-colors" onClick={() => { setUsername('admin'); setPassword('lumina123'); }}>
                        <span className="block text-[10px] uppercase text-stone-400 mb-1">Password</span>
                        <span className="font-bold text-stone-700 dark:text-stone-300">lumina123</span>
                    </div>
                </div>
                <p className="text-[10px] text-stone-400 mt-2 text-center">Tap credentials to auto-fill</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
