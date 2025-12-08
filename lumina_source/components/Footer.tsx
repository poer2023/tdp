

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Twitter, Github, Linkedin, Mail } from 'lucide-react';
import { useSettings, useAuth } from '../store';

const Footer: React.FC = () => {
  const { t } = useSettings();
  const { friendCode } = useAuth();
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);

  // Reset click count after 2 seconds of inactivity
  useEffect(() => {
    if (clickCount === 0) return;
    const timer = setTimeout(() => setClickCount(0), 2000);
    return () => clearTimeout(timer);
  }, [clickCount]);

  const handleSecretClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      setClickCount(0);
      // If already a friend, go straight to room. Otherwise go to connect.
      if (friendCode) {
        navigate(`/friends/${friendCode}`);
      } else {
        navigate('/connect');
      }
    }
  };

  return (
    <footer id="contact" className="w-full py-20 mt-20 bg-stone-900 text-stone-300 scroll-mt-32">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center text-center">
        <h2 className="font-serif text-3xl md:text-4xl text-white mb-6">Let's build something meaningful</h2>
        <p className="text-stone-400 max-w-lg mb-10 text-lg font-light">
          Whether it's a product vision, a photo essay, or just a chat about the future of tech.
        </p>

        <div className="flex gap-4 mb-16">
          <SocialLink href="#" icon={<Twitter size={20} />} />
          <SocialLink href="#" icon={<Github size={20} />} />
          <SocialLink href="#" icon={<Linkedin size={20} />} />
          <SocialLink href="mailto:hello@Zhi.space" icon={<Mail size={20} />} />
        </div>

        <div className="border-t border-stone-800 w-full pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-stone-500">
          <p>
            © {new Date().getFullYear()} <span onClick={handleSecretClick} className="hover:text-stone-300 transition-colors cursor-default select-none">Zhi Space</span>.
          </p>
          <p className="mt-2 md:mt-0">
            {t('Designed with')} React, Tailwind & Caffeine.
          </p>
        </div>
      </div>
    </footer>
  );
};

const SocialLink = ({ href, icon }: { href: string, icon: React.ReactNode }) => (
  <a
    href={href}
    className="p-3 bg-stone-800 hover:bg-stone-700 hover:text-white rounded-full transition-all hover:scale-110"
  >
    {icon}
  </a>
)

export default Footer;
