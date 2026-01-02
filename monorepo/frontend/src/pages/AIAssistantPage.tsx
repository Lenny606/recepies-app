import React from 'react';
import { Button } from '../components/ui/Button';
import { ChevronLeft, Sparkles, Construction } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIAssistantPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Button variant="secondary" onClick={() => navigate('/')} className="!p-2">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
                        <span className="text-2xl">🤖</span>
                        <span>AI Asistent</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8">
                    <Sparkles className="w-12 h-12 text-emerald-600" />
                </div>

                <h1 className="text-4xl font-bold text-slate-900 mb-4">
                    AI Asistent
                </h1>

                <div className="flex items-center gap-2 text-xl text-slate-600 font-medium mb-8 bg-amber-50 px-6 py-3 rounded-full border border-amber-200">
                    <Construction className="w-6 h-6 text-amber-500" />
                    <span>Ve výstavbě</span>
                </div>

                <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">
                    Náš tým kulinářských inženýrů právě pracuje na tomto chytrém pomocníkovi.
                    Brzy vám pomůže vymyslet, co uvařit ze zbytků v lednici!
                </p>

                <div className="mt-12">
                    <Button onClick={() => navigate('/')} variant="outline" className="px-8">
                        Zpět do kuchyně
                    </Button>
                </div>
            </main>
        </div>
    );
};
