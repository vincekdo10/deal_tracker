'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  LogOut,
  User,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';

interface SidebarProps {
  user: {
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  onLogout: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SOLUTIONS_ARCHITECT', 'SALES_DIRECTOR'] },
  { name: 'Deals', href: '/deals', icon: Briefcase, roles: ['ADMIN', 'SOLUTIONS_ARCHITECT', 'SALES_DIRECTOR'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN', 'SOLUTIONS_ARCHITECT', 'SALES_DIRECTOR'] },
];

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['ADMIN'] },
  { name: 'Users', href: '/admin/users', icon: Users, roles: ['ADMIN'] },
  { name: 'Teams', href: '/admin/teams', icon: User, roles: ['ADMIN'] },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, roles: ['ADMIN'] },
];

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 bg-white rounded-lg p-2 shadow-sm">
            <Image
              src="/dbt-labs-logo.svg"
              alt="dbt Labs"
              width={120}
              height={28}
              className="h-6 w-auto"
              priority
            />
          </div>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-dbt transition-all duration-200',
                isActive
                  ? 'bg-slate-100 text-slate-700'
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-slate-700' : 'text-text-tertiary group-hover:text-white'
                )}
              />
              {item.name}
            </Link>
          );
        })}

        {/* Admin Section */}
        {user.role === 'ADMIN' && (
          <>
            <div className="border-t border-slate-700 my-4"></div>
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Administration
              </h3>
            </div>
            {adminNavigation.map((item) => {
              // Special handling for admin dashboard - only highlight when exactly /admin
              const isActive = item.href === '/admin' 
                ? pathname === item.href 
                : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-dbt transition-all duration-200',
                    isActive
                      ? 'bg-slate-100 text-slate-700'
                      : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-slate-700' : 'text-text-tertiary group-hover:text-white'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-text-tertiary capitalize">
              {user.role.toLowerCase().replace('_', ' ')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="ml-2 text-gray-400 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
