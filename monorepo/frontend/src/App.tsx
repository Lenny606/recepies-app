import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { PublicRecipesPage } from './pages/PublicRecipesPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { useState } from 'react';

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<'home' | 'public' | 'detail'>('home');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

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
