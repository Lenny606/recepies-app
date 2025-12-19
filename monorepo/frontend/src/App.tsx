import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { PublicRecipesPage } from './pages/PublicRecipesPage';
import { useState } from 'react';

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<'home' | 'public'>('home');

  if (!isAuthenticated) return <LoginPage />;

  return view === 'home'
    ? <LandingPage onNavigateToPublic={() => setView('public')} />
    : <PublicRecipesPage onBack={() => setView('home')} />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
