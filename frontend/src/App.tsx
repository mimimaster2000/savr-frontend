import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import NativeSplashPage from './pages/NativeSplashPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChatPage from './pages/ChatPage';
import NativeChatPage from './pages/NativeChatPage';
import FlyersPage from './pages/FlyersPage';
import ProfilePage from './pages/ProfilePage';
import ProfilePageMobile from './pages/ProfilePageMobile';
import AdminPage from './pages/AdminPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Toaster } from './components/ui/toaster';
import ShareStorePage from './pages/ShareStorePage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import GoogleSignupPage from './pages/GoogleSignupPage';
import GoogleLinkPage from './pages/GoogleLinkPage';
import { Capacitor } from '@capacitor/core';

function App() {
  const isNative = Capacitor.isNativePlatform();
  return (
    <div
      className={isNative ? 'min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]' : ''}
      style={!isNative ? { minHeight: '100vh' } : undefined}
    >
      {/* Presence kickoff for non-Admin routes */}
      <div style={{display:'none'}} id="presence-kickoff" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        {/* Google OAuth routes */}
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="/signup/google" element={<GoogleSignupPage />} />
        <Route path="/login/link-google" element={<GoogleLinkPage />} />
        {/* Public share route (read-only) */}
        <Route path="/share/list/:listId/store/:store" element={<ShareStorePage />} />
        
        {/* Native routes - no Layout wrapper */}
        {isNative ? (
          <>
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <NativeChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePageMobile />
                </ProtectedRoute>
              }
            />
          </>
        ) : (
          /* Web routes - with Layout wrapper */
          <Route element={<Layout />}>
            <Route path="/flyers" element={
              <ProtectedRoute>
                <FlyersPage />
              </ProtectedRoute>
            } />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
          </Route>
        )}
        
        <Route path="/" element={isNative ? <NativeSplashPage /> : <LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App; 