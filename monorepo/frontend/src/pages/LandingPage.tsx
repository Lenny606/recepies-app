import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { LogOut, Search, Sparkles, Plus, Globe } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { API_BASE_URL } from '../config';
import { Modal } from '../components/ui/Modal';
import { RecipeForm } from '../components/RecipeForm';
// getYouTubeThumbnailUrl removed as it is not used directly anymore
import { Carousel } from '../components/Carousel';
import { HeroRecipeCard } from '../components/HeroRecipeCard';
import { RecipeGridCard } from '../components/RecipeGridCard';

interface Recipe {
    _id?: string;
    id?: string;
    title: string;
    description?: string;
    author_id?: string;
    tags: string[];
    created_at: string;
    video_url?: string;
    web_url?: string;
    image_url?: string;
}

interface LandingPageProps {
    onNavigateToPublic: () => void;
    onSelectRecipe: (id: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToPublic, onSelectRecipe }) => {
    const navigate = useNavigate();
    const { user, logout, authenticatedFetch } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
    const [randomRecipes, setRandomRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    const fetchMyRecipes = async (searchTerm = '') => {
        setLoading(true);
        try {
            const url = new URL(`${API_BASE_URL}/api/v1/recipes/me`);
            if (searchTerm) url.searchParams.append('search', searchTerm);

            const response = await authenticatedFetch(url.toString());
            if (!response.ok) throw new Error('Nepodařilo se načíst vaše recepty');

            const data = await response.json();
            setRecipes(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nastala chyba');
        } finally {
            setLoading(false);
        }
    };

    const fetchFavoriteRecipes = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/recipes/favorites`);
            if (response.ok) {
                const data = await response.json();
                setFavoriteRecipes(data);
            }
        } catch (err) {
            console.error('Failed to fetch favorite recipes:', err);
        }
    };

    const fetchRandomRecipes = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/recipes/random?limit=5`);
            if (response.ok) {
                const data = await response.json();
                setRandomRecipes(data);
            }
        } catch (err) {
            console.error('Failed to fetch random recipes:', err);
        }
    };

    const fetchCartCount = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/shopping-cart/me`);
            if (response.ok) {
                const data = await response.json();
                setCartCount(data.items.length);
            }
        } catch (err) {
            console.error('Failed to fetch shopping cart count:', err);
        }
    };

    useEffect(() => {
        fetchMyRecipes();
        fetchFavoriteRecipes();
        fetchRandomRecipes();
        fetchCartCount();
    }, [authenticatedFetch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchMyRecipes(search);
    };

    const handleCreateRecipe = async (recipeData: any) => {
        setIsSubmitting(true);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/recipes/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(recipeData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Nepodařilo se vytvořit recept');
            }

            await fetchMyRecipes();
            await fetchFavoriteRecipes();
            setIsModalOpen(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Nastala chyba při vytváření receptu');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (e: React.MouseEvent, recipe: Recipe) => {
        e.stopPropagation();
        setEditingRecipe(recipe);
        setIsModalOpen(true);
    };

    const handleUpdateRecipe = async (updateData: any) => {
        if (!editingRecipe) return;
        setIsSubmitting(true);
        try {
            const recipeId = editingRecipe.id || editingRecipe._id;
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/recipes/${recipeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Nepodařilo se aktualizovat recept');
            }

            await fetchMyRecipes();
            await fetchFavoriteRecipes();
            setEditingRecipe(null);
            setIsModalOpen(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Nastala chyba při aktualizaci receptu');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
                        <span className="text-2xl">🍲</span>
                        <span>Receptář</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600 hidden sm:block">
                            {user?.email}
                        </span>
                        <Button variant="secondary" onClick={logout} className="!p-2">
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingRecipe(null);
                }}
                title={editingRecipe ? "Upravit recept" : "Vytvořit nový recept"}
            >
                <RecipeForm
                    onSubmit={editingRecipe ? handleUpdateRecipe : handleCreateRecipe}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditingRecipe(null);
                    }}
                    isSubmitting={isSubmitting}
                    initialData={editingRecipe ?? undefined}
                />
            </Modal>

            <main className="max-w-7xl mx-auto px-4 py-8">

                {/* Random Recipes Carousel */}
                {randomRecipes.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-emerald-500" />
                            Dnešní inspirace
                        </h2>
                        <Carousel
                            items={randomRecipes}
                            renderItem={(recipe) => (
                                <HeroRecipeCard
                                    recipe={recipe}
                                    onClick={() => onSelectRecipe((recipe.id || recipe._id)!)}
                                />
                            )}
                        />
                    </div>
                )}

                {/* Helper Actions */}
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-2.5 sm:top-3 w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Hledat ve vašich receptech..."
                            className="pl-10 h-10 sm:h-auto"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button type="submit">Hledat</Button>
                    <Button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 justify-center"
                    >
                        <Plus className="w-5 h-5" />
                        Nový recept
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/ai-assistant')}
                        className="flex items-center gap-2 justify-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                    >
                        <Sparkles className="w-5 h-5" />
                        AI Asistent
                    </Button>

                </form>

                <div className="flex justify-center mb-12">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onNavigateToPublic}
                        className="flex items-center gap-2 justify-center w-full sm:w-auto px-12 py-6 text-lg shadow-sm hover:shadow-md transition-all border-slate-200"
                    >
                        <Globe className="w-6 h-6" />
                        Všechny recepty
                    </Button>
                </div>

                {/* My Recipes Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                        <p className="text-slate-500">Načítám kulinářské poklady...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-500 mb-4">{error}</p>
                        <Button onClick={() => fetchMyRecipes(search)}>Zkusit znovu</Button>
                    </div>
                ) : recipes.length === 0 ? (
                    <div className="text-center py-12 sm:py-20">
                        <div className="inline-flex items-center justify-center p-6 bg-emerald-50 rounded-full mb-6">
                            <span className="text-6xl">👨‍🍳</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">
                            {search ? 'Žádné recepty nenalezeny' : `Vítejte ve své kuchyni, ${user?.name}!`}
                        </h2>
                        <p className="text-slate-500 max-w-lg mx-auto mb-8">
                            {search
                                ? 'Zkuste změnit vyhledávání.'
                                : 'Zatím zde nejsou žádné recepty. Začněte přidáním svého prvního kulinářského díla nebo se zeptejte AI na inspiraci.'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button onClick={() => setIsModalOpen(true)}>
                                <Plus className="w-5 h-5 mr-2" />
                                Vytvořit první recept
                            </Button>
                            <Button variant="outline" onClick={onNavigateToPublic}>
                                Procházet veřejné recepty
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="mb-12">
                        <Carousel
                            items={recipes}
                            renderItem={(recipe) => (
                                <RecipeGridCard
                                    recipe={recipe}
                                    onClick={() => onSelectRecipe((recipe.id || recipe._id)!)}
                                    onEdit={handleEditClick}
                                />
                            )}
                        />
                    </div>
                )}

                {/* Quick Stats or Recent (Mock) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="flex flex-col items-center text-center">
                        <span className="text-4xl font-bold text-emerald-600 mb-2">{recipes.length}</span>
                        <span className="text-slate-500">Moje Recepty</span>
                    </Card>
                    <Card className="flex flex-col items-center text-center">
                        <span className="text-4xl font-bold text-emerald-600 mb-2">{favoriteRecipes.length}</span>
                        <span className="text-slate-500">Oblíbené</span>
                    </Card>
                    <Card
                        className="flex flex-col items-center text-center cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all"
                        onClick={() => navigate('/shopping-cart')}
                    >
                        <span className="text-4xl font-bold text-emerald-600 mb-2">{cartCount}</span>
                        <span className="text-slate-500">Nákupní seznam</span>
                    </Card>
                </div>

            </main >
        </div >
    );
};
