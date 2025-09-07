'use client';

import { useState, useEffect } from 'react';
import { ClearbitService } from '@/lib/clearbit-api';
import { Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface LogoPreviewProps {
  domain: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showFallback?: boolean;
}

export function LogoPreview({ 
  domain, 
  className = '', 
  size = 'md',
  showFallback = true 
}: LogoPreviewProps) {
  const [logoData, setLogoData] = useState<{
    logo: string;
    name: string;
    domain: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  useEffect(() => {
    if (!domain) {
      setLogoData(null);
      setError(null);
      return;
    }

    // Extract clean domain from input
    const cleanDomain = ClearbitService.extractDomain(domain);
    if (!cleanDomain) {
      setError('Invalid domain');
      return;
    }

    const fetchLogo = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check cache first
        const cached = ClearbitService.getCachedLogo(cleanDomain);
        if (cached) {
          setLogoData(cached);
          setLoading(false);
          return;
        }

        // Fetch from API
        const result = await ClearbitService.getLogo(cleanDomain);
        
        if (result) {
          setLogoData(result);
        } else {
          setError('Logo not found');
        }
      } catch (err) {
        setError('Failed to fetch logo');
      } finally {
        setLoading(false);
      }
    };

    fetchLogo();
  }, [domain]);

  if (!domain) {
    return null;
  }

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-gray-100 rounded-lg border`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !logoData) {
    if (!showFallback) return null;
    
    const cleanDomain = ClearbitService.extractDomain(domain);
    const initial = cleanDomain ? cleanDomain.split('.')[0].charAt(0).toUpperCase() : '?';
    
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200`}>
        <div className="text-gray-400 text-xs font-medium">
          {initial}
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-white rounded-lg border shadow-sm overflow-hidden`}>
      <img
        src={logoData.logo}
        alt={`${logoData.name} logo`}
        className="w-full h-full object-contain"
        onError={() => setError('Failed to load image')}
        onLoad={() => setError(null)}
      />
    </div>
  );
}

interface LogoInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function LogoInput({ 
  value, 
  onChange, 
  placeholder = "Enter company domain (e.g., google.com)",
  label = "Company Domain",
  className = ""
}: LogoInputProps) {
  const [domain, setDomain] = useState('');
  const [isValidDomain, setIsValidDomain] = useState(false);
  const [debouncedDomain, setDebouncedDomain] = useState('');

  useEffect(() => {
    const cleanDomain = ClearbitService.extractDomain(value);
    setDomain(cleanDomain || '');
    setIsValidDomain(!!cleanDomain);
  }, [value]);

  // Debounce domain changes for logo preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDomain(domain);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [domain]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
  };

  return (
    <div className={className}>
      <label className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {isValidDomain && debouncedDomain && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <LogoPreview 
                domain={debouncedDomain} 
                size="sm"
                className="flex-shrink-0"
              />
            </div>
          )}
        </div>
        {domain && (
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">{domain}</span>
          </p>
        )}
      </div>
    </div>
  );
}
