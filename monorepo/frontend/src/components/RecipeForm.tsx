import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Plus, Trash2, Video, Wand2 } from 'lucide-react';

interface Ingredient {
    name: string;
    amount: string;
    unit?: string;
}

interface Recipe {
    id?: string;
    _id?: string;
    title: string;
    description?: string;
    video_url?: string;
    web_url?: string;
    steps: string[];
    ingredients: Ingredient[];
    tags: string[];
    visibility: string;
}

interface RecipeFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
    initialData?: Partial<Recipe>;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ onSubmit, onCancel, isSubmitting, initialData }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [videoUrl, setVideoUrl] = useState(initialData?.video_url || '');
    const [webUrl, setWebUrl] = useState(initialData?.web_url || '');
    const [steps, setSteps] = useState<string[]>(initialData?.steps || ['']);
    const [ingredients, setIngredients] = useState<Ingredient[]>(initialData?.ingredients || [{ name: '', amount: '', unit: '' }]);
    const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
    const [visibility, setVisibility] = useState(initialData?.visibility || 'public');

    const handleAddStep = () => setSteps([...steps, '']);
    const handleRemoveStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));
    const handleStepChange = (index: number, value: string) => {
        const newSteps = [...steps];
        newSteps[index] = value;
        setSteps(newSteps);
    };

    const handleAddIngredient = () => setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
    const handleRemoveIngredient = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index));
    const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setIngredients(newIngredients);
    };

    const handleSubmit = async (e: React.FormEvent, shouldScrape = false) => {
        e.preventDefault();
        if (!shouldScrape && !title.trim()) return;

        const recipeData = {
            title: title || (shouldScrape ? 'Imported Recipe' : ''),
            description,
            video_url: videoUrl,
            web_url: webUrl,
            steps: steps.filter(s => s.trim() !== ''),
            ingredients: ingredients.filter(i => i.name.trim() !== ''),
            tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
            visibility,
            should_scrape: shouldScrape
        };

        await onSubmit(recipeData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Název receptu *</label>
                    <Input
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Např. Tradiční Carbonara"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Popis</label>
                    <textarea
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Krátce popište váš recept..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        <Video className="w-4 h-4" /> Video URL (YouTube)
                    </label>
                    <Input
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        Webová stránka
                    </label>
                    <div className="flex gap-2">
                        <Input
                            className="flex-1"
                            value={webUrl}
                            onChange={(e) => setWebUrl(e.target.value)}
                            placeholder="https://example.com/recept"
                        />
                        {webUrl && !initialData && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={(e) => handleSubmit(e, true)}
                                className="whitespace-nowrap flex items-center gap-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                disabled={isSubmitting}
                            >
                                <Wand2 className="w-4 h-4" /> Vytvořit z webu
                            </Button>
                        )}
                    </div>
                    {webUrl && !initialData && (
                        <p className="mt-1 text-xs text-slate-500">
                            AI automaticky načte ingredience a postup z uvedené stránky.
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Ingredience</label>
                    {ingredients.map((ing, idx) => (
                        <div key={idx} className="flex gap-2">
                            <Input
                                className="flex-1"
                                placeholder="Název (např. Mouka)"
                                value={ing.name}
                                onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                            />
                            <Input
                                className="w-24"
                                placeholder="Množství"
                                value={ing.amount}
                                onChange={(e) => handleIngredientChange(idx, 'amount', e.target.value)}
                            />
                            <Input
                                className="w-20"
                                placeholder="Jednotka"
                                value={ing.unit}
                                onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                            />
                            {ingredients.length > 1 && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="!p-2 text-red-500 hover:text-red-700"
                                    onClick={() => handleRemoveIngredient(idx)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={handleAddIngredient} className="w-full">
                        <Plus className="w-4 h-4 mr-2" /> Přidat ingredienci
                    </Button>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Postup</label>
                    {steps.map((step, idx) => (
                        <div key={idx} className="flex gap-2">
                            <div className="flex-1">
                                <span className="text-xs text-slate-400 mb-1 block">Krok {idx + 1}</span>
                                <textarea
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[60px]"
                                    value={step}
                                    onChange={(e) => handleStepChange(idx, e.target.value)}
                                    placeholder="Napište instrukce..."
                                />
                            </div>
                            {steps.length > 1 && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="self-end !p-2 mb-1 text-red-500 hover:text-red-700"
                                    onClick={() => handleRemoveStep(idx)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={handleAddStep} className="w-full">
                        <Plus className="w-4 h-4 mr-2" /> Přidat krok
                    </Button>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tagy (oddělené čárkou)</label>
                    <Input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="např. itálie, pasta, rychlé"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Viditelnost</label>
                    <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                    >
                        <option value="public">Veřejný</option>
                        <option value="private">Soukromý</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel} className="flex-1" disabled={isSubmitting}>
                    Zrušit
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? 'Ukládám...' : (initialData ? 'Uložit změny' : 'Vytvořit recept')}
                </Button>
            </div>
        </form>
    );
};
