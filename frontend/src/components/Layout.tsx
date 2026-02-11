import { useEffect, useState, useCallback, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  MessageSquarePlus,
  MapPin,
  Newspaper,
  UserCircle,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Calendar,
  MoreVertical,
  Trash2,
  Loader2,
  Pencil,
} from "lucide-react";
import authService, { User } from "@/services/authService";
import useThemeStore from "../stores/themeStore";
import useListStore from "@/stores/listStore";
import useChatStore, { setUserScopedSessionId } from "@/stores/chatStore";
import { SavedGroceryList, deleteGroceryList } from "@/services/groceryListService";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PreferencesDropdown } from "@/components/PreferencesDropdown";

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// List item component
const ListItem = ({
  list,
  isSelected,
  onSelect,
  onDelete,
  onRename,
}: {
  list: SavedGroceryList;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(list.name);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleSaveRename = () => {
    const trimmed = renameValue.trim();
    setIsRenaming(false);
    if (trimmed && trimmed !== list.name) {
      onRename(trimmed);
    } else {
      setRenameValue(list.name);
    }
  };

  const handleBlur = () => {
    // Delay to avoid race with Radix dropdown focus restoration
    setTimeout(() => {
      // Only save if still in renaming mode (not cancelled via Escape)
      if (renameInputRef.current && !renameInputRef.current.matches(':focus')) {
        handleSaveRename();
      }
    }, 150);
  };

  return (
    <div
      onClick={(e) => {
        // Don't trigger select when renaming
        if (isRenaming) { e.stopPropagation(); return; }
        onSelect();
      }}
      className={cn(
        "group relative p-3 rounded-lg cursor-pointer transition-all duration-200",
        isSelected
          ? "bg-gradient-to-r from-green-500/15 to-green-600/10 border border-green-500/30"
          : "hover:bg-slate-100 dark:hover:bg-slate-700/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleSaveRename(); }
                if (e.key === 'Escape') { e.preventDefault(); setRenameValue(list.name); setIsRenaming(false); }
              }}
              onBlur={handleBlur}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-sm font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-green-500"
              autoComplete="off"
            />
          ) : (
            <h4 className={cn(
              "text-sm font-medium truncate",
              isSelected ? "text-green-700 dark:text-green-400" : "text-slate-800 dark:text-slate-200"
            )}>
              {list.name}
            </h4>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(list.createdAt)}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {list.items.length} item{list.items.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-opacity"
            >
              <MoreVertical className="h-4 w-4 text-slate-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                // Select the list first to avoid a re-render resetting isRenaming
                onSelect();
                setRenameValue(list.name);
                setTimeout(() => setIsRenaming(true), 200);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

const Layout = () => {
  console.log("Layout component rendered");
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { getTheme } = useThemeStore();
  const theme = getTheme();
  const { toast } = useToast();

  // List store
  const {
    lists,
    isLoadingLists,
    selectedListId,
    selectList,
    fetchLists,
    renameList,
  } = useListStore();

  // Fetch lists on mount
  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // Handle list deletion
  const handleDeleteList = useCallback(async (list: SavedGroceryList) => {
    try {
      await deleteGroceryList(list.id);
      fetchLists();
      toast({
        title: 'List Deleted',
        description: `"${list.name}" has been deleted.`,
      });
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the list.',
        variant: 'destructive',
      });
    }
  }, [fetchLists, toast]);

  // Handle list rename
  const handleRenameList = useCallback(async (list: SavedGroceryList, newName: string) => {
    try {
      await renameList(list.id, newName);
      toast({ description: 'List renamed', duration: 2000 });
    } catch {
      toast({ variant: 'destructive', description: 'Failed to rename list', duration: 3000 });
    }
  }, [renameList, toast]);

  const navigate = useNavigate();
  const location = useLocation();

  // Handle list selection
  const handleSelectList = useCallback((list: SavedGroceryList) => {
    selectList(list.id);
    setSidebarOpen(false);
    if (location.pathname !== '/chat') {
      navigate('/chat');
    }
  }, [selectList, location.pathname, navigate]);

  useEffect(() => {
    console.log("Layout component mounted");

    // Check if user is authenticated
    const token = localStorage.getItem("token");
    console.log("Auth token exists:", !!token);

    // Check if user data exists
    const userJson = localStorage.getItem("user");
    console.log("User data exists:", !!userJson);

    // Try to refresh the profile data
    const refreshUserData = async () => {
      try {
        if (token) {
          const success = await authService.refreshProfile();
          if (success) {
            const refreshedUserJson = localStorage.getItem("user");
            if (refreshedUserJson) {
              setUser(JSON.parse(refreshedUserJson));
            }
          }
        }
      } catch (error: any) {
        console.error("Error refreshing user data:", error);
      }
    };

    // If we have a token but no user data, try to refresh
    if (token && !userJson) {
      refreshUserData();
    } else if (userJson) {
      // Otherwise use the existing user data
      setUser(JSON.parse(userJson));
    }

    return () => {
      console.log("Layout component unmounted");
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

  console.log("Current location:", location.pathname);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: "/flyers", label: "Flyers", icon: <Newspaper size={20} /> },
    { path: "/chat", label: "Chat", icon: <MessageSquare size={20} /> },
  ];

  const desktopNavItems = [
    { path: "/flyers", label: "Flyers", icon: <Newspaper size={20} /> },
    { path: "/chat", label: "Chat", icon: <MessageSquare size={20} /> },
  ];

  const handleLogout = () => {
    console.log("Logging out...");
    authService.logout();
    navigate("/login");
    setSidebarOpen(false);
  };

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900">
      {/* Mobile Header - Fixed only on mobile */}
      <header className="py-2 px-3 fixed lg:relative top-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600">
        <div className="flex justify-between items-center">
          {/* Left side: hamburger + logo */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
              aria-label="Toggle navigation menu">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link to="/" className="flex items-center">
              <img
                src="/assets/savr-logo(primary).svg"
                alt="Savr Logo"
                className="h-6"
              />
            </Link>
          </div>

          {/* Right side: Chat action buttons - only on /chat route */}
          {location.pathname === '/chat' && (
            <div className="flex items-center space-x-1">
              <button
                onClick={async () => {
                  // Note: We intentionally do NOT call clearCurrentSessionList here.
                  // The list should keep its chat_session_id so users can return to the
                  // chat history later by selecting the list.
                  setUserScopedSessionId(null);
                  localStorage.removeItem('savr-chat-storage');
                  useChatStore.getState().clearChat();
                  useListStore.getState().selectList(null);
                  useListStore.getState().setDrawerState('collapsed');
                  window.location.reload();
                }}
                className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
                title="New Chat"
              >
                <MessageSquarePlus size={20} />
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-store-selector'))}
                className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
                title="Select Stores"
              >
                <MapPin size={20} />
              </button>
              <PreferencesDropdown variant="mobile" />
            </div>
          )}
        </div>
      </header>

      {/* Mobile/Tablet Overlay Sidebar */}
      <div
        className="fixed inset-0 z-50 lg:hidden"
        style={{ pointerEvents: sidebarOpen ? "auto" : "none" }}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-150"
          style={{ opacity: sidebarOpen ? 1 : 0 }}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-slate-800 border-r border-slate-300 dark:border-slate-600 transform transition-transform duration-150 ease-out"
          style={{
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          }}>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-8">
              <div className="flex items-center justify-between">
                <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center">
                  <img
                    src="/assets/savr-logo(primary).svg"
                    alt="Savr Logo"
                    className="h-6"
                  />
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center justify-center w-12 h-12 hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900 rounded-xl">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-4 pt-0">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={handleNavClick}
                      className={`flex items-center px-3 py-2 rounded-md transition-all duration-300 group ${
                        isActive(item.path)
                          ? "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-700 border border-green-600"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}>
                      <span
                        className={`mr-3 transition-all duration-300 ${
                          isActive(item.path)
                            ? "text-green-600"
                            : "text-slate-500 group-hover:text-slate-700"
                        }`}>
                        {item.icon}
                      </span>
                      <span
                        className={`font-medium ${
                          isActive(item.path)
                            ? "text-green-700"
                            : "text-slate-700 group-hover:text-slate-900"
                        }`}>
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* My Lists Section - Mobile */}
            <div className="flex-1 overflow-hidden flex flex-col border-t border-slate-200 dark:border-slate-700">
              <div className="px-4 py-3 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">My Lists</h3>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {isLoadingLists ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                  </div>
                ) : lists.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">No lists yet</p>
                    <p className="text-xs mt-0.5 opacity-70">Chat to create one</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {lists.map((list) => (
                      <ListItem
                        key={list.id}
                        list={list}
                        isSelected={selectedListId === list.id}
                        onSelect={() => handleSelectList(list)}
                        onDelete={() => handleDeleteList(list)}
                        onRename={(newName) => handleRenameList(list, newName)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-200 space-y-2">
              {/* Profile Link */}
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-300 group ${
                  isActive("/profile")
                    ? "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-700"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}>
                <span
                  className={`mr-3 transition-all duration-300 ${
                    isActive("/profile")
                      ? "text-green-600"
                      : "text-slate-500 group-hover:text-slate-700"
                  }`}>
                  <UserCircle size={20} />
                </span>
                <span
                  className={`font-medium text-sm ${
                    isActive("/profile")
                      ? "text-green-700"
                      : "text-slate-700 group-hover:text-slate-900"
                  }`}>
                  {user
                    ? user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username || user.email
                    : "Profile"}
                </span>
              </Link>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-300 font-medium group">
                <LogOut
                  size={16}
                  className="mr-2 group-hover:scale-110 transition-transform duration-300"
                />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <nav className="hidden lg:block w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-600">
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="border-b border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex-shrink-0 h-16 lg:h-20">
              <Link to="/" className="flex items-center justify-center group h-full px-4 sm:px-6">
                <img
                  src="/assets/savr-logo(primary).svg"
                  alt="Savr Logo"
                  className="h-8 group-hover:scale-105 transition-transform duration-300"
                />
              </Link>
            </div>

            {/* Navigation */}
            <div className="p-4">
              <ul className="space-y-2">
                {desktopNavItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-300 group ${
                        isActive(item.path)
                          ? "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-700"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}>
                      <span
                        className={`mr-3 transition-all duration-300 ${
                          isActive(item.path)
                            ? "text-green-600"
                            : "text-slate-500 group-hover:text-slate-700"
                        }`}>
                        {item.icon}
                      </span>
                      <span
                        className={`font-medium text-sm ${
                          isActive(item.path)
                            ? "text-green-700"
                            : "text-slate-700 group-hover:text-slate-900"
                        }`}>
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* My Lists Section - Desktop */}
            <div className="flex-1 overflow-hidden flex flex-col border-t border-slate-200 dark:border-slate-700">
              <div className="px-4 py-3 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">My Lists</h3>
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-3">
                {isLoadingLists ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                  </div>
                ) : lists.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">No lists yet</p>
                    <p className="text-xs mt-0.5 opacity-70">Start a chat to create one</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {lists.map((list) => (
                      <ListItem
                        key={list.id}
                        list={list}
                        isSelected={selectedListId === list.id}
                        onSelect={() => handleSelectList(list)}
                        onDelete={() => handleDeleteList(list)}
                        onRename={(newName) => handleRenameList(list, newName)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Profile & Logout */}
            <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 flex-shrink-0 space-y-2">
              <Link
                to="/profile"
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-300 group ${
                  isActive("/profile")
                    ? "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-700"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}>
                <span
                  className={`mr-3 transition-all duration-300 ${
                    isActive("/profile")
                      ? "text-green-600"
                      : "text-slate-500 group-hover:text-slate-700"
                  }`}>
                  <UserCircle size={20} />
                </span>
                <span
                  className={`font-medium text-sm ${
                    isActive("/profile")
                      ? "text-green-700"
                      : "text-slate-700 group-hover:text-slate-900"
                  }`}>
                  {user
                    ? user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username || user.email
                    : "Profile"}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-300 font-medium group">
                <LogOut
                  size={16}
                  className="mr-2 group-hover:scale-110 transition-transform duration-300"
                />
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden pt-[56px] lg:pt-0"
          style={{
            backgroundColor: "#f9fafb",
            color: theme.colors.foreground,
          }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
