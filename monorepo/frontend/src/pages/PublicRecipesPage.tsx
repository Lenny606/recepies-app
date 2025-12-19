import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ChevronLeft, Search, User } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface Recipe {
    _id: string;
    title: string;
    description?: string;
    author_id: string;
    tags: string[];
    created_at: string;
}

interface PublicRecipesPageProps {
    onBack: () => void;
    onSelectRecipe: (id: string) => void;
}

export const PublicRecipesPage: React.FC<PublicRecipesPageProps> = ({ onBack, onSelectRecipe }) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchRecipes = async (searchTerm = '') => {
        setLoading(true);
        try {
            const url = new URL(`${API_BASE_URL}/api/v1/recipes/`);
            if (searchTerm) url.searchParams.append('search', searchTerm);

            const response = await fetch(url.toString());
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
                        <span>Veřejné recepty</span>
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
                                key={recipe._id}
                                onClick={() => onSelectRecipe(recipe._id)}
                                className="group hover:shadow-lg transition-shadow cursor-pointer border-slate-200"
                            >
                                <div className="p-1">
                                    <div className="h-40 bg-slate-100 rounded-lg mb-4 flex items-center justify-center text-4xl group-hover:bg-emerald-50 transition-colors">
                                        🥘
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
                                        <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
