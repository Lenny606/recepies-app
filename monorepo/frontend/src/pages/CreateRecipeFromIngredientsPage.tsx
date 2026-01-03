import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { ChevronLeft, Plus, Send, Loader2, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

export const CreateRecipeFromIngredientsPage: React.FC = () => {
    const navigate = useNavigate();
    const { authenticatedFetch } = useAuth();
    const [ingredients, setIngredients] = useState<string[]>(['', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAddIngredient = () => {
        setIngredients([...ingredients, '']);
    };

    const handleIngredientChange = (index: number, value: string) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = value;
        setIngredients(newIngredients);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const filteredIngredients = ingredients.filter(i => i.trim() !== '');
        if (filteredIngredients.length === 0) return;

        setIsLoading(true);
        setResponse(null);
        setError(null);

        try {
            const apiResponse = await authenticatedFetch(`${API_BASE_URL}/api/v1/agent/generate-from-ingredients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ingredients: filteredIngredients })
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                throw new Error(errorData.detail || 'Nepodařilo se vygenerovat recept');
            }

            const data = await apiResponse.json();
            setResponse(data.response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nastala nečekaná chyba');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Button variant="secondary" onClick={() => navigate('/ai-assistant')} className="!p-2">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
                        <span className="text-2xl">🪄</span>
                        <span>Vytvořit recept z ingrediencí</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-emerald-600" />
                        Co máte v kuchyni?
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-3">
                            {ingredients.map((ingredient, index) => (
                                <div key={index} className="relative group">
                                    <input
                                        type="text"
                                        placeholder={`Ingredience ${index + 1}`}
                                        value={ingredient}
                                        onChange={(e) => handleIngredientChange(index, e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                                    />
                                    {ingredients.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddIngredient}
                                className="flex-1 border-dashed border-2 hover:bg-slate-50"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Další ingredience
                            </Button>

                            <Button
                                type="submit"
                                disabled={isLoading || ingredients.every(i => i.trim() === '')}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Vymýšlím recept...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Vygenerovat recept
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
                        {error}
                    </div>
                )}

                {/* Response Area */}
                {response && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 text-emerald-700 font-bold mb-4">
                            <Wand2 className="w-5 h-5" />
                            <span>Navržený recept</span>
                        </div>
                        <div className="prose prose-slate max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                                {response}
                            </pre>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
