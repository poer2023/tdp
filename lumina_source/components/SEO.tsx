import React, { useEffect } from 'react';
import { useSettings } from '../store';

interface SEOProps {
  title: string;
  description?: string;
}

const SEO: React.FC<SEOProps> = ({ title, description }) => {
  const { t } = useSettings();
  
  useEffect(() => {
    // Translate the title part if needed, or keep as is
    const translatedTitle = t(title);
    document.title = `${translatedTitle} | Lumina Space`;
    
    // Update meta description if provided
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    }
  }, [title, description, t]);

  return null;
};

export default SEO;