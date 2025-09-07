'use client';

import { Button } from '@/components/ui/button';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="bg-white border-b border-border-light shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Section */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <Image
                src="/dbt-labs-logo.svg"
                alt="dbt Labs"
                width={100}
                height={23}
                className="h-6 w-auto"
                priority
              />
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-base font-medium text-text-secondary">Deal Tracker</span>
            </div>
          </div>
          
          {/* Page Title */}
          <div className="flex-1 flex justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
              {subtitle && (
                <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-4 w-4" />
              <Input
                placeholder="Search deals, tasks..."
                className="pl-10 w-64 bg-bg-tertiary border-border-light focus:bg-white"
              />
            </div>
            
            <Button variant="ghost" size="icon" className="text-text-secondary hover:text-slate-600">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
