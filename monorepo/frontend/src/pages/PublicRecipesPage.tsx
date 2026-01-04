import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ChevronLeft, Search, User, Edit, Heart, Plus, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/ui/Modal';
import { RecipeForm } from '../components/RecipeForm';
import { getYouTubeThumbnailUrl } from '../utils/videoUtils';

interface Recipe {
    _id?: string;
    id?: string;
    title: string;
    description?: string;
    author_id: string;
    tags: string[];
    created_at: string;
    video_url?: string;
    web_url?: string;
    is_favorite?: boolean;
    steps?: string[];
    ingredients?: { name: string; amount: string; unit?: string }[];
    visibility?: string;
}

interface RecipeFormData {
    title: string;
    description: string;
    video_url: string;
    web_url: string;
    steps: string[];
    ingredients: { name: string; amount: string; unit?: string }[];
    tags: string[];
    visibility: string;
    should_scrape?: boolean;
}

interface PublicRecipesPageProps {
    onBack: () => void;
    onSelectRecipe: (id: string) => void;
}

export const PublicRecipesPage: React.FC<PublicRecipesPageProps> = ({ onBack, onSelectRecipe }) => {
    const navigate = useNavigate();
    const { user, authenticatedFetch } = useAuth();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchRecipes = async (searchTerm = '') => {
        setLoading(true);
        try {
            const url = new URL(`${API_BASE_URL}/api/v1/recipes/`);
            if (searchTerm) url.searchParams.append('search', searchTerm);

            const response = await authenticatedFetch(url.toString());
            if (!response.ok) throw new Error('Nepodařilo se načíst recepty');

            const data = await response.json();
            setRecipes(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nastala chyba');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchRecipes(search);
    };

    const handleCreateRecipe = async (recipeData: RecipeFormData) => {
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

            await fetchRecipes();
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

    const handleUpdateRecipe = async (updateData: RecipeFormData) => {
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

            const updatedRecipe = await response.json();
            setRecipes(recipes.map(r => {
                const rId = r.id || r._id;
                const updatedId = updatedRecipe.id || updatedRecipe._id;
                return (rId && rId === updatedId) ? updatedRecipe : r;
            }));
            setEditingRecipe(null);
            setIsModalOpen(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Nastala chyba při aktualizaci receptu');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleFavorite = async (e: React.MouseEvent, recipeId: string) => {
        e.stopPropagation();
        if (!user) {
            alert('Pro hodnocení receptů se musíte přihlásit');
            return;
        }

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/recipes/${recipeId}/favorite`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Nepodařilo se změnit stav oblíbených');

            const updatedRecipe = await response.json();
            setRecipes(recipes.map(r => {
                const rId = r.id || r._id;
                const updatedId = updatedRecipe.id || updatedRecipe._id;
                return (rId && rId === updatedId) ? { ...r, is_favorite: updatedRecipe.is_favorite } : r;
            }));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Nastala chyba');
        }
    };



    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Button variant="secondary" onClick={onBack} className="!p-2">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
                        <span className="text-2xl">🌍</span>
                        <span>Recepty</span>
                    </div>
                </div>
            </header>



            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Hledat ve veřejných receptech..."
                            className="pl-10"
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

                {/* Results Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                        <p className="text-slate-500">Načítám kulinářské poklady...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-500 mb-4">{error}</p>
                        <Button onClick={() => fetchRecipes(search)}>Zkusit znovu</Button>
                    </div>
                ) : recipes.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🍳</div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">Žádné recepty nenalezeny</h3>
                        <p className="text-slate-500">Zkuste změnit vyhledávání nebo se vraťte později.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recipes.map((recipe) => (
                            <Card
                                key={recipe.id || recipe._id}
                                onClick={() => onSelectRecipe((recipe.id || recipe._id)!)}
                                className="group hover:shadow-lg transition-shadow cursor-pointer border-slate-200"
                            >
                                <div className="p-1">
                                    <div className="h-40 bg-slate-100 rounded-lg mb-4 flex items-center justify-center text-4xl group-hover:bg-emerald-50 transition-colors overflow-hidden relative">
                                        {recipe.video_url && getYouTubeThumbnailUrl(recipe.video_url) ? (
                                            <img
                                                src={getYouTubeThumbnailUrl(recipe.video_url)!}
                                                alt={recipe.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <span>🥘</span>
                                        )}
                                        {user && (
                                            <button
                                                onClick={(e) => handleToggleFavorite(e, (recipe.id || recipe._id)!)}
                                                className={`absolute top-2 right-2 p-2 rounded-full shadow-sm transition-all z-20 ${recipe.is_favorite
                                                    ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                                                    : 'bg-white/80 text-slate-400 hover:bg-white hover:text-rose-400'
                                                    }`}
                                            >
                                                <Heart className={`w-5 h-5 ${recipe.is_favorite ? 'fill-current' : ''}`} />
                                            </button>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                                        {recipe.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                                        {recipe.description || 'Bez popisu.'}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {recipe.tags.map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs">
                                        <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            <span>Autor: {recipe.author_id.substring(0, 8)}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {user && user.id && recipe.author_id && String(recipe.author_id) === String(user.id) && (
                                                <button
                                                    onClick={(e) => handleEditClick(e, recipe)}
                                                    className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                    <span>Upravit</span>
                                                </button>
                                            )}
                                            <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

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
            </main>
        </div>
    );
};
