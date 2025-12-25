import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { PublicRecipesPage } from './pages/PublicRecipesPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { useState } from 'react';

const AppContent = () => {
  const { isAuthenticated, isInitialLoading } = useAuth();
  const [view, setView] = useState<'home' | 'public' | 'detail'>('home');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Běží kuchtění v pozadí...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  const handleSelectRecipe = (id: string) => {
    setSelectedRecipeId(id);
    setView('detail');
  };

  if (view === 'home') {
    return <LandingPage onNavigateToPublic={() => setView('public')} />;
  }

  if (view === 'public') {
    return <PublicRecipesPage
      onBack={() => setView('home')}
      onSelectRecipe={handleSelectRecipe}
    />;
  }

  if (view === 'detail' && selectedRecipeId) {
    return <RecipeDetailPage
      recipeId={selectedRecipeId}
      onBack={() => setView('public')}
    />;
  }

  return <LandingPage onNavigateToPublic={() => setView('public')} />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
