import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { ChevronLeft, ShoppingCart, Trash2, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';
import { Input } from '../components/ui/Input';

interface ShoppingItem {
    id: string;
    value: string;
}

interface ShoppingCart {
    items: ShoppingItem[];
}

export const ShoppingCartPage: React.FC = () => {
    const navigate = useNavigate();
    const { authenticatedFetch } = useAuth();
    const [cart, setCart] = useState<ShoppingCart | null>(null);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState('');
    const [adding, setAdding] = useState(false);

    const fetchCart = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/shopping-cart/me`);
            if (response.ok) {
                const data = await response.json();
                setCart(data);
            }
        } catch (err) {
            console.error('Failed to fetch shopping cart:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, [authenticatedFetch]);

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        setAdding(true);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/shopping-cart/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: Date.now().toString(), value: newItem.trim() })
            });

            if (response.ok) {
                const updatedCart = await response.json();
                setCart(updatedCart);
                setNewItem('');
            }
        } catch (err) {
            console.error('Failed to add item:', err);
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/shopping-cart/items/${itemId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const updatedCart = await response.json();
                setCart(updatedCart);
            }
        } catch (err) {
            console.error('Failed to remove item:', err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Button variant="secondary" onClick={() => navigate('/')} className="!p-2">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
                        <span className="text-2xl">🛒</span>
                        <span>Nákupní seznam</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-4 py-8">
                {/* Add Item Form */}
                <form onSubmit={handleAddItem} className="flex gap-2 mb-8">
                    <div className="relative flex-1">
                        <Input
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            placeholder="Co potřebujete koupit?"
                            className="w-full pr-10"
                        />
                    </div>
                    <Button type="submit" disabled={adding || !newItem.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                        {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    </Button>
                </form>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                        <p className="text-slate-500 font-medium">Načítám váš seznam...</p>
                    </div>
                ) : !cart || cart.items.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm px-6">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingCart className="w-10 h-10 text-emerald-500/50" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Seznam je prázdný</h2>
                        <p className="text-slate-500 max-w-xs mx-auto">
                            Zatím jste si nic neuložili. Začněte přidáním první položky!
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {cart.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm group hover:border-emerald-200 hover:shadow-md transition-all duration-200"
                            >
                                <span className="text-slate-700 font-medium text-lg">{item.value}</span>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="!p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 border-none bg-transparent transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        ))}

                        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500 px-2">
                            <span>Celkem {cart.items.length} položek</span>
                            <button
                                onClick={async () => {
                                    if (confirm('Opravdu chcete vymazat celý seznam?')) {
                                        await authenticatedFetch(`${API_BASE_URL}/api/v1/shopping-cart/clear`, { method: 'DELETE' });
                                        fetchCart();
                                    }
                                }}
                                className="text-red-500 hover:underline font-medium"
                            >
                                Vymazat vše
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
