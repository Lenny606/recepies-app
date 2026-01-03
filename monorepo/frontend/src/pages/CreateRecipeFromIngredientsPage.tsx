import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { ChevronLeft, Plus, Send, Loader2, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CreateRecipeFromIngredientsPage: React.FC = () => {
    const navigate = useNavigate();
    const [ingredients, setIngredients] = useState<string[]>(['', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null);

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

        // Simulate backend request
        setTimeout(() => {
            setIsLoading(false);
            setResponse(`Zde je váš recept na chutné jídlo z těchto ingrediencí: ${filteredIngredients.join(', ')}. 

Postup:
1. Připravte si všechny suroviny.
2. Smíchejte je v hrnci.
3. Vařte 15 minut na mírném ohni.
4. Podávejte teplé!`);
        }, 1500);
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
