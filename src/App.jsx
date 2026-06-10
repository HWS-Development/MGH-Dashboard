import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { I18nProvider } from '@/i18n';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Properties from '@/pages/Properties';
import PropertyDetail from '@/pages/PropertyDetail';
import PropertyDetailsPage from '@/pages/PropertyDetailsPage';
import Contacts from '@/pages/Contacts';
import PendingUpdates from '@/pages/PendingUpdates';
import UsersManagement from '@/pages/UsersManagement';
import Settings from '@/pages/Settings';
import Members from '@/pages/Members';
import Experiences from '@/pages/Experiences';
import ExperienceForm from '@/pages/ExperienceForm';
import Destinations from '@/pages/Destinations';
import DestinationForm from '@/pages/DestinationForm';
import OwnerApp from '@/pages/owner/OwnerApp';
import Portal from '@/pages/Portal';
import DirectorWrapper from '@/pages/director/DirectorWrapper';
import Login from '@/pages/Login';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated } = useAuth();

  // Show loading spinner while checking auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  // If not authenticated, show login
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/properties/:id/details" element={<PropertyDetailsPage />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/pending-updates" element={<PendingUpdates />} />
        <Route path="/users" element={<UsersManagement />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/members" element={<Members />} />
        <Route path="/experiences" element={<Experiences />} />
        <Route path="/experiences/new" element={<ExperienceForm />} />
        <Route path="/experiences/:id" element={<ExperienceForm />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/destinations/new" element={<DestinationForm />} />
        <Route path="/destinations/:id" element={<DestinationForm />} />
      </Route>
      <Route path="/owner" element={<OwnerApp />} />
      <Route path="/portal" element={<Portal />} />
      <Route path="/director" element={<DirectorWrapper />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <I18nProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </I18nProvider>
  )
}

export default App
