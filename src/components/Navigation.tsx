'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'teacher';
}

interface NavigationProps {
  onSearch?: (query: string) => void;
}

export default function Navigation({ onSearch }: NavigationProps) {
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    router.push('/');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', adminOnly: false },
    { name: 'Attendance', href: '/attendance', adminOnly: false },
    { name: 'Students', href: '/students', adminOnly: false },
    { name: 'Teachers', href: '/teachers', adminOnly: false },
    { name: 'Profile', href: '/profile', adminOnly: false },
    { name: 'QR Generator', href: '/generator', adminOnly: false },
    { name: 'Scanner', href: '/scanner', adminOnly: false },
    { name: 'Admin', href: '/admin', adminOnly: true },
  ];

  const filteredNavItems = navigationItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  return (
    <div className="bg-red-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0">
              <h1 className="text-xl font-bold text-white">
                QR Attendance System
              </h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="hidden md:block">
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-64 bg-white/90 border-red-200 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            
            {/* User Info */}
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-white text-sm">
                  Welcome, <strong>{user.username}</strong>
                  <span className="ml-1 text-red-200">({user.role})</span>
                </span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="text-red-900 border-white hover:bg-red-100"
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-red-800 border-t border-red-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto py-3">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`whitespace-nowrap py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-red-700 text-white'
                    : 'text-red-100 hover:text-white hover:bg-red-700'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Mobile Search Bar */}
      <div className="md:hidden bg-red-800 border-t border-red-700 p-4">
        <Input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full bg-white/90 border-red-200 focus:border-red-500 focus:ring-red-500"
        />
      </div>
    </div>
  );
}