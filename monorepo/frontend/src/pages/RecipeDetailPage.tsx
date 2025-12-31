import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ChevronLeft, Clock, Tag, ChefHat, Info, Video, Edit, Utensils, Trash2, Sparkles, Heart } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/ui/Modal';
import { RecipeForm } from '../components/RecipeForm';
import { getYouTubeEmbedUrl } from '../utils/videoUtils';

interface Ingredient {
    name: string;
    amount: string;
    unit?: string;
}

interface Recipe {
    _id?: string;
    id?: string;
    title: string;
    description?: string;
    steps: string[];
    ingredients: Ingredient[];
    tags: string[];
    author_id: string;
    created_at: string;
    video_url?: string;
    web_url?: string;
    visibility: string;
    is_favorite?: boolean;
}

interface RecipeDetailPageProps {
    recipeId: string;
    onBack: () => void;
}

export const RecipeDetailPage: React.FC<RecipeDetailPageProps> = ({ recipeId, onBack }) => {
    const { user, authenticatedFetch } = useAuth();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const fetchRecipe = async () => {
            setLoading(true);
            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/recipes/${recipeId}`);
                if (!response.ok) throw new Error('Nepodařilo se načíst detail receptu');
                const data = await response.json();
                setRecipe(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Nastala chyba');
            } finally {
                setLoading(false);
            }
        };

        fetchRecipe();
    }, [recipeId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                <p className="text-slate-500">Připravuji ingredience...</p>
            </div>
        );
    }

    if (error || !recipe) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="text-6xl mb-4">🌪️</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Ups! Recept zmizel</h3>
                <p className="text-slate-500 mb-6">{error || 'Recept nebyl nalezen.'}</p>
                <Button onClick={onBack}>Zpět na seznam</Button>
            </div>
        );
    }

    const handleUpdateRecipe = async (updateData: any) => {
        setIsSubmitting(true);
        try {
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
            setRecipe(updatedRecipe);
            setIsEditModalOpen(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Nastala chyba při aktualizaci receptu');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAIAnalyze = async () => {
        if (!recipe?.video_url) return;

        setIsAnalyzing(true);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/agent/analyze-video/${recipeId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: recipe.video_url })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Analýza AI se nezdařila');
            }

            const result = await response.json();
            alert(result.message || 'Recept byl úspěšně aktualizován pomocí AI.');

            // Refresh recipe data
            const refreshResponse = await authenticatedFetch(`${API_BASE_URL}/api/v1/recipes/${recipeId}`);
            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                setRecipe(data);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Nastala chyba při AI analýze');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleToggleFavorite = async () => {
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
            setRecipe(prev => prev ? { ...prev, is_favorite: updatedRecipe.is_favorite } : null);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Nastala chyba');
        }
    };

    const handleDeleteRecipe = async () => {
        if (!window.confirm('Opravdu chcete tento recept smazat? Tato akce je nevratná.')) {
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/recipes/${recipeId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                if (response.status === 204) {
                    // Success, but empty body
                    onBack();
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Nepodařilo se smazat recept');
            }

            // Success (usually 204 No Content)
            onBack();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Nastala chyba při mazání receptu');
        } finally {
            setIsSubmitting(false);
        }
    };

    const videoEmbedUrl = recipe.video_url ? getYouTubeEmbedUrl(recipe.video_url) : null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="secondary" onClick={onBack} className="!p-2 cursor-pointer">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="font-bold text-lg text-slate-800 truncate">{recipe.title}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {user && (
                            <Button
                                onClick={handleToggleFavorite}
                                variant="secondary"
                                className={`!p-2 cursor-pointer ${recipe.is_favorite ? 'bg-rose-50 border-rose-100 hover:bg-rose-100' : ''}`}
                            >
                                <Heart className={`w-5 h-5 text-rose-500 ${recipe.is_favorite ? 'fill-current' : ''}`} />
                            </Button>
                        )}
                        {user && user.id && recipe.author_id && String(recipe.author_id) === String(user.id) && (
                            <>
                                <Button
                                    onClick={handleAIAnalyze}
                                    disabled={isAnalyzing || !recipe.video_url}
                                    className={`flex items-center gap-2 cursor-pointer ${isAnalyzing ? 'animate-pulse' : ''
                                        } !bg-indigo-600 hover:!bg-indigo-700 !text-white`}
                                >
                                    <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                    <span className="hidden sm:inline">
                                        {isAnalyzing ? 'Analyzuji...' : 'AI Analyzovat'}
                                    </span>
                                </Button>
                                <Button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="flex items-center gap-2 cursor-pointer"
                                    disabled={isSubmitting || isAnalyzing}
                                >
                                    <Edit className="w-4 h-4 " />
                                    <span className="hidden sm:inline">Upravit</span>
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={handleDeleteRecipe}
                                    className="flex items-center gap-2 !text-red-600 !border-red-100 hover:!bg-red-50 cursor-pointer"
                                    disabled={isSubmitting || isAnalyzing}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Smazat</span>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Upravit recept"
            >
                <RecipeForm
                    onSubmit={handleUpdateRecipe}
                    onCancel={() => setIsEditModalOpen(false)}
                    isSubmitting={isSubmitting}
                    initialData={recipe}
                />
            </Modal>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 mb-8">
                    <div className="flex flex-wrap gap-2 mb-6">
                        {recipe.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full border border-emerald-100">
                                <Tag className="w-3 h-3" />
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">{recipe.title}</h2>
                    <p className="text-lg text-slate-600 leading-relaxed mb-8">
                        {recipe.description || 'Tento recept zatím nemá popis, ale určitě stojí za vyzkoušení!'}
                    </p>

                    <div className="flex flex-wrap gap-6 pt-6 border-t border-slate-100 text-slate-500">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-500" />
                            <span>Publikováno: {new Date(recipe.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChefHat className="w-5 h-5 text-emerald-500" />
                            <span>Autor: {recipe.author_id.substring(0, 8)}</span>
                        </div>
                        {recipe.video_url && (
                            <a
                                href={recipe.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                            >
                                <Video className="w-5 h-5" />
                                <span>Původní video</span>
                            </a>
                        )}
                        {recipe.web_url && (
                            <a
                                href={recipe.web_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                            >
                                <Sparkles className="w-5 h-5 text-emerald-500" />
                                <span>Původní recept (WEB)</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* Video Playback Section */}
                {videoEmbedUrl && (
                    <div className="mb-8">
                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 aspect-video">
                            <iframe
                                className="w-full h-full"
                                src={videoEmbedUrl}
                                title={`${recipe.title} video playback`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Ingredients */}
                    <aside className="md:col-span-1">
                        <Card className="sticky top-24 border-slate-200">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-emerald-600" />
                                Ingredience
                            </h3>
                            <ul className="space-y-4">
                                {recipe.ingredients.map((ing, idx) => (
                                    <li key={idx} className="flex justify-between items-start gap-4 pb-3 border-b border-slate-50 last:border-0">
                                        <span className="text-slate-700 font-medium">{ing.name}</span>
                                        <span className="text-emerald-600 font-bold whitespace-nowrap">
                                            {ing.amount} {ing.unit}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            {recipe.ingredients.length === 0 && (
                                <p className="text-slate-400 italic">Seznam ingrediencí je prázdný.</p>
                            )}
                        </Card>
                    </aside>

                    {/* Steps */}
                    <section className="md:col-span-2">
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                                <ChefHat className="w-6 h-6 text-emerald-600" />
                                Postup přípravy
                            </h3>
                            <div className="space-y-10">
                                {recipe.steps.map((step, idx) => (
                                    <div key={idx} className="flex gap-6">
                                        <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-emerald-100">
                                            {idx + 1}
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-slate-700 leading-relaxed text-lg">
                                                {step}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {recipe.steps.length === 0 && (
                                    <div className="text-center py-10 text-slate-400">
                                        <Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p>Autor k tomuto receptu zatím nepřidal postup.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};
