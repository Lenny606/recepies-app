import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { PublicRecipesPage } from './pages/PublicRecipesPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { AIConsultPage } from './pages/AIConsultPage';
import { AIPhotoPage } from './pages/AIPhotoPage';
import { ShoppingCartPage } from './pages/ShoppingCartPage';
import { CreateRecipeFromIngredientsPage } from './pages/CreateRecipeFromIngredientsPage';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';

const RecipeDetailWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <Navigate to="/recipes" />;

  return <RecipeDetailPage
    recipeId={id}
    onBack={() => navigate('/recipes')}
  />;
};

const AppContent = () => {
  const { isAuthenticated, isInitialLoading } = useAuth();
  const navigate = useNavigate();

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Běží kuchtění v pozadí...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return (
    <Routes>
      <Route path="/" element={<LandingPage
        onNavigateToPublic={() => navigate('/recipes')}
        onSelectRecipe={(id) => navigate(`/recipes/${id}`)}
      />} />
      <Route
        path="/recipes"
        element={
          <PublicRecipesPage
            onBack={() => navigate('/')}
            onSelectRecipe={(id) => navigate(`/recipes/${id}`)}
          />
        }
      />
      <Route path="/recipes/:id" element={<RecipeDetailWrapper />} />
      <Route path="/ai-assistant" element={<AIAssistantPage />} />
      <Route path="/ai-consult" element={<AIConsultPage />} />
      <Route path="/ai-ingredients" element={<CreateRecipeFromIngredientsPage />} />
      <Route path="/ai-photo" element={<AIPhotoPage />} />
      <Route path="/shopping-cart" element={<ShoppingCartPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
