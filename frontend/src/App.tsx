import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import ListsPage from './pages/ListsPage';
import AdminPage from './pages/AdminPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Toaster } from './components/ui/toaster';
import ShareStorePage from './pages/ShareStorePage';

function App() {
  return (
    <div style={{ 
      minHeight: '100vh'
    }}>
      {/* Presence kickoff for non-Admin routes */}
      <div style={{display:'none'}} id="presence-kickoff" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        {/* Public share route (read-only) */}
        <Route path="/share/list/:listId/store/:store" element={<ShareStorePage />} />
        
        {/* Wrap protected routes with Layout */}
        <Route element={<Layout />}>
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/lists" element={
            <ProtectedRoute>
              <ListsPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />
        </Route>
        
        <Route path="/" element={<LandingPage />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App; 