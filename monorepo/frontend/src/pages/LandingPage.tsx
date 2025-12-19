import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { LogOut, Plus, Search, Sparkles } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

interface LandingPageProps {
    onNavigateToPublic: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToPublic }) => {
    const { user, logout } = useAuth();

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
            <main className="max-w-7xl mx-auto px-4 py-8">

                {/* Helper Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-2.5 sm:top-3 w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Hledat recepty, ingredience..."
                            className="pl-10 h-10 sm:h-auto" // Adjust generic input padding/height via classes if needed, but generic component sets padding. Usually component needs refactor for icon slots or class override.
                        // For "vibe", let's assume default input handles standard usage, we override padding via className.
                        />
                    </div>
                    <Button className="flex items-center gap-2 justify-center">
                        <Plus className="w-5 h-5" />
                        Nový recept
                    </Button>
                    <Button variant="secondary" className="flex items-center gap-2 justify-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200">
                        <Sparkles className="w-5 h-5" />
                        AI Asistent
                    </Button>
                </div>

                {/* Hero / State Placeholder */}
                <div className="text-center py-12 sm:py-20">
                    <div className="inline-flex items-center justify-center p-6 bg-emerald-50 rounded-full mb-6">
                        <span className="text-6xl">👨‍🍳</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">
                        Vítejte ve své kuchyni, {user?.name}!
                    </h2>
                    <p className="text-slate-500 max-w-lg mx-auto mb-8">
                        Zatím zde nejsou žádné recepty. Začněte přidáním svého prvního kulinářského díla nebo se zeptejte AI na inspiraci.
                    </p>
                    <Button variant="outline" onClick={onNavigateToPublic}>
                        Procházet veřejné recepty
                    </Button>
                </div>

                {/* Quick Stats or Recent (Mock) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="flex flex-col items-center text-center">
                        <span className="text-4xl font-bold text-emerald-600 mb-2">0</span>
                        <span className="text-slate-500">Moje Recepty</span>
                    </Card>
                    <Card className="flex flex-col items-center text-center">
                        <span className="text-4xl font-bold text-emerald-600 mb-2">0</span>
                        <span className="text-slate-500">Oblíbené</span>
                    </Card>
                    <Card className="flex flex-col items-center text-center">
                        <span className="text-4xl font-bold text-emerald-600 mb-2">0</span>
                        <span className="text-slate-500">Nákupní seznam</span>
                    </Card>
                </div>

            </main>
        </div>
    );
};
