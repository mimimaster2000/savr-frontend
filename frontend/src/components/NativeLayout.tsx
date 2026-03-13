import React, { useState, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import {
  Menu,
  X,
  MessageSquare,
  MessageSquarePlus,
  Newspaper,
  ShoppingCart,
  UserCircle,
  LogOut,
  ChevronUp,
  ChevronDown,
  Calendar,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import authService from '@/services/authService';
import useListStore from '@/stores/listStore';
import type { User } from '@/services/authService';
import type { SavedGroceryList } from '@/services/groceryListService';

function formatListDate(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Sample lists for native demo (matches website style)
const SAMPLE_LISTS = [
  { id: 'sample-1', name: 'Chili and Banana Bread', date: 'Jan 23', itemCount: 22 },
  { id: 'sample-2', name: 'Chicken Stir Fry', date: 'Jan 20', itemCount: 12 },
  { id: 'sample-3', name: 'Weeknight Pasta', date: 'Jan 18', itemCount: 8 },
  { id: 'sample-4', name: 'Sunday Brunch', date: 'Jan 15', itemCount: 15 },
];

const ROUTE_TITLES: Record<string, string> = {
  '/chat': 'Savr Assistant',
  '/flyers': 'Flyers',
  '/profile': 'Profile',
};

const NativeLayout: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [myListsExpanded, setMyListsExpanded] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    lists,
    isLoadingLists,
    selectedListId,
    selectList,
    fetchLists,
  } = useListStore();

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    // Skip API call in native demo mode to avoid errors causing white screen
    if (Capacitor.isNativePlatform() && localStorage.getItem('token') === 'demo-token-native') {
      return;
    }
    fetchLists();
  }, [fetchLists]);

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.email || user?.username || 'Profile';

  const handleNewChat = useCallback(() => {
    selectList(null);
    setMenuOpen(false);
    navigate('/chat');
  }, [selectList, navigate]);

  const handleSelectList = useCallback(
    (list: SavedGroceryList) => {
      selectList(list.id);
      setMenuOpen(false);
      if (location.pathname !== '/chat') navigate('/chat');
    },
    [selectList, location.pathname, navigate]
  );

  const handleLogout = useCallback(() => {
    authService.logout();
    setMenuOpen(false);
    navigate('/login');
  }, [navigate]);

  const isActive = (path: string) => location.pathname === path;
  const pageTitle = ROUTE_TITLES[location.pathname] ?? 'Savr';

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-white dark:bg-slate-900">
      {/* Header with hamburger */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {pageTitle}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Hamburger menu overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{ pointerEvents: menuOpen ? 'auto' : 'none' }}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-150"
          style={{ opacity: menuOpen ? 1 : 0 }}
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-200 ease-out pt-[env(safe-area-inset-top)]',
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="p-4 pb-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
            <img
              src="/assets/savr-logo(primary).svg"
              alt="Savr"
              className="h-7 text-green-600"
            />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl shadow-sm"
            >
              <MessageSquarePlus className="h-5 w-5" />
              New Chat
            </button>

            <Link
              to="/chat"
              onClick={() => setMenuOpen(false)}
              className={cn(
                'flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive('/chat')
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              )}
            >
              <MessageSquare className="h-5 w-5 mr-3" />
              Chat
            </Link>

            <Link
              to="/flyers"
              onClick={() => setMenuOpen(false)}
              className={cn(
                'flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive('/flyers')
                  ? 'bg-green-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
              )}
            >
              <Newspaper className="h-5 w-5 mr-3" />
              Flyers
            </Link>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setMyListsExpanded(!myListsExpanded)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  'bg-pink-50 dark:bg-pink-950/30 text-pink-800 dark:text-pink-200 border border-pink-200 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/40'
                )}
              >
                <span className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-3 text-pink-500" />
                  My Lists
                </span>
                {myListsExpanded ? (
                  <ChevronUp className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                )}
              </button>
              {myListsExpanded && (
                <div className="mt-1 pl-4 space-y-1">
                  {isLoadingLists ? (
                    <div className="py-3 flex justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
                    </div>
                  ) : (
                  (lists.length > 0 ? lists : SAMPLE_LISTS).map((list) => (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => {
                        if ('createdAt' in list && 'items' in list) {
                          handleSelectList(list as SavedGroceryList);
                        } else {
                          selectList(null);
                          setMenuOpen(false);
                          navigate('/chat');
                        }
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm',
                        selectedListId === list.id
                          ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-200 border-l-4 border-pink-500'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-pink-50 dark:hover:bg-pink-900/20'
                      )}
                    >
                      <div className="font-medium truncate">{list.name}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {'date' in list ? list.date : formatListDate((list as SavedGroceryList).createdAt)} · {('itemCount' in list ? list.itemCount : (list as SavedGroceryList).items.length)} items
                      </div>
                    </button>
                  ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-[2rem]" />

          <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2 pb-[env(safe-area-inset-bottom)]">
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className={cn(
                'flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive('/profile')
                  ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              <UserCircle className="h-5 w-5 mr-3 text-slate-500" />
              {displayName}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium"
            >
              <LogOut className="h-4 w-4 mr-2 text-red-500" />
              Logout
            </button>
            <div className="flex items-center gap-2 pt-2 text-xs text-slate-500 dark:text-slate-400">
              <Link to="/terms" onClick={() => setMenuOpen(false)}>
                Terms
              </Link>
              <span>·</span>
              <Link to="/privacy" onClick={() => setMenuOpen(false)}>
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default NativeLayout;
