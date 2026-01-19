import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  UserCircle,
  LogOut,
  ListChecks,
  Menu,
  X,
} from "lucide-react";
import authService, { User } from "@/services/authService";
import useThemeStore from "../stores/themeStore";

const Layout = () => {
  console.log("Layout component rendered");
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { getTheme } = useThemeStore();
  const theme = getTheme();

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

  const navigate = useNavigate();
  const location = useLocation();
  console.log("Current location:", location.pathname);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: "/chat", label: "Chat", icon: <MessageSquare size={20} /> },
    { path: "/lists", label: "Lists", icon: <ListChecks size={20} /> },
  ];

  const desktopNavItems = [
    { path: "/chat", label: "Chat", icon: <MessageSquare size={20} /> },
    { path: "/lists", label: "Lists", icon: <ListChecks size={20} /> },
    {
      path: "/profile",
      label: user
        ? user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.username || user.email
        : "Profile",
      icon: <UserCircle size={20} />,
    },
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
      <header className="py-4 px-4 fixed lg:relative top-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600">
        <div className="flex justify-between items-center">
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

          <div className="w-10"></div>
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
                <Link
                  to="/profile"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-md transition-all duration-300 group ${
                    isActive("/profile")
                      ? "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
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
                    className={`font-medium ${
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
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center justify-center w-12 h-12 hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900 rounded-xl">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-8">
              <ul className="space-y-3">
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

            {/* Footer */}
            <div className="p-8 border-t border-slate-200">
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
            <div className="flex-1 p-4 sm:p-6">
              <ul className="space-y-3">
                {desktopNavItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 group ${
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
            </div>

            {/* Logout Button */}
            <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 flex-shrink-0">
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
