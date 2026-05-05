import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Properties from '@/pages/Properties';
import PropertyDetail from '@/pages/PropertyDetail';
import Contacts from '@/pages/Contacts';
import PendingUpdates from '@/pages/PendingUpdates';
import UsersManagement from '@/pages/UsersManagement';
import Settings from '@/pages/Settings';
import Members from '@/pages/Members';
import AddRiad from '@/pages/AddRiad';
import OwnerApp from '@/pages/owner/OwnerApp';
import Portal from '@/pages/Portal';
import DirectorWrapper from '@/pages/director/DirectorWrapper';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
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
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/pending-updates" element={<PendingUpdates />} />
        <Route path="/users" element={<UsersManagement />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/members" element={<Members />} />
        <Route path="/add-riad" element={<AddRiad />} />
      </Route>
      <Route path="/owner" element={<OwnerApp />} />
      <Route path="/portal" element={<Portal />} />
      <Route path="/director" element={<DirectorWrapper />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App