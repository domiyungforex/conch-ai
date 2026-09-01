'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, BookOpen, MessageCircle, GraduationCap, Heart, Search, Bookmark, Menu, Compass, PenTool, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSession, signOut } from '@/lib/auth/client';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/bible', label: 'Bible', icon: BookOpen },
  { href: '/ask', label: 'Ask', icon: MessageCircle },
  { href: '/study', label: 'Study', icon: GraduationCap },
  { href: '/teach', label: 'Teach', icon: PenTool },
  { href: '/life', label: 'Life', icon: Heart },
  { href: '/pray', label: 'Pray', icon: Compass },
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/saved', label: 'Saved', icon: Bookmark },
];

const mobileNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/bible', label: 'Bible', icon: BookOpen },
  { href: '/ask', label: 'Ask', icon: MessageCircle },
  { href: '/study', label: 'Study', icon: GraduationCap },
  { href: '/saved', label: 'Saved', icon: Bookmark },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1 bg-white/80 backdrop-blur-sm border-b border-stone-100 px-6 py-2 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 mr-6">
          <span className="text-lg font-semibold tracking-tight text-stone-900">THE WAY</span>
        </Link>
        <div className="flex items-center gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100')}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="ml-auto relative">
          {session?.user ? (
            <>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-stone-100 transition-colors">
                <div className="h-8 w-8 rounded-full bg-stone-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-stone-600">
                    {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                  </span>
                </div>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-50">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="text-sm font-medium text-stone-900">{session.user.name || 'User'}</p>
                      <p className="text-xs text-stone-500">{session.user.email}</p>
                    </div>
                    <Link href="/saved" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50">
                      <Bookmark className="h-4 w-4" /> Saved
                    </Link>
                    <Link href="/settings" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <button onClick={handleSignOut}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <Link href="/sign-in">
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-1.5" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={cn('flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs transition-colors min-w-[48px]',
                  isActive ? 'text-stone-900 font-medium' : 'text-stone-500')}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs text-stone-500 min-w-[48px]">
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setMobileOpen(false)} />
            <div className="absolute bottom-full left-0 right-0 bg-white border-t border-stone-200 p-4 z-50 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {navItems.filter((item) => !mobileNavItems.find((m) => m.href === item.href)).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                      className={cn('flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        isActive ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200')}>
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <Link href="/settings" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-stone-100 text-stone-700 hover:bg-stone-200">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                {session?.user ? (
                  <button onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 col-span-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out ({session.user.name || session.user.email})
                  </button>
                ) : (
                  <Link href="/sign-in" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-stone-900 text-white col-span-2 justify-center">
                    <User className="h-4 w-4" />
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
