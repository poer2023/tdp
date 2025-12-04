
import React, { useState, useRef, useEffect } from 'react';
import { NAV_LINKS } from '../constants';
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard, Moon, Sun, Languages, ChevronDown } from 'lucide-react';
import { useAuth, useSettings } from '../store';
import { useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to determine if a link is active based on current path
  const isActive = (path: string) => {
      if (path === '/') return location.pathname === '/';
      return location.pathname.startsWith(path);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
      logout();
      navigate('/login');
      setIsMobileMenuOpen(false);
      setIsUserMenuOpen(false);
  }

  // Click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex-shrink-0 cursor-pointer group"
            onClick={() => handleNavClick('/')}
          >
            <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tighter">
              ZHI<span className="text-sage-600 dark:text-sage-400">.</span>
            </h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.value}
                onClick={() => handleNavClick(link.path)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'text-stone-900 dark:text-stone-100 border-b-2 border-sage-500'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                {t(link.label)}
              </button>
            ))}
          </nav>

          {/* Desktop User & Settings Menu */}
          <div className="hidden md:flex items-center gap-4">
              
              {/* Settings Controls */}
              <div className="flex items-center gap-2 border-r border-stone-200 dark:border-stone-800 pr-4 mr-1">
                 <button 
                    onClick={toggleTheme}
                    className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                    title="Toggle Theme"
                 >
                     {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                 </button>
                 <button 
                    onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                    className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-all flex items-center gap-1 font-sans text-xs font-bold"
                    title="Switch Language"
                 >
                     <Languages size={18} />
                     <span>{language.toUpperCase()}</span>
                 </button>
              </div>

              {user ? (
                  <div className="relative" ref={userMenuRef}>
                      <button 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors focus:outline-none"
                      >
                          <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-sm font-bold border border-stone-100 dark:border-stone-700">
                              {user.username[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium hidden lg:block">{user.username}</span>
                          <ChevronDown size={14} className={`transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {isUserMenuOpen && (
                          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-stone-900 rounded-xl shadow-lg border border-stone-100 dark:border-stone-800 py-1 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                              <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 mb-1">
                                  <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-bold mb-1">Signed in as</p>
                                  <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">{user.username}</p>
                              </div>
                              
                              {user.role === 'admin' && (
                                  <button 
                                      onClick={() => { navigate('/dashboard'); setIsUserMenuOpen(false); }}
                                      className="w-full text-left px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2.5 transition-colors"
                                  >
                                      <LayoutDashboard size={16} className="text-stone-500" />
                                      {t('Admin')}
                                  </button>
                              )}
                              
                              <button 
                                  onClick={handleLogout}
                                  className="w-full text-left px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 flex items-center gap-2.5 transition-colors"
                              >
                                  <LogOut size={16} />
                                  {t('Logout')}
                              </button>
                          </div>
                      )}
                  </div>
              ) : (
                  <button 
                    onClick={() => navigate('/login')}
                    className="text-sm font-medium text-stone-900 dark:text-stone-100 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
                  >
                    {t('Login')}
                  </button>
              )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            {user && (
                 <div className="text-sm font-bold text-stone-800 dark:text-stone-100 bg-stone-200 dark:bg-stone-800 w-8 h-8 flex items-center justify-center rounded-full">
                     {user.username[0].toUpperCase()}
                 </div>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.value}
                onClick={() => handleNavClick(link.path)}
                className={`block w-full text-left px-3 py-3 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'bg-sage-50 dark:bg-sage-900/30 text-sage-600 dark:text-sage-400'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {t(link.label)}
              </button>
            ))}
            
            <div className="border-t border-stone-100 dark:border-stone-800 mt-2 pt-4 pb-2 flex items-center justify-between px-3">
               <span className="text-sm text-stone-500 dark:text-stone-400">{t('Theme')}</span>
               <button onClick={toggleTheme} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full">
                  {theme === 'light' ? <Moon size={18} className="text-stone-600" /> : <Sun size={18} className="text-stone-300" />}
               </button>
            </div>
            
             <div className="pt-2 pb-2 flex items-center justify-between px-3">
               <span className="text-sm text-stone-500 dark:text-stone-400">{t('Language')}</span>
               <button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className="px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded text-sm font-medium text-stone-600 dark:text-stone-300">
                  {language === 'en' ? 'English' : '中文'}
               </button>
            </div>

            <div className="border-t border-stone-100 dark:border-stone-800 mt-2 pt-2">
                {!user ? (
                    <button 
                        onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                        className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                        {t('Login / Sign up')}
                    </button>
                ) : (
                    <>
                        {user.role === 'admin' && (
                             <button onClick={() => handleNavClick('/dashboard')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800">
                                {t('Admin')}
                             </button>
                        )}
                        <button 
                            onClick={handleLogout}
                            className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        >
                            {t('Logout')}
                        </button>
                    </>
                )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
