import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Sparkles,
  Camera,
  Heart,
  Zap,
  Shield,
  ArrowRight,
} from "lucide-react";

const LandingPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  // Preload pages for faster navigation
  const preloadPage = (path: string) => {
    // Create a link element to preload the page
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = path;
    document.head.appendChild(link);

    // Also try to preload the actual component
    if (path === "/login") {
      import("../pages/LoginPage");
    } else if (path === "/signup") {
      import("../pages/SignupPage");
    }
  };

  // Smooth navigation with loader
  const handleNavigation = (path: string) => {
    setIsNavigating(true);

    // Show loader for a moment before navigating
    setTimeout(() => {
      navigate(path);
    }, 800); // Show loader for 800ms
  };

  useEffect(() => {
    // Enable smooth scrolling for the entire page
    document.documentElement.style.scrollBehavior = "smooth";

    // Trigger fade-in animation after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100);

    // Preload main pages for faster navigation
    const preloadMainPages = () => {
      // Preload login and signup pages
      preloadPage("/login");
      preloadPage("/signup");

      // Also preload other main pages that users might navigate to
      try {
        // Preload main app pages
        import("../pages/ChatPage");
        import("../pages/ListsPage");
        import("../pages/CartPage");
      } catch (error) {
        // Silently fail if pages don't exist yet
        console.log("Some pages not available for preloading");
      }
    };

    // Start preloading after a short delay to not block initial render
    const preloadTimer = setTimeout(preloadMainPages, 2000);

    return () => {
      document.documentElement.style.scrollBehavior = "auto";
      clearTimeout(timer);
      clearTimeout(preloadTimer);
    };
  }, []);
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900 transition-opacity duration-1000 ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}>
      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900 flex items-center justify-center">
          <div className="text-center">
            {/* Spinning circle */}
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-600 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
            </div>

            <p className="mt-6 text-lg font-medium text-slate-700 dark:text-slate-300 animate-pulse">
              Loading...
            </p>
          </div>
        </div>
      )}
      {/* Navigation */}
      <nav
        className={`sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 bg-cyan-100/80 dark:bg-cyan-900/80 backdrop-blur-xl transition-all duration-700 delay-200 ${
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center border-b border-slate-200 dark:border-slate-600 pb-3 sm:pb-4">
          <div className="flex items-center space-x-2">
            <img
              src="/assets/savr-logo(primary).svg"
              alt="Savr Logo"
              className="h-6 sm:h-8"
            />
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105 text-xs sm:text-sm shadow-sm"
              onMouseEnter={() => preloadPage("/login")}
              onClick={() => handleNavigation("/login")}>
              Sign In
            </Button>
            <Button
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
              onMouseEnter={() => preloadPage("/signup")}
              onClick={() => handleNavigation("/signup")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className={`relative px-4 sm:px-6 py-12 sm:py-20 lg:py-32 transition-all duration-1000 delay-300 ${
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div
              className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-200 dark:border-slate-600 mb-4 sm:mb-6 transition-all duration-700 delay-500 ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}>
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1.5 sm:mr-2" />
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                🛒 AI-Powered Grocery Shopping 🥕
              </span>
            </div>
            <h1
              className={`text-3xl sm:text-4xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 leading-tight px-2 transition-all duration-800 delay-600 ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0"
              }`}>
              🍎 Your AI Grocery
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
                Shopping Companion
              </span><span>🛍️</span>
            </h1>
            <p
              className={`text-base sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2 transition-all duration-800 delay-700 ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0"
              }`}>
              SAVR compares prices across Canada's top grocery stores instantly, showing you exactly where to buy each item for less. Stop overpaying and wasting hours. Start shopping smarter today.
            </p>
            <div
              className={`flex justify-center items-center px-4 sm:px-0 transition-all duration-800 delay-800 ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0"
              }`}>
              <Button
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full sm:w-auto shadow-lg"
                onMouseEnter={() => preloadPage("/signup")}
                onClick={() => handleNavigation("/signup")}>
                Start Shopping Smarter
                <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          {/* How It Works Section */}
          <div
            className={`mt-12 sm:mt-20 transition-all duration-1000 delay-900 ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}>
            <div className="text-center mb-8 sm:mb-12">
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 px-2 transition-all duration-700 delay-1000 ${
                  isLoaded
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}>
                How It Works
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
              <div
                className={`text-center px-4 transition-all duration-500 delay-1100 sm:hover:scale-105 ${
                  isLoaded
                    ? "translate-y-0 opacity-100"
                    : "translate-y-6 opacity-0"
                }`}>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <span className="text-xl sm:text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                  Build Your List
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  Chat with SAVR to create your list
                </p>
              </div>

              <div
                className={`text-center px-4 transition-all duration-500 delay-1200 sm:hover:scale-105 ${
                  isLoaded
                    ? "translate-y-0 opacity-100"
                    : "translate-y-6 opacity-0"
                }`}>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <span className="text-xl sm:text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                  Select Your Stores
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  Select up to 3 stores near you to compare prices
                </p>
              </div>

              <div
                className={`text-center px-4 transition-all duration-500 delay-1300 sm:hover:scale-105 ${
                  isLoaded
                    ? "translate-y-0 opacity-100"
                    : "translate-y-6 opacity-0"
                }`}>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <span className="text-xl sm:text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                  SAVR List
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  See real-time prices and shop with confidence
                </p>
              </div>
            </div>
          </div>

          {/* Hero Image/Preview */}
          <div
            className={`relative mt-8 sm:mt-16 transition-all duration-1000 delay-1400 ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-600 p-4 sm:p-8 max-w-4xl mx-auto transition-all duration-500 hover:shadow-xl sm:hover:scale-[1.02]">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-600">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                    Savr Assistant
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Your AI grocery shopping companion
                  </p>
                </div>
              </div>

              {/* Chat Conversation Preview */}
              <div className="space-y-3 sm:space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-green-500 text-white rounded-2xl rounded-br-md px-3 sm:px-4 py-2 sm:py-3 max-w-[85%] sm:max-w-xs lg:max-w-md text-left">
                    <p className="text-xs sm:text-sm">
                      "I need to make a grocery list for dinner tonight. Can you
                      help me add some items?"
                    </p>
                  </div>
                </div>

                {/* Assistant Response */}
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 max-w-[85%] sm:max-w-xs lg:max-w-md text-left">
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      "Of course! I'd be happy to help you create a grocery
                      list. What are you planning to cook for dinner?"
                    </p>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-green-500 text-white rounded-2xl rounded-br-md px-3 sm:px-4 py-2 sm:py-3 max-w-[85%] sm:max-w-xs lg:max-w-md text-left">
                    <p className="text-xs sm:text-sm">
                      "I want to make spaghetti with meatballs and a side salad"
                    </p>
                  </div>
                </div>

                {/* Assistant Response */}
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 max-w-[85%] sm:max-w-xs lg:max-w-md text-left">
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      "Perfect! Here's your grocery list for spaghetti with
                      meatballs and salad:"
                    </p>
                  </div>
                </div>

                {/* Grocery List */}
                <div className="w-full flex flex-col items-center">
                  <div
                    className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 shadow-sm px-0 py-0 relative overflow-hidden w-full max-w-md"
                    style={{
                      fontFamily: "JetBrains Mono, Menlo, monospace",
                    }}>
                    {/* Receipt Content */}
                    <div className="relative z-10 px-4 sm:px-6 py-3 sm:py-4">
                      <div className="text-center text-xs text-slate-400 tracking-widest mb-2 select-none">
                        🛒 SAVR GROCERY LIST 🛒
                      </div>
                      <div className="text-center text-base font-bold text-slate-800 dark:text-white mb-1">
                        Spaghetti Dinner
                      </div>
                      <div className="text-center text-xs text-slate-500 dark:text-slate-400 mb-4">
                        6 items
                      </div>

                      {/* Category/Meal Tabs */}
                      <div className="mb-4">
                        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                          <button className="flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm">
                            Category
                          </button>
                          <button className="flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                            Meal
                          </button>
                        </div>
                      </div>

                      {/* Grouped Items */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-dashed border-slate-200 dark:border-slate-700 pb-1 text-center">
                            Meat
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between py-1 text-sm text-slate-800 dark:text-slate-100">
                              <span className="truncate max-w-[60%]">
                                Ground beef
                              </span>
                              <span className="text-slate-500 dark:text-slate-300">
                                1 lb
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-dashed border-slate-200 dark:border-slate-700 pb-1 text-center">
                            Pantry
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between py-1 text-sm text-slate-800 dark:text-slate-100">
                              <span className="truncate max-w-[60%]">
                                Spaghetti noodles
                              </span>
                              <span className="text-slate-500 dark:text-slate-300">
                                1 package
                              </span>
                            </div>
                            <div className="flex justify-between py-1 text-sm text-slate-800 dark:text-slate-100">
                              <span className="truncate max-w-[60%]">
                                Marinara sauce
                              </span>
                              <span className="text-slate-500 dark:text-slate-300">
                                1 jar
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-dashed border-slate-200 dark:border-slate-700 pb-1 text-center">
                            Produce
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between py-1 text-sm text-slate-800 dark:text-slate-100">
                              <span className="truncate max-w-[60%]">
                                Mixed greens
                              </span>
                              <span className="text-slate-500 dark:text-slate-300">
                                1 bag
                              </span>
                            </div>
                            <div className="flex justify-between py-1 text-sm text-slate-800 dark:text-slate-100">
                              <span className="truncate max-w-[60%]">
                                Cherry tomatoes
                              </span>
                              <span className="text-slate-500 dark:text-slate-300">
                                1 pint
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-dashed border-slate-200 dark:border-slate-700 pb-1 text-center">
                            Dairy
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between py-1 text-sm text-slate-800 dark:text-slate-100">
                              <span className="truncate max-w-[60%]">
                                Parmesan cheese
                              </span>
                              <span className="text-slate-500 dark:text-slate-300">
                                1 block
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Total row */}
                      <div className="mt-4 pt-2 border-t border-dashed border-slate-300 dark:border-slate-600 flex justify-between text-base font-bold text-slate-900 dark:text-white">
                        <span>TOTAL</span>
                        <span>6 items</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="w-full max-w-md pt-4">
                    <div
                      className="w-full h-10 sm:h-11 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-all duration-200 text-sm sm:text-base font-sans flex items-center justify-center animate-pulse cursor-pointer"
                      style={{ animationDuration: "1.5s" }}>
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                      Compare Store Prices & Save
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className={`px-4 sm:px-6 py-12 sm:py-20 transition-all duration-1000 delay-1000 ${
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2
              className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 px-2 transition-all duration-700 delay-1100 ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}>
              Why Choose Savr?
            </h2>
            <p
              className={`text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-2 transition-all duration-700 delay-1200 ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}>
              Transform your grocery shopping experience with AI-powered
              intelligence
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Feature 1 */}
            <div
              className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-600 p-4 sm:p-6 transition-all duration-500 delay-1300 sm:hover:scale-105 hover:shadow-lg ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0"
              }`}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                AI Chat Assistant
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Chat naturally with SAVR to build your list or get recipe ideas. Build your list hands-free while cooking or on the go.
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-600 p-4 sm:p-6 transition-all duration-500 delay-1400 sm:hover:scale-105 hover:shadow-lg ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0"
              }`}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                Photo Analysis
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Upload an image of any dish or recipe you want to make. SAVR analyzes it and creates your complete shopping list.
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-600 p-4 sm:p-6 transition-all duration-500 delay-1500 sm:hover:scale-105 hover:shadow-lg ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0"
              }`}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                Multi-Store Comparison
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Compare your list among up to 3 stores of your choice near you!
              </p>
            </div>

            {/* Feature 4 */}
            <div
              className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-600 p-4 sm:p-6 transition-all duration-500 delay-1600 sm:hover:scale-105 hover:shadow-lg ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0"
              }`}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                Switch & Save
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                SAVR provides multiple options per item so you're always in control of what goes in your cart.
              </p>
            </div>

            {/* Feature 5 */}
            <div
              className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-600 p-4 sm:p-6 transition-all duration-500 delay-1700 sm:hover:scale-105 hover:shadow-lg ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0"
              }`}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                Personalized Preferences
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Set your dietary needs and preferences once. Whether you're vegan, have allergies, or follow a specific diet, your shopping lists will only include foods that work for you.
              </p>
            </div>

            {/* Feature 6 */}
            <div
              className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-600 p-4 sm:p-6 transition-all duration-500 delay-1800 sm:hover:scale-105 hover:shadow-lg ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0"
              }`}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                Store Ready Lists
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Your list, your way. Print it, share it with family and friends, or export it to use however you shop best.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-600 p-6 sm:p-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 px-2">
              Ready to Transform Your Grocery Shopping?
            </h2>
            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 px-2">
              Join fellow Canadians who are already saving time and money with SAVR.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-green-500 hover:bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full">
                  Start Free Today
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 w-full shadow-sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 sm:py-12 border-t border-slate-200 dark:border-slate-600">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <img
                src="/assets/savr-logo(primary).svg"
                alt="Savr Logo"
                className="h-5 sm:h-6"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <Link
                to="/privacy"
                className="hover:text-slate-900 dark:hover:text-white">
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-slate-900 dark:hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200 dark:border-slate-600 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <p>
              &copy; 2025. All rights reserved. Made with ❤️ for smarter grocery
              shopping.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

